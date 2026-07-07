"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAndValidateLimit = normalizeAndValidateLimit;
exports.quoteExactIn = quoteExactIn;
exports.quoteMidFeePips = quoteMidFeePips;
const math_1 = require("../../utils/math");
const clmm_swap_math_1 = require("./clmm-swap-math");
const constants_1 = require("./constants");
const tick_math_1 = require("./tick-math");
function normalizeAndValidateLimit(args) {
    const { sqrtRatioLimitX128, sqrtRatioCurrentX128, zeroForOne } = args;
    const limit = sqrtRatioLimitX128 === 0n ? (zeroForOne ? constants_1.MIN_SQRT_RATIO + 1n : constants_1.MAX_SQRT_RATIO - 1n) : sqrtRatioLimitX128;
    const ok = zeroForOne
        ? limit < sqrtRatioCurrentX128 && limit > constants_1.MIN_SQRT_RATIO
        : limit > sqrtRatioCurrentX128 && limit < constants_1.MAX_SQRT_RATIO;
    if (!ok) {
        throw new Error('This swap is impossible from the current price in this direction.');
    }
    return limit;
}
function quoteExactIn({ amountIn, zeroForOne, sqrtRatioLimitX128, runtime, }) {
    const { feePips, tickSpacing } = runtime.info;
    const { liquidity: initialLiquidity, tick: initialTick, sqrtRatioX128: initialSqrtRatioX128 } = runtime.state;
    const { tickBitmap } = runtime._temp;
    let sqrtP = initialSqrtRatioX128;
    let tick = initialTick;
    let liquidity = initialLiquidity;
    let amountRemaining = amountIn;
    let amountOutAcc = 0n;
    if (initialLiquidity === 0n && tickBitmap.size === 0) {
        throw new Error('Cannot quote against an empty pool (liquidity=0, no initialized ticks)');
    }
    const sqrtRatioLimit = normalizeAndValidateLimit({
        sqrtRatioLimitX128,
        sqrtRatioCurrentX128: sqrtP,
        zeroForOne,
    });
    let iters = 0;
    while (amountRemaining > 0n && sqrtP !== sqrtRatioLimit) {
        iters++;
        if (iters > 2_000_000) {
            throw new Error('TOO_MANY_ITERS');
        }
        const stepSqrtPriceStart = sqrtP;
        const { nextTick, initialized } = (0, tick_math_1.nextInitializedTickWithinOneWord)({
            tick,
            tickSpacing,
            lte: zeroForOne,
            tickBitmap,
        });
        let tickNext = nextTick;
        if (tickNext < constants_1.MIN_TICK) {
            tickNext = constants_1.MIN_TICK;
        }
        else if (tickNext > constants_1.MAX_TICK) {
            tickNext = constants_1.MAX_TICK;
        }
        const sqrtPTick = (0, tick_math_1.getSqrtRatioAtTick)(tickNext);
        const sqrtPTarget = zeroForOne
            ? sqrtPTick < sqrtRatioLimit
                ? sqrtRatioLimit
                : sqrtPTick
            : sqrtPTick > sqrtRatioLimit
                ? sqrtRatioLimit
                : sqrtPTick;
        if (liquidity <= 0n) {
            throw new Error(`LIQUIDITY_NOT_POSITIVE: L=${liquidity} tick=${tick} sqrtP=${sqrtP}`);
        }
        const { sqrtPNext, amountIn: usedIn, amountOut, feeAmount, } = (0, clmm_swap_math_1.computeSwapStepExactIn)(sqrtP, sqrtPTarget, liquidity, amountRemaining, feePips, zeroForOne);
        const spent = usedIn + feeAmount;
        amountRemaining = spent >= amountRemaining ? 0n : amountRemaining - spent;
        amountOutAcc += amountOut;
        sqrtP = sqrtPNext;
        if (sqrtP === sqrtPTick) {
            if (initialized) {
                const liquidityNet = runtime.state.ticks.get(tickNext);
                if (liquidityNet === undefined) {
                    throw new Error(`Initialized tick missing liquidityNet at tick=${tickNext}`);
                }
                liquidity = (0, clmm_swap_math_1.addLiquidity)(liquidity, liquidityNet, zeroForOne);
            }
            tick = zeroForOne ? tickNext - 1 : tickNext;
        }
        else if (sqrtP !== stepSqrtPriceStart) {
            tick = (0, tick_math_1.getTickAtSqrtRatio)(sqrtP);
        }
    }
    return {
        amountOut: amountOutAcc,
        sqrtRatioAfterX128: sqrtP,
        tickAfter: tick,
        liquidityAfter: liquidity,
    };
}
function quoteMidFeePips(amountIn, sqrtRatioX128, tokenInIsToken0, feePips) {
    if (amountIn <= 0n || sqrtRatioX128 <= 0n) {
        return null;
    }
    if (!Number.isInteger(feePips) || feePips < 0 || feePips > 1_000_000) {
        return null;
    }
    const amountInWithFee = (amountIn * (constants_1.FEE_DENOMINATOR - BigInt(feePips))) / constants_1.FEE_DENOMINATOR;
    if (amountInWithFee <= 0n) {
        return null;
    }
    const priceX256 = sqrtRatioX128 * sqrtRatioX128;
    const amountOut = tokenInIsToken0
        ? (0, math_1.mulDiv)(amountInWithFee, priceX256, constants_1.Q256)
        : (0, math_1.mulDiv)(amountInWithFee, constants_1.Q256, priceX256);
    return amountOut > 0n ? amountOut : null;
}
//# sourceMappingURL=quoter.js.map