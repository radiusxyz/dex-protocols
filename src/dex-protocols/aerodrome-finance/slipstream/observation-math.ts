// src/dex-protocols/aerodrome-finance/slipstream/observation-math.ts

import { U32 } from '@src/dex-protocols/aerodrome-finance/slipstream/constants';

// --- Types you already have ---
export type Observation = {
  blockTimestamp: number; // u32
  tickCumulative: bigint; // i64 in Rust
  secondsPerLiquidityCumulativeX128: bigint; // U256
  initialized: boolean;
};

export type ObservationState = {
  observations: Map<number, Observation>; // ring slot index -> observation
  observationIndex: number; // u16
  observationCardinality: number; // u16
};

function getObs(vec: Observation[], idx: number): Observation {
  const observation = vec[idx];
  if (!observation) {
    throw new Error(`Missing observation at idx=${idx}`);
  }
  return observation;
}

function u32(x: number): number {
  // force into [0, 2^32)
  return ((x % U32) + U32) % U32;
}

function u32Sub(a: number, b: number): number {
  // (a - b) mod 2^32, result in [0, 2^32)
  return u32(a - b);
}

// --- Helpers (match Rust semantics) ---

function lte(time: number, a: number, b: number): boolean {
  // Rust:
  // if a <= time && b <= time: a <= b
  // else adjust by adding 2^32 to values <= time
  if (a <= time && b <= time) {
    return a <= b;
  }

  const TWO_32 = 2 ** 32; // safe in JS number
  const aAdj = a > time ? a : a + TWO_32;
  const bAdj = b > time ? b : b + TWO_32;
  return aAdj <= bAdj;
}

function safeU256Add(a: bigint, b: bigint): bigint {
  const r = a + b;
  if (r < 0n) {
    throw new Error('U256 underflow');
  }
  return r;
}
function safeU256Sub(a: bigint, b: bigint): bigint {
  const r = a - b;
  if (r < 0n) {
    throw new Error('U256 underflow');
  }
  return r;
}
function safeU256Mul(a: bigint, b: bigint): bigint {
  const r = a * b;
  if (r < 0n) {
    throw new Error('U256 underflow');
  }
  return r;
}
function safeU256Div(a: bigint, b: bigint): bigint {
  if (b === 0n) {
    throw new Error('divide by zero');
  }
  const r = a / b;
  if (r < 0n) {
    throw new Error('U256 underflow');
  }
  return r;
}

function transform(before: Observation, target: number, tick: number, liquidity: bigint): Observation {
  const delta = u32Sub(target, before.blockTimestamp); // u32 wrap not handled here; Rust uses plain sub
  if (delta < 0) {
    throw new Error('transform: target < before.blockTimestamp');
  }

  const tickCumulative = before.tickCumulative + BigInt(tick) * BigInt(delta);

  // secondsPerLiquidityCumulativeX128 += (delta << 128) / liquidity (if liquidity > 0)
  let secondsPerLiquidityCumulativeX128 = before.secondsPerLiquidityCumulativeX128;
  if (liquidity > 0n) {
    const add = (BigInt(delta) << 128n) / liquidity;
    secondsPerLiquidityCumulativeX128 = safeU256Add(secondsPerLiquidityCumulativeX128, add);
  }

  return {
    blockTimestamp: target,
    tickCumulative,
    secondsPerLiquidityCumulativeX128,
    initialized: true,
  };
}

// Build a dense vec like Rust's Vec<Observation> where missing indices become default Observation
function buildDenseObservationVec(state: ObservationState): Observation[] {
  // Rust allows indices up to whatever was upserted, but observe assumes indices exist (< len)
  // We'll size to max(maxKey+1, cardinality) so ring indexing works.
  let maxKey = -1;
  for (const k of state.observations.keys()) {
    if (k > maxKey) {
      maxKey = k;
    }
  }

  const needed = Math.max(maxKey + 1, state.observationCardinality);
  const out = new Array<Observation>(needed);

  // Rust default Observation has initialized=false, timestamps=0, cumulatives=0.
  for (let i = 0; i < needed; i++) {
    out[i] = {
      blockTimestamp: 0,
      tickCumulative: 0n,
      secondsPerLiquidityCumulativeX128: 0n,
      initialized: false,
    };
  }

  for (const [idx, observation] of state.observations.entries()) {
    if (idx >= 0 && idx < needed) {
      out[idx] = observation;
    }
  }

  return out;
}

function observationIndexErr(idx: number, index: number, cardinality: number, len: number): never {
  throw new Error(`Observation index ${idx} out of bounds (len=${len}), index=${index} cardinality=${cardinality}`);
}

// --- Core functions (mirror Rust) ---

function binarySearch(
  observationsVec: Observation[],
  time: number,
  target: number,
  index: number,
  cardinality: number,
): [Observation, Observation] {
  if (observationsVec.length === 0) {
    throw new Error('No observations available');
  }

  let l = (index + 1) % cardinality;
  let r = l + cardinality - 1;

  while (true) {
    const i = Math.floor((l + r) / 2);
    const beforeIdx = i % cardinality;

    if (beforeIdx >= observationsVec.length) {
      observationIndexErr(beforeIdx, index, cardinality, observationsVec.length);
    }
    const beforeOrAt = getObs(observationsVec, beforeIdx);

    if (!beforeOrAt.initialized) {
      l = i + 1;
      continue;
    }

    const afterIdx = (i + 1) % cardinality;
    if (afterIdx >= observationsVec.length) {
      observationIndexErr(afterIdx, index, cardinality, observationsVec.length);
    }
    const atOrAfter = getObs(observationsVec, afterIdx);

    const targetAtOrAfter = lte(time, beforeOrAt.blockTimestamp, target);
    if (targetAtOrAfter && lte(time, target, atOrAfter.blockTimestamp)) {
      return [beforeOrAt, atOrAfter];
    }

    if (!targetAtOrAfter) {
      if (i === 0) {
        break;
      }
      r = i - 1;
    } else {
      l = i + 1;
    }
  }

  throw new Error('Binary search failed — inconsistent data');
}

