"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricer = createPricer;
const pricer_1 = require("../stableswap/pricer");
function createPricer() {
    const stableSwapPricer = (0, pricer_1.createPricer)();
    function computePrices(params) {
        return stableSwapPricer.computePrices(params);
    }
    return { computePrices };
}
//# sourceMappingURL=pricer.js.map