"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricer = createPricer;
const pricer_1 = require("../../core/clmm/pricer");
function createPricer() {
    const clmmPricer = (0, pricer_1.createPricer)();
    function computeSpotPrices({ runtime }) {
        return clmmPricer.computeSpotPrices({
            sqrtPriceX96: runtime.state.slot0.sqrtPriceX96,
        });
    }
    return { computeSpotPrices };
}
//# sourceMappingURL=pricer.js.map