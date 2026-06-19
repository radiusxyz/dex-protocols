// src/protocols/uniswap/v3/quote.ts

import { mulDiv } from '../../utils/math';

import { MAX_SQRT_RATIO, MIN_SQRT_RATIO, Q192, FEE_DENOMINATOR, MIN_TICK, MAX_TICK } from './constants';
import { addLiquidity, computeSwapStepExactIn } from './swap-math';
import { getSqrtRatioAtTick, getTickAtSqrtRatio, nextInitializedTickWithinOneWord } from './tick-math';
import { Tick, UniswapV3PoolRuntime } from './types';

export type UniswapV3QuoterParams = {
  amountIn: bigint;
  zeroForOne: boolean;
  sqrtPriceLimitX96: bigint;
  runtime: UniswapV3PoolRuntime;
};

export type UniswapV3QuoterReturn = {
  amountOut: bigint;
  sqrtPriceAfterX96: bigint;
  tickAfter: Tick;
  liquidityAfter: bigint;
};

export function normalizeAndValidateLimit(args: {
  sqrtPriceLimitX96: bigint;
  sqrtPriceCurrentX96: bigint;
  zeroForOne: boolean;
}): { sqrtPriceLimitX96: bigint; hasExplicitLimit: boolean } {
  const { sqrtPriceLimitX96, sqrtPriceCurrentX96, zeroForOne } = args;

  const MIN = MIN_SQRT_RATIO;
  const MAX = MAX_SQRT_RATIO;

  const hasExplicitLimit = sqrtPriceLimitX96 !== 0n;

  let limit: bigint;

  // normalize: 0 means "no limit" → use extreme (exactly like core)
  if (sqrtPriceLimitX96 === 0n) {
    if (zeroForOne) {
      limit = MIN + 1n;
    } else {
      limit = MAX - 1n;
    }
  } else {
    limit = sqrtPriceLimitX96;
  }

  // SPL check (exact port of UniswapV3Pool.swap)
  let ok: boolean;

  if (zeroForOne) {
    ok = limit < sqrtPriceCurrentX96 && limit > MIN;
  } else {
    ok = limit > sqrtPriceCurrentX96 && limit < MAX;
  }

  if (!ok) {
    throw new Error('This swap is impossible from the current price in this direction.');
  }

  return { sqrtPriceLimitX96: limit, hasExplicitLimit };
}

