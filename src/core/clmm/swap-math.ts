import { divRoundingUp, mulDiv, mulDivRoundingUp, pow10 } from '../../utils/math';
import { FEE_DENOMINATOR, MAX_UINT256, Q96 } from './constants';

import { leastSignificantBit } from './tick-math';

/**
 * amount0 delta between two prices (sqrt ratios), for liquidity L.
 * If roundUp is true, rounds up (like Uniswap).
 */
export function getAmount0Delta(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  if (sqrtRatioAX96 === sqrtRatioBX96 || liquidity === 0n) {
    return 0n;
  }

  let sqrtA = sqrtRatioAX96;
  let sqrtB = sqrtRatioBX96;
  if (sqrtA > sqrtB) {
    [sqrtA, sqrtB] = [sqrtB, sqrtA];
  }

  // amount0 = L * (sqrtB - sqrtA) / (sqrtB * sqrtA) * Q96
  const numerator1 = liquidity << 96n; // L * Q96
  const numerator2 = sqrtB - sqrtA;

  if (roundUp) {
    const tmp = mulDivRoundingUp(numerator1, numerator2, sqrtB);
    return divRoundingUp(tmp, sqrtA);
  } else {
    const tmp = mulDiv(numerator1, numerator2, sqrtB);
    return tmp / sqrtA;
  }
}

/**
 * amount1 delta between two prices, for liquidity L.
 */
export function getAmount1Delta(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  if (sqrtRatioAX96 === sqrtRatioBX96 || liquidity === 0n) {
    return 0n;
  }

  let sqrtA = sqrtRatioAX96;
  let sqrtB = sqrtRatioBX96;
  if (sqrtA > sqrtB) {
    [sqrtA, sqrtB] = [sqrtB, sqrtA];
  }

  const delta = sqrtB - sqrtA;

  if (roundUp) {
    return mulDivRoundingUp(liquidity, delta, Q96);
  }
  return mulDiv(liquidity, delta, Q96);
}

/**
 * Next sqrt price after swapping in amount of token0 (exact input)
 * sqrtP' = (L * Q96 * sqrtP) / (L*Q96 + amountIn*sqrtP)
 *
 * roundUp is true in v3-core for exact input token0.
 */
export function getNextSqrtPriceFromAmount0In(sqrtPX96: bigint, liquidity: bigint, amountIn: bigint): bigint {
  if (amountIn === 0n) {
    return sqrtPX96;
  }

  const numerator = liquidity << 96n; // L*Q96
  const product = amountIn * sqrtPX96;

  // denominator = L*Q96 + amountIn*sqrtP
  const denom = numerator + product;

  // (numerator * sqrtP) / denom, rounded up
  return mulDivRoundingUp(numerator, sqrtPX96, denom);
}

/**
 * Next sqrt price after swapping in amount of token1 (exact input)
 * sqrtP' = sqrtP + amountIn * Q96 / L
 *
 * rounded down in v3-core (integer division)
 */
export function getNextSqrtPriceFromAmount1In(sqrtPX96: bigint, liquidity: bigint, amountIn: bigint): bigint {
  if (amountIn === 0n) {
    return sqrtPX96;
  }

  const delta = mulDiv(amountIn, Q96, liquidity);
  return sqrtPX96 + delta;
}

/**
 * BigInt port of Uniswap V3 SwapMath.computeSwapStep for EXACT INPUT only.
 *
 * - amountRemaining is exact input remaining (>= 0)
 * - feePips is 0..1e6
 * - Direction is inferred by zeroForOne (token0->token1 means price decreases)
 */
