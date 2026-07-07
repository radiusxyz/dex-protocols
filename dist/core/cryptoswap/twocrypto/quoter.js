"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteTwoCryptoNg = exports.computeTwoCryptoNgDynamicFee = exports.analyzeTwoCryptoNgQuote = void 0;
exports.createQuoter = createQuoter;
const swap_math_1 = require("./swap-math");
exports.analyzeTwoCryptoNgQuote = swap_math_1.analyzeTwoCryptoNgQuote;
exports.computeTwoCryptoNgDynamicFee = swap_math_1.computeTwoCryptoNgDynamicFee;
exports.quoteTwoCryptoNg = swap_math_1.quoteTwoCryptoNg;
function createQuoter() {
    function quote(params) {
        return (0, exports.quoteTwoCryptoNg)(params);
    }
    return { quote };
}
//# sourceMappingURL=quoter.js.map