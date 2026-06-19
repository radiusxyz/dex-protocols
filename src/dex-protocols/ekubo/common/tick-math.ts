import { MAX_SQRT_RATIO, MAX_TICK, MAX_UINT256, MIN_SQRT_RATIO, MIN_TICK } from './constants';

export type BitMapWord = bigint;
export type BitPos = number;
export type WordPos = number;

const sqrtRatioCache = new Map<number, bigint>();
const EKUBO_COMPACT_SQRT_RATIO_REGION_MASK = 0xc00000000000000000000000n;
const EKUBO_COMPACT_SQRT_RATIO_VALUE_MASK = 0x3fffffffffffffffffffffffn;

// Ekubo EVM exposes SqrtRatio as a compact uint96 with a 2-bit region tag.
// This decodes that compact representation back into the 64.128 fixed-point
// format used by the local math and quoter.
export function decodeEkuboCompactSqrtRatioToX128(sqrtRatio: bigint): bigint {
  const regionTag = (sqrtRatio & EKUBO_COMPACT_SQRT_RATIO_REGION_MASK) >> 94n;
  const regionValue = sqrtRatio & EKUBO_COMPACT_SQRT_RATIO_VALUE_MASK;

  switch (regionTag) {
    case 0n:
      return regionValue << 2n;
    case 1n:
      return regionValue << 34n;
    case 2n:
      return regionValue << 66n;
    case 3n:
      return regionValue << 98n;
    default:
      throw new Error(`Unsupported Ekubo SqrtRatio region tag: ${regionTag.toString()}`);
  }
}

export function compressTickFloor(tick: number, tickSpacing: number): bigint {
  if (tickSpacing <= 0) {
    throw new Error('tickSpacing must be > 0');
  }

  const t = BigInt(tick);
  const s = BigInt(tickSpacing);
  let compressed = t / s;
  if (t < 0n && t % s !== 0n) {
    compressed -= 1n;
  }
  return compressed;
}

export function position(compressed: bigint): { wordPos: WordPos; bitPos: BitPos } {
  const m = 256n;
  let word = compressed / m;
  let rem = compressed % m;
  if (rem < 0n) {
    rem += m;
    word -= 1n;
  }
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
  return r;
}

export function mostSignificantBit(x: bigint): number {
  if (x <= 0n) {
    throw new Error('ZERO');
  }
  if (x > MAX_UINT256) {
    throw new Error('MAX');
  }

  let msb = 0;
  let value = x;
  for (const shift of [128, 64, 32, 16, 8, 4, 2, 1]) {
    const min = 1n << BigInt(shift);
    if (value >= min) {
      value >>= BigInt(shift);
      msb += shift;
    }
  }
  return msb;
}

export function getSqrtRatioAtTick(tick: number): bigint {
  if (!Number.isInteger(tick) || tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error('TICK');
  }

  const cached = sqrtRatioCache.get(tick);
  if (cached !== undefined) {
    return cached;
  }

  const encoded = toSqrtRatio(tick);
  sqrtRatioCache.set(tick, encoded);
  return encoded;
}

