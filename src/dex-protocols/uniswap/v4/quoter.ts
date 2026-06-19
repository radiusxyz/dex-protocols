import { MAX_SQRT_RATIO, MAX_TICK, MIN_SQRT_RATIO, MIN_TICK } from '../../core/clmm/constants';
import { addLiquidity } from '../../core/clmm/swap-math';
import {
  getSqrtRatioAtTick,
  getTickAtSqrtRatio,
  nextInitializedTickWithinOneWord,
} from '../../core/clmm/tick-math';
import type { Tick } from '../../core/clmm/types';
import type { UniswapV4PoolRuntime } from './types';

import { LPFeeLibrary } from './contract-math/LPFeeLibrary';
import { ProtocolFeeLibrary } from './contract-math/ProtocolFeeLibrary';
import { SwapMath } from './contract-math/SwapMath';

export type UniswapV4QuoterParams = {
  amountIn: bigint;
  zeroForOne: boolean;
  sqrtPriceLimitX96: bigint;
  runtime: UniswapV4PoolRuntime;
};

export type UniswapV4QuoterReturn = {
  amountOut: bigint;
  amountInConsumed: bigint;
  feeAmount: bigint;
  sqrtPriceAfterX96: bigint;
  tickAfter: Tick;
  liquidityAfter: bigint;
  swapFeePips: bigint;
  /**
   * Signed trader-side deltas:
   * - negative: token paid by trader
   * - positive: token received by trader
   */
  amount0Delta: bigint;
  amount1Delta: bigint;
};

function normalizeAndValidateLimit(args: {
  sqrtPriceLimitX96: bigint;
  sqrtPriceCurrentX96: bigint;
  zeroForOne: boolean;
}): bigint {
  const { sqrtPriceLimitX96, sqrtPriceCurrentX96, zeroForOne } = args;

  let limit = sqrtPriceLimitX96;
  if (limit === 0n) {
    limit = zeroForOne ? MIN_SQRT_RATIO + 1n : MAX_SQRT_RATIO - 1n;
  }

  const isValid = zeroForOne
    ? limit < sqrtPriceCurrentX96 && limit > MIN_SQRT_RATIO
    : limit > sqrtPriceCurrentX96 && limit < MAX_SQRT_RATIO;
  if (!isValid) {
    throw new Error('UniswapV4 price limit is impossible from the current price in this direction.');
  }

  return limit;
}

export function createQuoter() {
  function quote({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime }: UniswapV4QuoterParams): UniswapV4QuoterReturn {
    if (amountIn <= 0n) {
      throw new Error(`UniswapV4 quote expects amountIn > 0, got ${amountIn.toString()}`);
    }

    const { tickSpacing } = runtime.info;
    const { slot0, liquidity: initialLiquidity, ticks } = runtime.state;
    const { tickBitmap } = runtime._temp;

    let sqrtP = slot0.sqrtPriceX96;
    let tick = slot0.tick;
    let liquidity = initialLiquidity;

    if (initialLiquidity === 0n && tickBitmap.size === 0) {
      throw new Error('Cannot quote against an empty UniswapV4 pool (liquidity=0, no initialized ticks)');
    }

    const protocolFeePips = zeroForOne
      ? ProtocolFeeLibrary.getZeroForOneFee(slot0.protocolFee)
      : ProtocolFeeLibrary.getOneForZeroFee(slot0.protocolFee);
    const effectiveLpFeePips = LPFeeLibrary.getInitialLPFee(slot0.lpFee);

    const swapFeePips =
      protocolFeePips === 0n
        ? effectiveLpFeePips
        : ProtocolFeeLibrary.calculateSwapFee(protocolFeePips, effectiveLpFeePips);
    if (swapFeePips >= SwapMath.MAX_SWAP_FEE) {
      throw new Error(`UniswapV4 swap fee too large for exact-in quote: ${swapFeePips.toString()}`);
    }

    const limit = normalizeAndValidateLimit({
      sqrtPriceLimitX96,
      sqrtPriceCurrentX96: sqrtP,
      zeroForOne,
    });

    let amountSpecifiedRemaining = -amountIn;
    let amountCalculated = 0n;
    let feeAmountAcc = 0n;
    let iterations = 0;

    while (amountSpecifiedRemaining !== 0n && sqrtP !== limit) {
      iterations++;
      if (iterations > 64) {
        throw new Error('TOO_MANY_ITERS (likely tick search or swap math not progressing)');
      }

      const stepSqrtPriceStart = sqrtP;
      const { nextTick, initialized } = nextInitializedTickWithinOneWord({
        tick,
        tickSpacing,
        lte: zeroForOne,
        tickBitmap,
      });

      let boundedNextTick = nextTick;
      if (boundedNextTick < MIN_TICK) {
        boundedNextTick = MIN_TICK;
      } else if (boundedNextTick > MAX_TICK) {
        boundedNextTick = MAX_TICK;
      }

      const sqrtPriceAtNextTick = getSqrtRatioAtTick(boundedNextTick);

      if (liquidity <= 0n) {
        throw new Error(
          `UNISWAP_V4_QUOTER: LIQUIDITY_NOT_POSITIVE: L=${liquidity.toString()} tick=${tick} sqrtP=${sqrtP.toString()}`,
        );
      }

      const {
        sqrtPriceNextX96,
        amountIn: usedIn,
        amountOut,
        feeAmount,
      } = SwapMath.computeSwapStep(
        sqrtP,
        SwapMath.getSqrtPriceTarget(zeroForOne, sqrtPriceAtNextTick, limit),
        liquidity,
        amountSpecifiedRemaining,
        swapFeePips,
      );

      amountSpecifiedRemaining += usedIn + feeAmount;
      amountCalculated += amountOut;
      feeAmountAcc += feeAmount;
      sqrtP = sqrtPriceNextX96;

      if (sqrtP === sqrtPriceAtNextTick) {
        if (initialized) {
          const tickInfo = ticks.get(boundedNextTick);
          if (tickInfo === undefined) {
            throw new Error(`UNISWAP_V4_QUOTER: initialized tick missing at tick=${boundedNextTick}`);
          }
          liquidity = addLiquidity(liquidity, tickInfo.liquidityNet, zeroForOne);
        }
        tick = zeroForOne ? boundedNextTick - 1 : boundedNextTick;
      } else if (sqrtP !== stepSqrtPriceStart) {
        tick = getTickAtSqrtRatio(sqrtP);
      }
    }

    const specifiedDelta = -amountIn - amountSpecifiedRemaining;
    const amount0Delta = zeroForOne ? specifiedDelta : amountCalculated;
    const amount1Delta = zeroForOne ? amountCalculated : specifiedDelta;
    const amountInConsumed = amountIn + amountSpecifiedRemaining;

    return {
      amountOut: amountCalculated,
      amountInConsumed,
      feeAmount: feeAmountAcc,
      sqrtPriceAfterX96: sqrtP,
      tickAfter: tick,
      liquidityAfter: liquidity,
      swapFeePips,
      amount0Delta,
      amount1Delta,
    };
  }

  return { quote };
}