export function computeSwapStepExactIn(
  sqrtPCurr: bigint,
  sqrtPTarget: bigint,
  liquidity: bigint,
  amountRemaining: bigint,
  feePips: number,
  zeroForOne: boolean,
): { sqrtPNext: bigint; amountIn: bigint; amountOut: bigint; feeAmount: bigint } {
  if (sqrtPCurr <= 0n || sqrtPTarget <= 0n) {
    throw new Error('sqrtP must be > 0');
  }
  if (liquidity <= 0n) {
    throw new Error('liquidity must be > 0');
  }
  if (amountRemaining < 0n) {
    throw new Error('amountRemaining must be >= 0 (exact input)');
  }
  if (!Number.isInteger(feePips) || feePips < 0 || feePips > 1_000_000) {
    throw new Error('invalid feePips');
  }

  if (zeroForOne) {
    if (sqrtPTarget > sqrtPCurr) {
      throw new Error('zeroForOne expects target <= current');
    }
  } else {
    if (sqrtPTarget < sqrtPCurr) {
      throw new Error('oneForZero expects target >= current');
    }
  }

  const fee = BigInt(feePips);
  const amountRemainingLessFee = mulDiv(amountRemaining, FEE_DENOMINATOR - fee, FEE_DENOMINATOR);

  if (amountRemainingLessFee === 0n) {
    return { sqrtPNext: sqrtPCurr, amountIn: 0n, amountOut: 0n, feeAmount: amountRemaining };
  }

  let sqrtPNext: bigint;
  let amountIn: bigint;
  let amountOut: bigint;

  if (zeroForOne) {
    const amountInToReachTarget = getAmount0Delta(sqrtPTarget, sqrtPCurr, liquidity, true);

    if (amountRemainingLessFee >= amountInToReachTarget) {
      sqrtPNext = sqrtPTarget;
    } else {
      sqrtPNext = getNextSqrtPriceFromAmount0In(sqrtPCurr, liquidity, amountRemainingLessFee);
    }

    const reachedTarget = sqrtPNext === sqrtPTarget;
    amountIn = reachedTarget ? amountInToReachTarget : getAmount0Delta(sqrtPNext, sqrtPCurr, liquidity, true);

    amountOut = getAmount1Delta(sqrtPNext, sqrtPCurr, liquidity, false);
  } else {
    const amountInToReachTarget = getAmount1Delta(sqrtPCurr, sqrtPTarget, liquidity, true);

    if (amountRemainingLessFee >= amountInToReachTarget) {
      sqrtPNext = sqrtPTarget;
    } else {
      sqrtPNext = getNextSqrtPriceFromAmount1In(sqrtPCurr, liquidity, amountRemainingLessFee);
    }

    const reachedTarget = sqrtPNext === sqrtPTarget;
    amountIn = reachedTarget ? amountInToReachTarget : getAmount1Delta(sqrtPCurr, sqrtPNext, liquidity, true);

    amountOut = getAmount0Delta(sqrtPCurr, sqrtPNext, liquidity, false);
  }

  const reachedTarget = sqrtPNext === sqrtPTarget;
  const feeAmount = !reachedTarget
    ? amountRemaining - amountIn
    : mulDivRoundingUp(amountIn, fee, FEE_DENOMINATOR - fee);

  if (amountIn + feeAmount > amountRemaining) {
    throw new Error('INVARIANT: amountIn + feeAmount > amountRemaining');
  }

  return { sqrtPNext, amountIn, amountOut, feeAmount };
}

// Signed liquidity update
export function addLiquidity(liq: bigint, liquidityNet: bigint, zeroForOne: boolean): bigint {
  // In Uniswap: when crossing tick from left->right vs right->left sign flips.
  // If zeroForOne (price decreasing), you cross from right to left.
  // Typical rule: liquidity += (zeroForOne ? -liquidityNet : +liquidityNet)
  const delta = zeroForOne ? -liquidityNet : liquidityNet;
  const next = liq + delta;
  if (next < 0n) {
    throw new Error('liquidity underflow');
  }
  return next;
}

/**
 * Swap step math.
 * Port UniswapV3 SwapMath.computeSwapStep:
 * inputs:
 *  - sqrtPriceCurrentX96
 *  - sqrtPriceTargetX96
 *  - liquidity
 *  - amountRemaining (exact input)
 *  - feePips (e.g. 3000 for 0.3%)
 * outputs:
 *  - sqrtPriceNextX96
 *  - amountIn
 *  - amountOut
 *  - feeAmount
 */

export function formatFixed(valueScaled: bigint, precision: number): string {
  // valueScaled is value * 10^precision
  const neg = valueScaled < 0n;
  const x = neg ? -valueScaled : valueScaled;

  const base = pow10(precision);
  const intPart = x / base;
  const fracPart = x % base;

  const frac = fracPart.toString().padStart(precision, '0').replace(/0+$/, '');
  const s = frac.length ? `${intPart.toString()}.${frac}` : intPart.toString();
  return neg ? `-${s}` : s;
}

// TODO: stompesi - check to remove
export function invertDecimalString(xStr: string, precision: number): string {
  // returns (1 / x) with `precision` decimals, using bigint division
  // xStr must be non-negative decimal string
  const [i = '0', f = ''] = xStr.split('.');

  const frac = f.padEnd(precision, '0').slice(0, precision);

  const xScaled = BigInt(i) * pow10(precision) + BigInt(frac === '' ? '0' : frac);
  if (xScaled === 0n) {
    return '0';
  }

  // (1 * 10^precision) / x  => scaled reciprocal
  const oneScaled = pow10(precision);
  const recipScaled = (oneScaled * pow10(precision)) / xScaled; // scale again to keep precision
  return formatFixed(recipScaled, precision);
}

// TODO: stompesi - check to remove
export function getInitializedTickIndicesFromWordFast(wordPos: number, word: bigint, tickSpacing: number): number[] {
  if (tickSpacing <= 0) {
    throw new Error('tickSpacing must be > 0');
  }
  if (word < 0n || word > MAX_UINT256) {
    throw new Error('word must be uint256');
  }

  const out: number[] = [];
  if (word === 0n) {
    return out;
  }

  const base = BigInt(wordPos) * 256n;

  let w = word;

  while (w !== 0n) {
    // index of lowest set bit
    const bit = leastSignificantBit(w); // 0..255

    const compressed = base + BigInt(bit);
    const tick = compressed * BigInt(tickSpacing);

    out.push(Number(tick));

    // clear the lowest set bit (classic trick)
    w &= w - 1n;
  }

  // The above returns ticks in ascending bit order (low -> high) ✅
  return out;
}
