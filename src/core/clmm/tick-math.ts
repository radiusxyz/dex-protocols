import {
  MAX_SQRT_RATIO,
  MAX_TICK,
  MAX_UINT256,
  MIN_SQRT_RATIO,
  MIN_TICK,
  POWERS_OF_2,
  Q32,
} from './constants';

import { BitMapWord, BitPos, WordPos } from './types';

// helpers
function mulShift(val: bigint, mulByHex: string): bigint {
  const mulBy = BigInt(mulByHex);
  return (val * mulBy) >> 128n;
}

export function compressTickFloor(tick: number, tickSpacing: number): bigint {
  if (tickSpacing <= 0) {
    throw new Error('tickSpacing must be > 0');
  }
  // Uniswap core: compressed = tick / tickSpacing rounded toward -inf
  const t = BigInt(tick);
  const s = BigInt(tickSpacing);
  let compressed = t / s; // trunc toward 0
  if (t < 0n && t % s !== 0n) {
    compressed -= 1n;
  } // fix to floor for negatives
  return compressed;
}

export function position(compressed: bigint): { wordPos: WordPos; bitPos: BitPos } {
  // wordPos = floor(compressed / 256), bitPos = mod(compressed, 256) in [0..255]
  const m = 256n;
  let word = compressed / m; // trunc toward 0
  let rem = compressed % m; // can be negative
  if (rem < 0n) {
    rem += m;
    word -= 1n;
  }
  // safe for v3 tick ranges
  return { wordPos: Number(word), bitPos: Number(rem) };
}

export function leastSignificantBit(x: bigint): number {
  if (x <= 0n) {
    throw new Error('lsb requires x > 0');
  }
  let r = 0;
  let v = x;
  while ((v & 1n) === 0n) {
    v >>= 1n;
    r++;
  }
  return r; // 0..255
}

export function mostSignificantBit(x: bigint): number {
  if (x <= 0n) {
    throw new Error('ZERO');
  }
  if (x > MAX_UINT256) {
    throw new Error('MAX');
  }

  let msb = 0;

  for (const [power, min] of POWERS_OF_2) {
    if (x >= min) {
      x >>= BigInt(power);
      msb += power;
    }
  }

  return msb;
}

export function getSqrtRatioAtTick(tick: number): bigint {
  if (!Number.isInteger(tick) || tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error('TICK');
  }

  const absTick = tick < 0 ? -tick : tick;

  let ratio = (absTick & 0x1) !== 0 ? 0xfffcb933bd6fad37aa2d162d1a594001n : 0x100000000000000000000000000000000n;

  if ((absTick & 0x2) !== 0) {
    ratio = mulShift(ratio, '0xfff97272373d413259a46990580e213a');
  }
  if ((absTick & 0x4) !== 0) {
    ratio = mulShift(ratio, '0xfff2e50f5f656932ef12357cf3c7fdcc');
  }
  if ((absTick & 0x8) !== 0) {
    ratio = mulShift(ratio, '0xffe5caca7e10e4e61c3624eaa0941cd0');
  }
  if ((absTick & 0x10) !== 0) {
    ratio = mulShift(ratio, '0xffcb9843d60f6159c9db58835c926644');
  }
  if ((absTick & 0x20) !== 0) {
    ratio = mulShift(ratio, '0xff973b41fa98c081472e6896dfb254c0');
  }
  if ((absTick & 0x40) !== 0) {
    ratio = mulShift(ratio, '0xff2ea16466c96a3843ec78b326b52861');
  }
  if ((absTick & 0x80) !== 0) {
    ratio = mulShift(ratio, '0xfe5dee046a99a2a811c461f1969c3053');
  }
  if ((absTick & 0x100) !== 0) {
    ratio = mulShift(ratio, '0xfcbe86c7900a88aedcffc83b479aa3a4');
  }
  if ((absTick & 0x200) !== 0) {
    ratio = mulShift(ratio, '0xf987a7253ac413176f2b074cf7815e54');
  }
  if ((absTick & 0x400) !== 0) {
    ratio = mulShift(ratio, '0xf3392b0822b70005940c7a398e4b70f3');
  }
  if ((absTick & 0x800) !== 0) {
    ratio = mulShift(ratio, '0xe7159475a2c29b7443b29c7fa6e889d9');
  }
  if ((absTick & 0x1000) !== 0) {
    ratio = mulShift(ratio, '0xd097f3bdfd2022b8845ad8f792aa5825');
  }
  if ((absTick & 0x2000) !== 0) {
    ratio = mulShift(ratio, '0xa9f746462d870fdf8a65dc1f90e061e5');
  }
  if ((absTick & 0x4000) !== 0) {
    ratio = mulShift(ratio, '0x70d869a156d2a1b890bb3df62baf32f7');
  }
  if ((absTick & 0x8000) !== 0) {
    ratio = mulShift(ratio, '0x31be135f97d08fd981231505542fcfa6');
  }
  if ((absTick & 0x10000) !== 0) {
    ratio = mulShift(ratio, '0x9aa508b5b7a84e1c677de54f3e99bc9');
  }
  if ((absTick & 0x20000) !== 0) {
    ratio = mulShift(ratio, '0x5d6af8dedb81196699c329225ee604');
  }
  if ((absTick & 0x40000) !== 0) {
    ratio = mulShift(ratio, '0x2216e584f5fa1ea926041bedfe98');
  }
  if ((absTick & 0x80000) !== 0) {
    ratio = mulShift(ratio, '0x48a170391f7dc42444e8fa2');
  }

  if (tick > 0) {
    ratio = MAX_UINT256 / ratio;
  }

  // back to Q96 with rounding up if remainder != 0
  const quotient = ratio / Q32;
  const remainder = ratio % Q32;
  return remainder > 0n ? quotient + 1n : quotient;
}