export function getTickAtSqrtRatio(sqrtRatioX128: bigint): number {
  if (!(sqrtRatioX128 >= MIN_SQRT_RATIO && sqrtRatioX128 < MAX_SQRT_RATIO)) {
    throw new Error('SQRT_RATIO');
  }

  let low = MIN_TICK;
  let high = MAX_TICK;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (getSqrtRatioAtTick(mid) <= sqrtRatioX128) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

export function toSqrtRatio(tick: number): bigint {
  if (tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error(`Invalid tick: ${tick}`);
  }

  const negative = tick < 0;
  const absTick = Math.abs(tick);

  let ratio = 0x100000000000000000000000000000000n;
  if ((absTick & 0x1) !== 0) {
    ratio = 0xfffff79c8499329c7cbb2510d893283bn;
  }
  if ((absTick & 0x2) !== 0) {
    ratio = (ratio * 0xffffef390978c398134b4ff3764fe410n) >> 128n;
  }
  if ((absTick & 0x4) !== 0) {
    ratio = (ratio * 0xffffde72140b00a354bd3dc828e976c9n) >> 128n;
  }
  if ((absTick & 0x8) !== 0) {
    ratio = (ratio * 0xffffbce42c7be6c998ad6318193c0b18n) >> 128n;
  }
  if ((absTick & 0x10) !== 0) {
    ratio = (ratio * 0xffff79c86a8f6150a32d9778eceef97cn) >> 128n;
  }
  if ((absTick & 0x20) !== 0) {
    ratio = (ratio * 0xfffef3911b7cff24ba1b3dbb5f8f5974n) >> 128n;
  }
  if ((absTick & 0x40) !== 0) {
    ratio = (ratio * 0xfffde72350725cc4ea8feece3b5f13c8n) >> 128n;
  }
  if ((absTick & 0x80) !== 0) {
    ratio = (ratio * 0xfffbce4b06c196e9247ac87695d53c60n) >> 128n;
  }
  if ((absTick & 0x100) !== 0) {
    ratio = (ratio * 0xfff79ca7a4d1bf1ee8556cea23cdbaa5n) >> 128n;
  }
  if ((absTick & 0x200) !== 0) {
    ratio = (ratio * 0xffef3995a5b6a6267530f207142a5764n) >> 128n;
  }
  if ((absTick & 0x400) !== 0) {
    ratio = (ratio * 0xffde7444b28145508125d10077ba83b8n) >> 128n;
  }
  if ((absTick & 0x800) !== 0) {
    ratio = (ratio * 0xffbceceeb791747f10df216f2e53ec57n) >> 128n;
  }
  if ((absTick & 0x1000) !== 0) {
    ratio = (ratio * 0xff79eb706b9a64c6431d76e63531e929n) >> 128n;
  }
  if ((absTick & 0x2000) !== 0) {
    ratio = (ratio * 0xfef41d1a5f2ae3a20676bec6f7f9459an) >> 128n;
  }
  if ((absTick & 0x4000) !== 0) {
    ratio = (ratio * 0xfde95287d26d81bea159c37073122c73n) >> 128n;
  }
  if ((absTick & 0x8000) !== 0) {
    ratio = (ratio * 0xfbd701c7cbc4c8a6bb81efd232d1e4e7n) >> 128n;
  }
  if ((absTick & 0x10000) !== 0) {
    ratio = (ratio * 0xf7bf5211c72f5185f372aeb1d48f937en) >> 128n;
  }
  if ((absTick & 0x20000) !== 0) {
    ratio = (ratio * 0xefc2bf59df33ecc28125cf78ec4f167fn) >> 128n;
  }
  if ((absTick & 0x40000) !== 0) {
    ratio = (ratio * 0xe08d35706200796273f0b3a981d90cfdn) >> 128n;
  }
  if ((absTick & 0x80000) !== 0) {
    ratio = (ratio * 0xc4f76b68947482dc198a48a54348c4edn) >> 128n;
  }
  if ((absTick & 0x100000) !== 0) {
    ratio = (ratio * 0x978bcb9894317807e5fa4498eee7c0fan) >> 128n;
  }
  if ((absTick & 0x200000) !== 0) {
    ratio = (ratio * 0x59b63684b86e9f486ec54727371ba6can) >> 128n;
  }
  if ((absTick & 0x400000) !== 0) {
    ratio = (ratio * 0x1f703399d88f6aa83a28b22d4a1f56e3n) >> 128n;
  }
  if ((absTick & 0x800000) !== 0) {
    ratio = (ratio * 0x3dc5dac7376e20fc8679758d1bcdcfcn) >> 128n;
  }
  if ((absTick & 0x1000000) !== 0) {
    ratio = (ratio * 0xee7e32d61fdb0a5e622b820f681d0n) >> 128n;
  }
  if ((absTick & 0x2000000) !== 0) {
    ratio = (ratio * 0xde2ee4bc381afa7089aa84bb66n) >> 128n;
  }
  if ((absTick & 0x4000000) !== 0) {
    ratio = (ratio * 0xc0d55d4d7152c25fb139n) >> 128n;
  }

  if (tick > 0 && !negative) {
    ratio = MAX_UINT256 / ratio;
  }

  const twoPow160 = 1n << 160n;
  const twoPow128 = 1n << 128n;
  const twoPow96 = 1n << 96n;

  ratio =
    ratio >= twoPow160
      ? (ratio >> 98n) << 98n
      : ratio >= twoPow128
        ? (ratio >> 66n) << 66n
        : ratio >= twoPow96
          ? (ratio >> 34n) << 34n
          : (ratio >> 2n) << 2n;

  return ratio;
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
    }
    if (tick % tickSpacing !== 0) {
      throw new Error(`Tick ${tick} is not aligned to tickSpacing=${tickSpacing}`);
    }

    const compressed = compressTickFloor(tick, tickSpacing);
    const { wordPos, bitPos } = position(compressed);
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
  const compressed = compressTickFloor(tick, tickSpacing);
  const { wordPos, bitPos } = position(compressed);
  const prev = tickBitmap.get(wordPos) ?? 0n;
  tickBitmap.set(wordPos, setBit(prev, bitPos));
}

export function clearInitializedInBitmap(tickBitmap: Map<number, bigint>, tick: number, tickSpacing: number) {
  const compressed = compressTickFloor(tick, tickSpacing);
  const { wordPos, bitPos } = position(compressed);
  const prev = tickBitmap.get(wordPos) ?? 0n;
  const next = clearBit(prev, bitPos);

  if (next === 0n) {
    tickBitmap.delete(wordPos);
  } else {
    tickBitmap.set(wordPos, next);
  }
}

export function nextInitializedTickWithinOneWord(args: {
  tick: number;
  tickSpacing: number;
  lte: boolean;
  tickBitmap: Map<WordPos, BitMapWord>;
}): { nextTick: number; initialized: boolean } {
  const { tick, tickSpacing, lte, tickBitmap } = args;
  const compressed = compressTickFloor(tick, tickSpacing);
  const base = lte ? compressed : compressed + 1n;
  const { wordPos, bitPos } = position(base);
  const bitmap = tickBitmap.get(wordPos) ?? 0n;

  if (lte) {
    const mask = ((1n << BigInt(bitPos + 1)) - 1n) & MAX_UINT256;
    const masked = bitmap & mask;

    if (masked !== 0n) {
      const msb = mostSignificantBit(masked);
      const nextCompressed = base - BigInt(bitPos - msb);
      return { nextTick: Number(nextCompressed) * tickSpacing, initialized: true };
    }

    const nextCompressed = base - BigInt(bitPos);
    return { nextTick: Number(nextCompressed) * tickSpacing, initialized: false };
  }

  const mask = (MAX_UINT256 ^ ((1n << BigInt(bitPos)) - 1n)) & MAX_UINT256;
  const masked = bitmap & mask;

  if (masked !== 0n) {
    const lsb = leastSignificantBit(masked);
    const nextCompressed = base + BigInt(lsb - bitPos);
    return { nextTick: Number(nextCompressed) * tickSpacing, initialized: true };
  }

  const nextCompressed = base + BigInt(255 - bitPos);
  return { nextTick: Number(nextCompressed) * tickSpacing, initialized: false };
}
