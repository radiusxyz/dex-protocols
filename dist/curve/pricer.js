"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricer = createPricer;
const pricer_1 = require("../core/cryptoswap/pricer");
const pricer_2 = require("../core/stableswap/pricer");
function createPricer() {
    const stableSwapPricer = (0, pricer_2.createPricer)();
    const cryptoSwapPricer = (0, pricer_1.createPricer)();
    function computePrices(params) {
        return params.reserve0 === 0n || params.reserve1 === 0n
            ? stableSwapPricer.computePrices(params)
            : cryptoSwapPricer.computePrices(params);
    }
    return { computePrices };
}
//# sourceMappingURL=pricer.js.map