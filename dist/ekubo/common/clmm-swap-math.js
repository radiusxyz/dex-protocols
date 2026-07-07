"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmount0Delta = getAmount0Delta;
exports.getAmount1Delta = getAmount1Delta;
exports.getNextSqrtPriceFromAmount0In = getNextSqrtPriceFromAmount0In;
exports.getNextSqrtPriceFromAmount1In = getNextSqrtPriceFromAmount1In;
exports.computeSwapStepExactIn = computeSwapStepExactIn;
exports.addLiquidity = addLiquidity;
const math_1 = require("../../utils/math");
const constants_1 = require("./constants");
function getAmount0Delta(sqrtRatioAX128, sqrtRatioBX128, liquidity, roundUp) {
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
        const tmp = (0, math_1.mulDivRoundingUp)(numerator1, numerator2, sqrtB);
        return (0, math_1.divRoundingUp)(tmp, sqrtA);
    }
    const tmp = (0, math_1.mulDiv)(numerator1, numerator2, sqrtB);
    return tmp / sqrtA;
}
function getAmount1Delta(sqrtRatioAX128, sqrtRatioBX128, liquidity, roundUp) {
    if (sqrtRatioAX128 === sqrtRatioBX128 || liquidity === 0n) {
        return 0n;
    }
    let sqrtA = sqrtRatioAX128;
    let sqrtB = sqrtRatioBX128;
    if (sqrtA > sqrtB) {
        [sqrtA, sqrtB] = [sqrtB, sqrtA];
    }
    const delta = sqrtB - sqrtA;
    return roundUp ? (0, math_1.mulDivRoundingUp)(liquidity, delta, constants_1.Q128) : (0, math_1.mulDiv)(liquidity, delta, constants_1.Q128);
}
function getNextSqrtPriceFromAmount0In(sqrtRatioX128, liquidity, amountIn) {
    if (amountIn === 0n) {
        return sqrtRatioX128;
    }
    const numerator = liquidity << 128n;
    const denominatorPartial = numerator / sqrtRatioX128;
    const denominator = denominatorPartial + amountIn;
    const quotient = numerator / denominator;
    return numerator % denominator === 0n ? quotient : quotient + 1n;
}
function getNextSqrtPriceFromAmount1In(sqrtRatioX128, liquidity, amountIn) {
    if (amountIn === 0n) {
        return sqrtRatioX128;
    }
    return sqrtRatioX128 + (0, math_1.mulDiv)(amountIn, constants_1.Q128, liquidity);
}
function computeSwapStepExactIn(sqrtPCurr, sqrtPTarget, liquidity, amountRemaining, feePips, zeroForOne) {
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
    const amountRemainingLessFee = (0, math_1.mulDiv)(amountRemaining, constants_1.FEE_DENOMINATOR - fee, constants_1.FEE_DENOMINATOR);
    if (amountRemainingLessFee === 0n) {
        return { sqrtPNext: sqrtPCurr, amountIn: 0n, amountOut: 0n, feeAmount: amountRemaining };
    }
    let sqrtPNext;
    let amountIn;
    let amountOut;
    if (zeroForOne) {
        const amountInToReachTarget = getAmount0Delta(sqrtPTarget, sqrtPCurr, liquidity, true);
        sqrtPNext =
            amountRemainingLessFee >= amountInToReachTarget
                ? sqrtPTarget
                : getNextSqrtPriceFromAmount0In(sqrtPCurr, liquidity, amountRemainingLessFee);
        const reachedTarget = sqrtPNext === sqrtPTarget;
        amountIn = reachedTarget ? amountInToReachTarget : getAmount0Delta(sqrtPNext, sqrtPCurr, liquidity, true);
        amountOut = getAmount1Delta(sqrtPNext, sqrtPCurr, liquidity, false);
    }
    else {
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
        : (0, math_1.mulDivRoundingUp)(amountIn, fee, constants_1.FEE_DENOMINATOR - fee);
    return { sqrtPNext, amountIn, amountOut, feeAmount };
}
function addLiquidity(liq, liquidityNet, zeroForOne) {
    const delta = zeroForOne ? -liquidityNet : liquidityNet;
    const next = liq + delta;
    if (next < 0n) {
        throw new Error('liquidity underflow');
    }
    return next;
}
//# sourceMappingURL=clmm-swap-math.js.map