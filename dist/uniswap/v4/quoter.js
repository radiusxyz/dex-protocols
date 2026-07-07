"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuoter = createQuoter;
const constants_1 = require("../../core/clmm/constants");
const swap_math_1 = require("../../core/clmm/swap-math");
const tick_math_1 = require("../../core/clmm/tick-math");
const LPFeeLibrary_1 = require("./contract-math/LPFeeLibrary");
const ProtocolFeeLibrary_1 = require("./contract-math/ProtocolFeeLibrary");
const SwapMath_1 = require("./contract-math/SwapMath");
function normalizeAndValidateLimit(args) {
    const { sqrtPriceLimitX96, sqrtPriceCurrentX96, zeroForOne } = args;
    let limit = sqrtPriceLimitX96;
    if (limit === 0n) {
        limit = zeroForOne ? constants_1.MIN_SQRT_RATIO + 1n : constants_1.MAX_SQRT_RATIO - 1n;
    }
    const isValid = zeroForOne
        ? limit < sqrtPriceCurrentX96 && limit > constants_1.MIN_SQRT_RATIO
        : limit > sqrtPriceCurrentX96 && limit < constants_1.MAX_SQRT_RATIO;
    if (!isValid) {
        throw new Error('UniswapV4 price limit is impossible from the current price in this direction.');
    }
    return limit;
}
function createQuoter() {
    function quote({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime }) {
        if (amountIn <= 0n) {
            throw new Error(`UniswapV4 quote expects amountIn > 0, got ${amountIn.toString()}`);
        }
        const { tickSpacing } = runtime.info;
        const { slot0, liquidity: initialLiquidity, ticks } = runtime.state;
        const { tickBitmap } = runtime._temp;
        let sqrtP = slot0.sqrtPriceX96;
        let tick = slot0.tick;
        let liquidity = initialLiquidity;
        if (initialLiquidity === 0n && tickBitmap.size === 0) {
            throw new Error('Cannot quote against an empty UniswapV4 pool (liquidity=0, no initialized ticks)');
        }
        const protocolFeePips = zeroForOne
            ? ProtocolFeeLibrary_1.ProtocolFeeLibrary.getZeroForOneFee(slot0.protocolFee)
            : ProtocolFeeLibrary_1.ProtocolFeeLibrary.getOneForZeroFee(slot0.protocolFee);
        const effectiveLpFeePips = LPFeeLibrary_1.LPFeeLibrary.getInitialLPFee(slot0.lpFee);
        const swapFeePips = protocolFeePips === 0n
            ? effectiveLpFeePips
            : ProtocolFeeLibrary_1.ProtocolFeeLibrary.calculateSwapFee(protocolFeePips, effectiveLpFeePips);
        if (swapFeePips >= SwapMath_1.SwapMath.MAX_SWAP_FEE) {
            throw new Error(`UniswapV4 swap fee too large for exact-in quote: ${swapFeePips.toString()}`);
        }
        const limit = normalizeAndValidateLimit({
            sqrtPriceLimitX96,
            sqrtPriceCurrentX96: sqrtP,
            zeroForOne,
        });
        let amountSpecifiedRemaining = -amountIn;
        let amountCalculated = 0n;
        let feeAmountAcc = 0n;
        let iterations = 0;
        while (amountSpecifiedRemaining !== 0n && sqrtP !== limit) {
            iterations++;
            if (iterations > 64) {
                throw new Error('TOO_MANY_ITERS (likely tick search or swap math not progressing)');
            }
            const stepSqrtPriceStart = sqrtP;
            const { nextTick, initialized } = (0, tick_math_1.nextInitializedTickWithinOneWord)({
                tick,
                tickSpacing,
                lte: zeroForOne,
                tickBitmap,
            });
            let boundedNextTick = nextTick;
            if (boundedNextTick < constants_1.MIN_TICK) {
                boundedNextTick = constants_1.MIN_TICK;
            }
            else if (boundedNextTick > constants_1.MAX_TICK) {
                boundedNextTick = constants_1.MAX_TICK;
            }
            const sqrtPriceAtNextTick = (0, tick_math_1.getSqrtRatioAtTick)(boundedNextTick);
            if (liquidity <= 0n) {
                throw new Error(`UNISWAP_V4_QUOTER: LIQUIDITY_NOT_POSITIVE: L=${liquidity.toString()} tick=${tick} sqrtP=${sqrtP.toString()}`);
            }
            const { sqrtPriceNextX96, amountIn: usedIn, amountOut, feeAmount, } = SwapMath_1.SwapMath.computeSwapStep(sqrtP, SwapMath_1.SwapMath.getSqrtPriceTarget(zeroForOne, sqrtPriceAtNextTick, limit), liquidity, amountSpecifiedRemaining, swapFeePips);
            amountSpecifiedRemaining += usedIn + feeAmount;
            amountCalculated += amountOut;
            feeAmountAcc += feeAmount;
            sqrtP = sqrtPriceNextX96;
            if (sqrtP === sqrtPriceAtNextTick) {
                if (initialized) {
                    const tickInfo = ticks.get(boundedNextTick);
                    if (tickInfo === undefined) {
                        throw new Error(`UNISWAP_V4_QUOTER: initialized tick missing at tick=${boundedNextTick}`);
                    }
                    liquidity = (0, swap_math_1.addLiquidity)(liquidity, tickInfo.liquidityNet, zeroForOne);
                }
                tick = zeroForOne ? boundedNextTick - 1 : boundedNextTick;
            }
            else if (sqrtP !== stepSqrtPriceStart) {
                tick = (0, tick_math_1.getTickAtSqrtRatio)(sqrtP);
            }
        }
        const specifiedDelta = -amountIn - amountSpecifiedRemaining;
        const amount0Delta = zeroForOne ? specifiedDelta : amountCalculated;
        const amount1Delta = zeroForOne ? amountCalculated : specifiedDelta;
        const amountInConsumed = amountIn + amountSpecifiedRemaining;
        return {
            amountOut: amountCalculated,
            amountInConsumed,
            feeAmount: feeAmountAcc,
            sqrtPriceAfterX96: sqrtP,
            tickAfter: tick,
            liquidityAfter: liquidity,
            swapFeePips,
            amount0Delta,
            amount1Delta,
        };
    }
    return { quote };
}
//# sourceMappingURL=quoter.js.map