export function getTickAtSqrtRatio(sqrtRatioX96: bigint): number {
  if (!(sqrtRatioX96 >= MIN_SQRT_RATIO && sqrtRatioX96 < MAX_SQRT_RATIO)) {
    throw new Error('SQRT_RATIO');
  }

  const sqrtRatioX128 = sqrtRatioX96 << 32n;

  const msb = mostSignificantBit(sqrtRatioX128);

  let r: bigint;
  if (BigInt(msb) >= 128n) {
    r = sqrtRatioX128 >> BigInt(msb - 127);
  } else {
    r = sqrtRatioX128 << BigInt(127 - msb);
  }

  let log_2 = (BigInt(msb) - 128n) << 64n;

  // 14 iterations
  for (let i = 0; i < 14; i++) {
    r = (r * r) >> 127n;
    const f = r >> 128n;
    log_2 = log_2 | (f << BigInt(63 - i));
    r = r >> f;
  }

  const log_sqrt10001 = log_2 * 255738958999603826347141n;

  const tickLow = Number((log_sqrt10001 - 3402992956809132418596140100660247210n) >> 128n);
  const tickHigh = Number((log_sqrt10001 + 291339464771989622907027621153398088495n) >> 128n);

  if (tickLow === tickHigh) {
    return tickLow;
  }

  // choose the highest tick whose sqrtRatioAtTick <= input
  return getSqrtRatioAtTick(tickHigh) <= sqrtRatioX96 ? tickHigh : tickLow;
}

export function buildTickBitmap(args: { ticks: Map<number, bigint>; tickSpacing: number }): Map<number, bigint> {
  const { ticks, tickSpacing } = args;
  if (tickSpacing <= 0) {
    throw new Error('tickSpacing must be > 0');
  }

  const tickBitmap = new Map<number, bigint>();

  for (const [tick, liquidityNet] of ticks) {
    if (liquidityNet === 0n) {
      continue;
    } // drop phantom ticks
    if (tick % tickSpacing !== 0) {
      throw new Error(`Tick ${tick} is not aligned to tickSpacing=${tickSpacing}`);
    }

    const compressed = compressTickFloor(tick, tickSpacing); // bigint
    const { wordPos, bitPos } = position(compressed); // number, number

    const prev = tickBitmap.get(wordPos) ?? 0n;
    tickBitmap.set(wordPos, prev | (1n << BigInt(bitPos)));
  }

  return tickBitmap;
}

function setBit(word: bigint, bitPos: number): bigint {
  return word | (1n << BigInt(bitPos));
}

function clearBit(word: bigint, bitPos: number): bigint {
  return word & ~(1n << BigInt(bitPos));
}