export function createQuoter() {
  function quote({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime }: UniswapV3QuoterParams): UniswapV3QuoterReturn {
    const { feePips, tickSpacing } = runtime.info;
    const { liquidity: initialLiquidity, tick: initialTick, sqrtPriceX96: initialSqrtPriceX96 } = runtime.state;
    const { tickBitmap } = runtime._temp;

    // local copies (do not mutate runtime.state)
    let sqrtP = initialSqrtPriceX96;
    let tick = initialTick;
    let liquidity = initialLiquidity;

    let amountRemaining = amountIn;
    let amountOutAcc = 0n;

    if (initialLiquidity === 0n && (!tickBitmap || tickBitmap.size === 0)) {
      throw new Error('Cannot quote against an empty pool (liquidity=0, no initialized ticks)');
    }

    // normalize + validate like chain (SPL)
    const { sqrtPriceLimitX96: sqrtPriceLimit } = normalizeAndValidateLimit({
      sqrtPriceLimitX96,
      sqrtPriceCurrentX96: sqrtP,
      zeroForOne,
    });

    let iters = 0;

    // core: while (remaining != 0 && sqrtP != limit)
    while (amountRemaining > 0n && sqrtP !== sqrtPriceLimit) {
      iters++;
      if (iters > 2_000_000) {
        throw new Error('TOO_MANY_ITERS (likely tick search or SwapMath not progressing)');
      }

      const stepSqrtPriceStart = sqrtP;

      // core: (tickNext, initialized) = nextInitializedTickWithinOneWord(...)
      const { nextTick, initialized } = nextInitializedTickWithinOneWord({
        tick,
        tickSpacing,
        lte: zeroForOne,
        tickBitmap,
      });

      // core: clamp tickNext to MIN_TICK/MAX_TICK
      let tickNext = nextTick;
      if (tickNext < MIN_TICK) {
        tickNext = MIN_TICK;
      } else if (tickNext > MAX_TICK) {
        tickNext = MAX_TICK;
      }

      const sqrtPTick = getSqrtRatioAtTick(tickNext);

      // core target selection:
      // target = (zeroForOne ? (sqrtNext < limit) : (sqrtNext > limit)) ? limit : sqrtNext
      let sqrtPTarget: bigint;

      if (zeroForOne) {
        // price decreasing: choose the higher of (sqrtPTick, sqrtPriceLimit)
        if (sqrtPTick < sqrtPriceLimit) {
          sqrtPTarget = sqrtPriceLimit;
        } else {
          sqrtPTarget = sqrtPTick;
        }
      } else {
        // price increasing: choose the lower of (sqrtPTick, sqrtPriceLimit)
        if (sqrtPTick > sqrtPriceLimit) {
          sqrtPTarget = sqrtPriceLimit;
        } else {
          sqrtPTarget = sqrtPTick;
        }
      }

      if (liquidity <= 0n) {
        // In a valid pool state, liquidity should be > 0 in active range.
        // If you hit this, your reducer/runtime state is inconsistent.
        throw new Error(`QUOTER: LIQUIDITY_NOT_POSITIVE: L=${liquidity} tick=${tick} sqrtP=${sqrtP}`);
      }

      // compute step (exact input only)
      const {
        sqrtPNext,
        amountIn: usedIn,
        amountOut,
        feeAmount,
      } = computeSwapStepExactIn(sqrtP, sqrtPTarget, liquidity, amountRemaining, feePips, zeroForOne);

      // core: remaining -= (amountIn + feeAmount)
      const spent = usedIn + feeAmount;
      amountRemaining = spent >= amountRemaining ? 0n : amountRemaining - spent;

      // core exactInput: amountCalculated -= amountOut (we accumulate positive output)
      amountOutAcc += amountOut;

      sqrtP = sqrtPNext;

      // core: if reached the next price (tick boundary)
      if (sqrtP === sqrtPTick) {
        if (initialized) {
          const liquidityNet = runtime.state.ticks.get(tickNext);
          if (liquidityNet === undefined) {
            throw new Error(`QUOTER: Initialized tick missing liquidityNet at tick=${tickNext}`);
          }

          // In core: if (zeroForOne) liquidityNet = -liquidityNet; then addDelta
          // Your addLiquidity already applies the sign flip for zeroForOne.
          liquidity = addLiquidity(liquidity, liquidityNet, zeroForOne);
        }

        // core: state.tick = zeroForOne ? tickNext - 1 : tickNext
        tick = zeroForOne ? tickNext - 1 : tickNext;
      } else if (sqrtP !== stepSqrtPriceStart) {
        // core: else if price moved, recompute tick
        tick = getTickAtSqrtRatio(sqrtP);
      }

      // loop condition will stop when sqrtP == sqrtPriceLimit
    }

    return {
      amountOut: amountOutAcc,
      sqrtPriceAfterX96: sqrtP,
      tickAfter: tick,
      liquidityAfter: liquidity,
    };
  }

  /**
   * CLMM placeholder: amountOut from mid price + fee, no slippage.
   *
   * Fully pool/edge agnostic: caller must provide priceOutPerIn.
   * priceOutPerIn: how many units of tokenOut per 1 unit of tokenIn.
   * fee: e.g. 0.003 for 0.3%.
   */
  /**
   * Mid-price quote for Uniswap V3 given current sqrtPriceX96.
   * - Includes pool fee (feePips) like 500, 3000, 10000.
   * - Ignores slippage / liquidity / tick crossing (so it's only a "mid" quote).
   *
   * tokenInIsToken0:
   *  - true: token0 -> token1, use price = (sqrtP^2) / Q192
   *  - false: token1 -> token0, use inverse price = Q192 / (sqrtP^2)
   */
  function quoteMidFeePips(
    amountIn: bigint,
    sqrtPriceX96: bigint,
    tokenInIsToken0: boolean,
    feePips: number,
  ): bigint | null {
    if (amountIn <= 0n) {
      return null;
    }
    if (sqrtPriceX96 <= 0n) {
      return null;
    }

    // Uniswap V3: fee is in hundredths of a bip = 1e-6
    // e.g. 3000 => 0.003, multiplier = (1_000_000 - 3000) / 1_000_000
    if (!Number.isInteger(feePips) || feePips < 0 || feePips > 1_000_000) {
      return null;
    }

    const fee = BigInt(feePips);

    // amountInWithFee = floor(amountIn * (FEE_DENOMINATOR - fee) / FEE_DENOMINATOR)
    // (floor is fine; Uniswap swaps effectively floor at each step too)
    const amountInWithFee = (amountIn * (FEE_DENOMINATOR - fee)) / FEE_DENOMINATOR;
    if (amountInWithFee <= 0n) {
      return null;
    }

    // priceX192 = sqrtPriceX96^2 (this is already scaled by Q192)
    const priceX192 = sqrtPriceX96 * sqrtPriceX96;

    let amountOut: bigint;
    if (tokenInIsToken0) {
      // out = floor(amountInWithFee * priceX192 / Q192)
      amountOut = mulDiv(amountInWithFee, priceX192, Q192);
    } else {
      // out = floor(amountInWithFee * Q192 / priceX192)
      amountOut = mulDiv(amountInWithFee, Q192, priceX192);
    }

    return amountOut > 0n ? amountOut : null;
  }
  return { quote, quoteMidFeePips };
}
