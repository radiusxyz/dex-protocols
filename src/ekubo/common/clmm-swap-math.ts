import { divRoundingUp, mulDiv, mulDivRoundingUp } from '../../utils/math';

import { FEE_DENOMINATOR, Q128 } from './constants';

export function getAmount0Delta(
  sqrtRatioAX128: bigint,
  sqrtRatioBX128: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  if (sqrtRatioAX128 === sqrtRatioBX128 || liquidity === 0n) {
    return 0n;
  }

  let sqrtA = sqrtRatioAX128;
  let sqrtB = sqrtRatioBX128;
  if (sqrtA > sqrtB) {
    [sqrtA, sqrtB] = [sqrtB, sqrtA];
  }

  const numerator1 = liquidity << 128n;
  const numerator2 = sqrtB - sqrtA;

  if (roundUp) {
    const tmp = mulDivRoundingUp(numerator1, numerator2, sqrtB);
    return divRoundingUp(tmp, sqrtA);
  }

  const tmp = mulDiv(numerator1, numerator2, sqrtB);
  return tmp / sqrtA;
}

export function getAmount1Delta(
  sqrtRatioAX128: bigint,
  sqrtRatioBX128: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  if (sqrtRatioAX128 === sqrtRatioBX128 || liquidity === 0n) {
    return 0n;
  }

  let sqrtA = sqrtRatioAX128;
  let sqrtB = sqrtRatioBX128;
  if (sqrtA > sqrtB) {
    [sqrtA, sqrtB] = [sqrtB, sqrtA];
  }

  const delta = sqrtB - sqrtA;
  return roundUp ? mulDivRoundingUp(liquidity, delta, Q128) : mulDiv(liquidity, delta, Q128);
}

export function getNextSqrtPriceFromAmount0In(sqrtRatioX128: bigint, liquidity: bigint, amountIn: bigint): bigint {
  if (amountIn === 0n) {
    return sqrtRatioX128;
  }

  const numerator = liquidity << 128n;
  const denominatorPartial = numerator / sqrtRatioX128;
  const denominator = denominatorPartial + amountIn;
  const quotient = numerator / denominator;

  return numerator % denominator === 0n ? quotient : quotient + 1n;
}

export function getNextSqrtPriceFromAmount1In(sqrtRatioX128: bigint, liquidity: bigint, amountIn: bigint): bigint {
  if (amountIn === 0n) {
    return sqrtRatioX128;
  }

  return sqrtRatioX128 + mulDiv(amountIn, Q128, liquidity);
}

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
    throw new Error('amountRemaining must be >= 0');
  }
  if (!Number.isInteger(feePips) || feePips < 0 || feePips > 1_000_000) {
    throw new Error('invalid feePips');
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
    sqrtPNext =
      amountRemainingLessFee >= amountInToReachTarget
        ? sqrtPTarget
        : getNextSqrtPriceFromAmount0In(sqrtPCurr, liquidity, amountRemainingLessFee);

    const reachedTarget = sqrtPNext === sqrtPTarget;
    amountIn = reachedTarget ? amountInToReachTarget : getAmount0Delta(sqrtPNext, sqrtPCurr, liquidity, true);
    amountOut = getAmount1Delta(sqrtPNext, sqrtPCurr, liquidity, false);
  } else {
    const amountInToReachTarget = getAmount1Delta(sqrtPCurr, sqrtPTarget, liquidity, true);
    sqrtPNext =
      amountRemainingLessFee >= amountInToReachTarget
        ? sqrtPTarget
        : getNextSqrtPriceFromAmount1In(sqrtPCurr, liquidity, amountRemainingLessFee);

    const reachedTarget = sqrtPNext === sqrtPTarget;
    amountIn = reachedTarget ? amountInToReachTarget : getAmount1Delta(sqrtPCurr, sqrtPNext, liquidity, true);
    amountOut = getAmount0Delta(sqrtPCurr, sqrtPNext, liquidity, false);
  }

  const reachedTarget = sqrtPNext === sqrtPTarget;
  const feeAmount = !reachedTarget
    ? amountRemaining - amountIn
    : mulDivRoundingUp(amountIn, fee, FEE_DENOMINATOR - fee);

  return { sqrtPNext, amountIn, amountOut, feeAmount };
}

export function addLiquidity(liq: bigint, liquidityNet: bigint, zeroForOne: boolean): bigint {
  const delta = zeroForOne ? -liquidityNet : liquidityNet;
  const next = liq + delta;
  if (next < 0n) {
    throw new Error('liquidity underflow');
  }
  return next;
}