export function setInitializedInBitmap(tickBitmap: Map<number, bigint>, tick: number, tickSpacing: number) {
  const compressed = compressTickFloor(tick, tickSpacing); // bigint
  const { wordPos, bitPos } = position(compressed);

  const prev = tickBitmap.get(wordPos) ?? 0n;
  tickBitmap.set(wordPos, setBit(prev, bitPos));
}

export function clearInitializedInBitmap(tickBitmap: Map<number, bigint>, tick: number, tickSpacing: number) {
  const compressed = compressTickFloor(tick, tickSpacing); // bigint
  const { wordPos, bitPos } = position(compressed);

  const prev = tickBitmap.get(wordPos) ?? 0n;
  const next = clearBit(prev, bitPos);

  if (next === 0n) {
    tickBitmap.delete(wordPos);
  } else {
    tickBitmap.set(wordPos, next);
  }
}

/**
 * Uniswap V3 core-style "next initialized tick within one word".
 *
 * - If lte=true: returns the greatest initialized tick <= tick within the same 256-bit word,
 *   else returns the word minimum boundary (initialized=false).
 * - If lte=false: returns the smallest initialized tick > tick within the same 256-bit word,
 *   else returns the word maximum boundary (initialized=false).
 */
export function nextInitializedTickWithinOneWord(args: {
  tick: number;
  tickSpacing: number;
  lte: boolean;
  tickBitmap: Map<WordPos, BitMapWord>;
}): { nextTick: number; initialized: boolean } {
  const UINT256_MASK = MAX_UINT256;

  const { tick, tickSpacing, lte, tickBitmap } = args;

  // compressed like core (floor)
  const compressed = compressTickFloor(tick, tickSpacing);

  // core uses position(compressed) for lte, position(compressed + 1) for gt
  const base = lte ? compressed : compressed + 1n;
  const { wordPos, bitPos } = position(base);

  const bitmap = tickBitmap.get(wordPos) ?? 0n;

  if (lte) {
    // mask: keep bits <= bitPos
    // mask = (1 << bitPos) - 1 + (1 << bitPos) == (1 << (bitPos+1)) - 1
    const mask = ((1n << BigInt(bitPos + 1)) - 1n) & UINT256_MASK;
    const masked = bitmap & mask;

    const initialized = masked !== 0n;
    if (initialized) {
      const msb = mostSignificantBit(masked);
      const nextCompressed = base - BigInt(bitPos - msb);
      return { nextTick: Number(nextCompressed) * tickSpacing, initialized: true };
    } else {
      // no initialized ticks in this word at or below bitPos -> word boundary
      const nextCompressed = base - BigInt(bitPos);
      return { nextTick: Number(nextCompressed) * tickSpacing, initialized: false };
    }
  } else {
    // mask: keep bits >= bitPos
    // mask = ~((1 << bitPos) - 1)
    const mask = (UINT256_MASK ^ ((1n << BigInt(bitPos)) - 1n)) & UINT256_MASK;
    const masked = bitmap & mask;

    const initialized = masked !== 0n;
    if (initialized) {
      const lsb = leastSignificantBit(masked);
      const nextCompressed = base + BigInt(lsb - bitPos);
      return { nextTick: Number(nextCompressed) * tickSpacing, initialized: true };
    } else {
      // no initialized ticks in this word at or above bitPos -> word boundary
      const nextCompressed = base + BigInt(255 - bitPos);
      return { nextTick: Number(nextCompressed) * tickSpacing, initialized: false };
    }
  }
}

// TODO: stompesi - check to remove
export function nextInitializedTick(args: {
  tick: number;
  tickSpacing: number;
  zeroForOne: boolean;
  tickBitmap: Map<number, bigint>;
}): { nextTick: number; initialized: boolean } {
  const { tick, tickSpacing, zeroForOne, tickBitmap } = args;

  const lte = zeroForOne;
  let probeTick = tick;

  while (true) {
    const res = nextInitializedTickWithinOneWord({
      tick: probeTick,
      tickSpacing,
      lte,
      tickBitmap,
    });

    if (res.initialized) {
      return res;
    }

    probeTick = lte ? res.nextTick - 1 : res.nextTick + 1;
  }
}
