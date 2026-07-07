"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricer = createPricer;
function createPricer() {
    function computePrices({ reserve0, reserve1 }) {
        if (reserve0 === 0n || reserve1 === 0n) {
            return { price0Per1: { num: 0n, den: 1n }, price1Per0: { num: 0n, den: 1n } };
        }
        const price1Per0 = { num: reserve1, den: reserve0 };
        const price0Per1 = { num: reserve0, den: reserve1 };
        return {
            price1Per0,
            price0Per1,
        };
    }
    return { computePrices };
}
//# sourceMappingURL=pricer.js.map