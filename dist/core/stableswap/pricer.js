"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricer = createPricer;
function createPricer() {
    function computePrices({ reserve0, reserve1 }) {
        if (reserve0 === 0n || reserve1 === 0n) {
            return {
                price0Per1: { num: 0n, den: 1n },
                price1Per0: { num: 0n, den: 1n },
            };
        }
        return {
            price0Per1: { num: reserve0, den: reserve1 },
            price1Per0: { num: reserve1, den: reserve0 },
        };
    }
    return { computePrices };
}
//# sourceMappingURL=pricer.js.map