function getSurroundingObservations(
  observationsVec: Observation[],
  time: number,
  target: number,
  tick: number,
  index: number,
  liquidity: bigint,
  cardinality: number,
): [Observation, Observation] {
  const idx = index;
  if (idx >= observationsVec.length) {
    observationIndexErr(idx, index, cardinality, observationsVec.length);
  }

  let beforeOrAt = getObs(observationsVec, idx);

  // if newest is <= target, we can either return it or transform forward to target
  if (lte(time, beforeOrAt.blockTimestamp, target)) {
    if (beforeOrAt.blockTimestamp === target) {
      return [beforeOrAt, beforeOrAt];
    }
    return [beforeOrAt, transform(beforeOrAt, target, tick, liquidity)];
  }

  // otherwise try the oldest observation at (index+1) % cardinality
  const nextIdx = (index + 1) % cardinality;
  if (nextIdx >= observationsVec.length) {
    observationIndexErr(nextIdx, index, cardinality, observationsVec.length);
  }

  beforeOrAt = getObs(observationsVec, nextIdx);
  if (!beforeOrAt.initialized) {
    if (observationsVec.length === 0) {
      throw new Error('No observations available');
    }
    beforeOrAt = getObs(observationsVec, nextIdx);
  }

  if (!lte(time, beforeOrAt.blockTimestamp, target)) {
    throw new Error('Target too old (after oldest observation)');
  }

  return binarySearch(observationsVec, time, target, index, cardinality);
}

function observeSingle(
  observationsVec: Observation[],
  time: number,
  secondsAgo: number,
  tick: number,
  index: number,
  liquidity: bigint,
  cardinality: number,
): { tickCumulative: bigint; secondsPerLiquidityCumulativeX128: bigint } {
  if (cardinality === 0) {
    throw new Error('Cardinality must be > 0');
  }

  if (secondsAgo === 0) {
    if (index >= observationsVec.length) {
      observationIndexErr(index, index, cardinality, observationsVec.length);
    }
    let last = getObs(observationsVec, index);
    if (last.blockTimestamp !== time) {
      last = transform(last, time, tick, liquidity);
    }
    return {
      tickCumulative: last.tickCumulative,
      secondsPerLiquidityCumulativeX128: last.secondsPerLiquidityCumulativeX128,
    };
  }

  const target = u32Sub(time, secondsAgo);

  const [beforeOrAt, atOrAfter] = getSurroundingObservations(
    observationsVec,
    time,
    target,
    tick,
    index,
    liquidity,
    cardinality,
  );

  if (target === beforeOrAt.blockTimestamp) {
    return {
      tickCumulative: beforeOrAt.tickCumulative,
      secondsPerLiquidityCumulativeX128: beforeOrAt.secondsPerLiquidityCumulativeX128,
    };
  }
  if (target === atOrAfter.blockTimestamp) {
    return {
      tickCumulative: atOrAfter.tickCumulative,
      secondsPerLiquidityCumulativeX128: atOrAfter.secondsPerLiquidityCumulativeX128,
    };
  }

  const observationTimeDelta = u32Sub(atOrAfter.blockTimestamp, beforeOrAt.blockTimestamp);
  const targetDelta = u32Sub(target, beforeOrAt.blockTimestamp);

  const tickCumulative =
    beforeOrAt.tickCumulative +
    ((atOrAfter.tickCumulative - beforeOrAt.tickCumulative) * BigInt(targetDelta)) / BigInt(observationTimeDelta);

  // secondsPerLiquidity interpolation (match Rust safe math)
  const delta = safeU256Sub(atOrAfter.secondsPerLiquidityCumulativeX128, beforeOrAt.secondsPerLiquidityCumulativeX128);
  const scaled = safeU256Div(safeU256Mul(delta, BigInt(targetDelta)), BigInt(observationTimeDelta));
  const secLiq = safeU256Add(beforeOrAt.secondsPerLiquidityCumulativeX128, scaled);

  return { tickCumulative, secondsPerLiquidityCumulativeX128: secLiq };
}

// --- The function you asked for ---
export function observeTickCumulativesSlipstream(args: {
  time: number; // blockTimestamp u32
  secondsAgos: [number, number]; // [600, 0] typically
  tick: number; // current tick
  observationState: ObservationState;
  liquidity: bigint; // u128 in Rust -> bigint here
}): bigint[] {
  const { time, secondsAgos, tick, observationState, liquidity } = args;

  const cardinality = observationState.observationCardinality;
  const index = observationState.observationIndex;

  if (index < 0 || index >= cardinality) {
    throw new Error(`Invalid observationIndex=${index} for cardinality=${cardinality}`);
  }

  if (cardinality === 0) {
    throw new Error('Cardinality must be > 0');
  }

  const observationsVec = buildDenseObservationVec(observationState);

  const out: bigint[] = [];
  for (const secondsAgo of secondsAgos) {
    const { tickCumulative } = observeSingle(observationsVec, time, secondsAgo, tick, index, liquidity, cardinality);
    out.push(tickCumulative);
  }
  return out;
}
