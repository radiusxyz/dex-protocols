"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapMath = void 0;
const constants_1 = require("../../../core/clmm/constants");
const FullMath_1 = require("./FullMath");
const SqrtPriceMath_1 = require("./SqrtPriceMath");
class SwapMath {
    static MAX_SWAP_FEE = constants_1.FEE_DENOMINATOR;
    static getSqrtPriceTarget(zeroForOne, sqrtPriceNextX96, sqrtPriceLimitX96) {
        const nextOrLimit = (sqrtPriceNextX96 < sqrtPriceLimitX96 ? 1 : 0) ^ (zeroForOne ? 1 : 0);
        const symDiff = sqrtPriceNextX96 ^ sqrtPriceLimitX96;
        return sqrtPriceLimitX96 ^ (symDiff * BigInt(nextOrLimit));
    }
    static computeSwapStep(sqrtPriceCurrentX96, sqrtPriceTargetX96, liquidity, amountRemaining, feePips) {
        const _feePips = BigInt.asUintN(256, feePips);
        const zeroForOne = sqrtPriceCurrentX96 >= sqrtPriceTargetX96;
        const exactIn = amountRemaining < 0n;
        let amountIn = 0n;
        let amountOut = 0n;
        let feeAmount = 0n;
        let sqrtPriceNextX96 = 0n;
        if (exactIn) {
            const amountRemainingLessFee = FullMath_1.FullMath.mulDiv(BigInt(-amountRemaining), SwapMath.MAX_SWAP_FEE - _feePips, SwapMath.MAX_SWAP_FEE);
            amountIn = zeroForOne
                ? SqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(sqrtPriceTargetX96, sqrtPriceCurrentX96, liquidity, true)
                : SqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(sqrtPriceCurrentX96, sqrtPriceTargetX96, liquidity, true);
            if (amountRemainingLessFee >= amountIn) {
                sqrtPriceNextX96 = sqrtPriceTargetX96;
                feeAmount =
                    _feePips === SwapMath.MAX_SWAP_FEE
                        ? amountIn
                        : FullMath_1.FullMath.mulDivRoundingUp(amountIn, _feePips, SwapMath.MAX_SWAP_FEE - _feePips);
            }
            else {
                amountIn = amountRemainingLessFee;
                sqrtPriceNextX96 = SqrtPriceMath_1.SqrtPriceMath.getNextSqrtPriceFromInput(sqrtPriceCurrentX96, liquidity, amountRemainingLessFee, zeroForOne);
                feeAmount = BigInt(-amountRemaining) - amountIn;
            }
            amountOut = zeroForOne
                ? SqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(sqrtPriceNextX96, sqrtPriceCurrentX96, liquidity, false)
                : SqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(sqrtPriceCurrentX96, sqrtPriceNextX96, liquidity, false);
        }
        else {
            amountOut = zeroForOne
                ? SqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(sqrtPriceTargetX96, sqrtPriceCurrentX96, liquidity, false)
                : SqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(sqrtPriceCurrentX96, sqrtPriceTargetX96, liquidity, false);
            if (amountRemaining >= amountOut) {
                sqrtPriceNextX96 = sqrtPriceTargetX96;
            }
            else {
                amountOut = amountRemaining;
                sqrtPriceNextX96 = SqrtPriceMath_1.SqrtPriceMath.getNextSqrtPriceFromOutput(sqrtPriceCurrentX96, liquidity, amountOut, zeroForOne);
            }
            amountIn = zeroForOne
                ? SqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(sqrtPriceNextX96, sqrtPriceCurrentX96, liquidity, true)
                : SqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(sqrtPriceCurrentX96, sqrtPriceNextX96, liquidity, true);
            feeAmount = FullMath_1.FullMath.mulDivRoundingUp(amountIn, _feePips, SwapMath.MAX_SWAP_FEE - _feePips);
        }
        return { sqrtPriceNextX96, amountIn, amountOut, feeAmount };
    }
}
exports.SwapMath = SwapMath;
//# sourceMappingURL=SwapMath.js.map