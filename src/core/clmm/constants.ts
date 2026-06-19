export const Q32 = 2n ** 32n;
export const Q96 = 2n ** 96n;
export const Q128 = 2n ** 128n;
export const Q192 = Q96 * Q96; // or 2n ** 192n
export const FEE_DENOMINATOR = 1_000_000n;

export const NEGATIVE_ONE = -1n;
export const ZERO = 0n;
export const ONE = 1n;

export const MAX_UINT256 = (1n << 256n) - 1n;

// Uniswap v3-core constants
export const MIN_TICK = -887272;
export const MAX_TICK = 887272;

// From v3-core TickMath.sol
export const MIN_SQRT_RATIO = 4295128739n;
export const MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n;

// same powers as SDK
export const POWERS_OF_2: [number, bigint][] = [
  [128, 1n << 128n],
  [64, 1n << 64n],
  [32, 1n << 32n],
  [16, 1n << 16n],
  [8, 1n << 8n],
  [4, 1n << 4n],
  [2, 1n << 2n],
  [1, 1n << 1n],
];
