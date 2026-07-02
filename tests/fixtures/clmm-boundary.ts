import { getAmount0Delta, getAmount1Delta } from '../../src/core/clmm/swap-math';
import { getSqrtRatioAtTick, nextInitializedTickWithinOneWord } from '../../src/core/clmm/tick-math';
import type { TickBitmap } from '../../src/core/clmm/types';
import { mulDivRoundingUp } from '../../src/utils/math';

export type BoundaryQuoteCase = {
  mode: 'natural' | 'clamp';
  nextTick: number;
  delta: bigint;
  amountIn: bigint;
  zeroForOne: boolean;
  sqrtPriceLimitX96: bigint;
};

export function grossUpForFee(amountInNoFee: bigint, fee: number): bigint {
  const feeDenominator = 1_000_000n;
  return mulDivRoundingUp(amountInNoFee, feeDenominator, feeDenominator - BigInt(fee));
}

export function findNextInitializedTick(args: {
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

export function buildBoundaryQuoteCases(args: {
  tick: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tickSpacing: number;
  tickBitmap: TickBitmap;
  feePips: number;
}): BoundaryQuoteCase[] {
  const cases: BoundaryQuoteCase[] = [];

  for (const zeroForOne of [true, false]) {
    const nextTick = findNextInitializedTick({
      tick: args.tick,
      tickSpacing: args.tickSpacing,
      zeroForOne,
      tickBitmap: args.tickBitmap,
    });
    const sqrtPTarget = getSqrtRatioAtTick(nextTick);

    for (const mode of ['natural', 'clamp'] as const) {
      const sqrtPriceLimitX96 = mode === 'clamp' ? (zeroForOne ? sqrtPTarget + 1n : sqrtPTarget - 1n) : 0n;
      const targetSqrt = mode === 'clamp' ? sqrtPriceLimitX96 : sqrtPTarget;
      const amountInNoFee = zeroForOne
        ? getAmount0Delta(targetSqrt, args.sqrtPriceX96, args.liquidity, true)
        : getAmount1Delta(args.sqrtPriceX96, targetSqrt, args.liquidity, true);
      const amountInTarget = grossUpForFee(amountInNoFee, args.feePips);

      for (const delta of [-1n, 0n, 1n]) {
        cases.push({
          mode,
          nextTick,
          delta,
          amountIn: amountInTarget + delta,
          zeroForOne,
          sqrtPriceLimitX96,
        });
      }
    }
  }

  return cases;
}

export function getMaxObservationTimestamp(
  observations: ReadonlyMap<number, { blockTimestamp: number; initialized: boolean }>,
): number {
  let blockTimestamp = 0;

  for (const observation of observations.values()) {
    if (observation.initialized && observation.blockTimestamp > blockTimestamp) {
      blockTimestamp = observation.blockTimestamp;
    }
  }

  if (blockTimestamp === 0) {
    throw new Error('No initialized observations found');
  }

  return blockTimestamp;
}
