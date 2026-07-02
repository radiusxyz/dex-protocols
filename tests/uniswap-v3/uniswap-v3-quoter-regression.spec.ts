import { describe, expect, it } from 'vitest';

import { getAmount0Delta, getAmount1Delta } from '../../src/core/clmm/swap-math';
import { getSqrtRatioAtTick, nextInitializedTickWithinOneWord } from '../../src/core/clmm/tick-math';
import type { TickBitmap } from '../../src/core/clmm/types';
import { uniswapV3Module } from '../../src/uniswap/v3';
import { mulDivRoundingUp } from '../../src/utils/math';

import { capturedUniswapV3Fixture } from './captured-fixture';
import { uniswapV3BoundaryQuoteCases, uniswapV3GeometricProgressiveQuoteCases } from './quoter-regression-fixtures';

function quote(args: { amountIn: bigint; zeroForOne: boolean; sqrtPriceLimitX96: bigint }) {
  const runtime = uniswapV3Module.reducer.init(capturedUniswapV3Fixture.info, capturedUniswapV3Fixture.state);

  return uniswapV3Module.quoter.quote({
    runtime,
    amountIn: args.amountIn,
    zeroForOne: args.zeroForOne,
    sqrtPriceLimitX96: args.sqrtPriceLimitX96,
  });
}

function grossUpForFee(amountInNoFee: bigint, fee: number): bigint {
  const feeDenominator = 1_000_000n;
  return mulDivRoundingUp(amountInNoFee, feeDenominator, feeDenominator - BigInt(fee));
}

function findNextInitializedTick(args: {
  tick: number;
  tickSpacing: number;
  zeroForOne: boolean;
  tickBitmap: TickBitmap;
  maxHops?: number;
}): number {
  let tick = args.tick;
  const maxHops = args.maxHops ?? 2048;

  for (let hop = 0; hop < maxHops; hop += 1) {
    const { nextTick, initialized } = nextInitializedTickWithinOneWord({
      tick,
      tickSpacing: args.tickSpacing,
      lte: args.zeroForOne,
      tickBitmap: args.tickBitmap,
    });

    if (initialized) {
      return nextTick;
    }

    tick = args.zeroForOne ? nextTick - 1 : nextTick + 1;
  }

  throw new Error(`Could not find initialized tick within ${maxHops} hops`);
}

describe('Uniswap V3 captured quoter regressions', () => {
  it('quotes a geometric progressive input ladder from a captured pool-state fixture', () => {
    for (const [
      amountIn,
      zeroForOne,
      sqrtPriceLimitX96,
      amountOut,
      sqrtPriceAfterX96,
      tickAfter,
      liquidityAfter,
    ] of uniswapV3GeometricProgressiveQuoteCases) {
      const result = quote({ amountIn, zeroForOne, sqrtPriceLimitX96 });

      expect(result).toEqual({
        amountOut,
        sqrtPriceAfterX96,
        tickAfter,
        liquidityAfter,
      });
    }
  });

  it('quotes deterministic tick-boundary windows from a captured pool-state fixture', () => {
    const runtime = uniswapV3Module.reducer.init(capturedUniswapV3Fixture.info, capturedUniswapV3Fixture.state);
    const tickCurr = capturedUniswapV3Fixture.state.tick;
    const sqrtPCurr = capturedUniswapV3Fixture.state.sqrtPriceX96;
    const liquidity = capturedUniswapV3Fixture.state.liquidity;
    const tickSpacing = capturedUniswapV3Fixture.info.tickSpacing;
    const feePips = capturedUniswapV3Fixture.info.feePips;

    for (const [
      mode,
      nextTick,
      delta,
      amountIn,
      zeroForOne,
      sqrtPriceLimitX96,
      amountOut,
      sqrtPriceAfterX96,
      tickAfter,
      liquidityAfter,
    ] of uniswapV3BoundaryQuoteCases) {
      const computedNextTick = findNextInitializedTick({
        tick: tickCurr,
        tickSpacing,
        zeroForOne,
        tickBitmap: runtime._temp.tickBitmap,
      });
      expect(computedNextTick).toBe(nextTick);

      const sqrtPTarget = getSqrtRatioAtTick(nextTick);
      const targetSqrtPriceLimitX96 = mode === 'clamp' ? (zeroForOne ? sqrtPTarget + 1n : sqrtPTarget - 1n) : 0n;
      const targetSqrt = mode === 'clamp' ? targetSqrtPriceLimitX96 : sqrtPTarget;
      const amountInNoFee = zeroForOne
        ? getAmount0Delta(targetSqrt, sqrtPCurr, liquidity, true)
        : getAmount1Delta(sqrtPCurr, targetSqrt, liquidity, true);
      const amountInTarget = grossUpForFee(amountInNoFee, feePips);

      expect(sqrtPriceLimitX96).toBe(targetSqrtPriceLimitX96);
      expect(amountIn).toBe(amountInTarget + delta);

      const result = quote({ amountIn, zeroForOne, sqrtPriceLimitX96 });

      expect(result).toEqual({
        amountOut,
        sqrtPriceAfterX96,
        tickAfter,
        liquidityAfter,
      });
    }
  });
});
