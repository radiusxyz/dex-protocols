"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricer = createPricer;
const pricer_1 = require("../../core/clmm/pricer");
function createPricer() {
    function computeSpotPrices({ sqrtRatioX128 }) {
        const q256 = 2n ** 256n;
        if (sqrtRatioX128 === 0n) {
            const z = { num: 0n, den: 1n };
            return { price1Per0: z, price0Per1: z };
        }
        const num = sqrtRatioX128 * sqrtRatioX128;
        const price1Per0 = (0, pricer_1.reduceRatio)({ num, den: q256 });
        const price0Per1 = price1Per0.num === 0n ? { num: 0n, den: 1n } : (0, pricer_1.reduceRatio)({ num: price1Per0.den, den: price1Per0.num });
        return { price1Per0, price0Per1 };
    }
    return { computeSpotPrices };
}
//# sourceMappingURL=pricer.js.map