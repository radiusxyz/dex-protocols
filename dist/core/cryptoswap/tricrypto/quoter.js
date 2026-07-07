"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteTriCrypto = exports.analyzeTriCryptoQuote = void 0;
exports.createQuoter = createQuoter;
const swap_math_1 = require("./swap-math");
exports.analyzeTriCryptoQuote = swap_math_1.analyzeTriCryptoQuote;
exports.quoteTriCrypto = swap_math_1.quoteTriCrypto;
function createQuoter() {
    function quote(params) {
        return (0, exports.quoteTriCrypto)(params);
    }
    return { quote };
}
//# sourceMappingURL=quoter.js.map