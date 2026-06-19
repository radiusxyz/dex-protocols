import { mulDiv } from '@src/utils/math';

import { addLiquidity, computeSwapStepExactIn } from './clmm-swap-math';
import { FEE_DENOMINATOR, MAX_SQRT_RATIO, MAX_TICK, MIN_SQRT_RATIO, MIN_TICK, Q256 } from './constants';
import { getSqrtRatioAtTick, getTickAtSqrtRatio, nextInitializedTickWithinOneWord } from './tick-math';

export type EkuboCommonRuntime = {
  info: {
    feePips: number;
    tickSpacing: number;
  };
  state: {
    sqrtRatioX128: bigint;
    tick: number;
    liquidity: bigint;
    ticks: Map<number, bigint>;
  };
  _temp: {
    tickBitmap: Map<number, bigint>;
  };
};

export type EkuboCommonQuoterParams<TRuntime extends EkuboCommonRuntime> = {
  amountIn: bigint;
  zeroForOne: boolean;
  sqrtRatioLimitX128: bigint;
  runtime: TRuntime;
};

export type EkuboCommonQuoterReturn = {
  amountOut: bigint;
  sqrtRatioAfterX128: bigint;
  tickAfter: number;
  liquidityAfter: bigint;
};

export function normalizeAndValidateLimit(args: {
  sqrtRatioLimitX128: bigint;
  sqrtRatioCurrentX128: bigint;
  zeroForOne: boolean;
}): bigint {
  const { sqrtRatioLimitX128, sqrtRatioCurrentX128, zeroForOne } = args;

  const limit =
    sqrtRatioLimitX128 === 0n ? (zeroForOne ? MIN_SQRT_RATIO + 1n : MAX_SQRT_RATIO - 1n) : sqrtRatioLimitX128;

  const ok = zeroForOne
    ? limit < sqrtRatioCurrentX128 && limit > MIN_SQRT_RATIO
    : limit > sqrtRatioCurrentX128 && limit < MAX_SQRT_RATIO;

  if (!ok) {
    throw new Error('This swap is impossible from the current price in this direction.');
  }

  return limit;
}

export function quoteExactIn<TRuntime extends EkuboCommonRuntime>({
  amountIn,
  zeroForOne,
  sqrtRatioLimitX128,
  runtime,
}: EkuboCommonQuoterParams<TRuntime>): EkuboCommonQuoterReturn {
  const { feePips, tickSpacing } = runtime.info;
  const { liquidity: initialLiquidity, tick: initialTick, sqrtRatioX128: initialSqrtRatioX128 } = runtime.state;
  const { tickBitmap } = runtime._temp;

  let sqrtP = initialSqrtRatioX128;
  let tick = initialTick;
  let liquidity = initialLiquidity;
  let amountRemaining = amountIn;
  let amountOutAcc = 0n;

  if (initialLiquidity === 0n && tickBitmap.size === 0) {
    throw new Error('Cannot quote against an empty pool (liquidity=0, no initialized ticks)');
  }

  const sqrtRatioLimit = normalizeAndValidateLimit({
    sqrtRatioLimitX128,
    sqrtRatioCurrentX128: sqrtP,
    zeroForOne,
  });

  let iters = 0;
  while (amountRemaining > 0n && sqrtP !== sqrtRatioLimit) {
    iters++;
    if (iters > 2_000_000) {
      throw new Error('TOO_MANY_ITERS');
    }

    const stepSqrtPriceStart = sqrtP;
    const { nextTick, initialized } = nextInitializedTickWithinOneWord({
      tick,
      tickSpacing,
      lte: zeroForOne,
      tickBitmap,
    });

    let tickNext = nextTick;
    if (tickNext < MIN_TICK) {
      tickNext = MIN_TICK;
    } else if (tickNext > MAX_TICK) {
      tickNext = MAX_TICK;
    }

    const sqrtPTick = getSqrtRatioAtTick(tickNext);
    const sqrtPTarget = zeroForOne
      ? sqrtPTick < sqrtRatioLimit
        ? sqrtRatioLimit
        : sqrtPTick
      : sqrtPTick > sqrtRatioLimit
        ? sqrtRatioLimit
        : sqrtPTick;

    if (liquidity <= 0n) {
      throw new Error(`LIQUIDITY_NOT_POSITIVE: L=${liquidity} tick=${tick} sqrtP=${sqrtP}`);
    }

    const {
      sqrtPNext,
      amountIn: usedIn,
      amountOut,
      feeAmount,
    } = computeSwapStepExactIn(sqrtP, sqrtPTarget, liquidity, amountRemaining, feePips, zeroForOne);

    const spent = usedIn + feeAmount;
    amountRemaining = spent >= amountRemaining ? 0n : amountRemaining - spent;
    amountOutAcc += amountOut;
    sqrtP = sqrtPNext;

    if (sqrtP === sqrtPTick) {
      if (initialized) {
        const liquidityNet = runtime.state.ticks.get(tickNext);
        if (liquidityNet === undefined) {
          throw new Error(`Initialized tick missing liquidityNet at tick=${tickNext}`);
        }
        liquidity = addLiquidity(liquidity, liquidityNet, zeroForOne);
      }
      tick = zeroForOne ? tickNext - 1 : tickNext;
    } else if (sqrtP !== stepSqrtPriceStart) {
      tick = getTickAtSqrtRatio(sqrtP);
    }
  }

  return {
    amountOut: amountOutAcc,
    sqrtRatioAfterX128: sqrtP,
    tickAfter: tick,
    liquidityAfter: liquidity,
  };
}

export function quoteMidFeePips(
  amountIn: bigint,
  sqrtRatioX128: bigint,
  tokenInIsToken0: boolean,
  feePips: number,
): bigint | null {
  if (amountIn <= 0n || sqrtRatioX128 <= 0n) {
    return null;
  }
  if (!Number.isInteger(feePips) || feePips < 0 || feePips > 1_000_000) {
    return null;
  }

  const amountInWithFee = (amountIn * (FEE_DENOMINATOR - BigInt(feePips))) / FEE_DENOMINATOR;
  if (amountInWithFee <= 0n) {
    return null;
  }

  const priceX256 = sqrtRatioX128 * sqrtRatioX128;
  const amountOut = tokenInIsToken0
    ? mulDiv(amountInWithFee, priceX256, Q256)
    : mulDiv(amountInWithFee, Q256, priceX256);

  return amountOut > 0n ? amountOut : null;
}
