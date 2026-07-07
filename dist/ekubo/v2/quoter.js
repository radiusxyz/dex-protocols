"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuoter = createQuoter;
const quoter_1 = require("../common/quoter");
function createQuoter() {
    function quote({ amountIn, zeroForOne, sqrtRatioLimitX128, runtime }) {
        return (0, quoter_1.quoteExactIn)({
            amountIn,
            zeroForOne,
            sqrtRatioLimitX128,
            runtime,
        });
    }
    function quoteMidFeePips(amountIn, sqrtRatioX128, tokenInIsToken0, feePips) {
        return (0, quoter_1.quoteMidFeePips)(amountIn, sqrtRatioX128, tokenInIsToken0, feePips);
    }
    return { quote, quoteMidFeePips };
}
//# sourceMappingURL=quoter.js.map