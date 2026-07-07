"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduceRatio = reduceRatio;
exports.createPricer = createPricer;
function reduceRatio(r) {
    const gcd = (a, b) => {
        a = a < 0n ? -a : a;
        b = b < 0n ? -b : b;
        while (b !== 0n) {
            [a, b] = [b, a % b];
        }
        return a;
    };
    if (r.den === 0n) {
        throw new Error('denominator is zero');
    }
    if (r.num === 0n) {
        return { num: 0n, den: 1n };
    }
    const g = gcd(r.num, r.den);
    let num = r.num / g;
    let den = r.den / g;
    if (den < 0n) {
        num = -num;
        den = -den;
    }
    return { num, den };
}
function createPricer() {
    function computeSpotPrices({ sqrtPriceX96 }) {
        const Q192 = 2n ** 192n;
        if (sqrtPriceX96 === 0n) {
            const z = { num: 0n, den: 1n };
            return { price1Per0: z, price0Per1: z };
        }
        // raw price1/token0 in *raw units*:
        // P = (sqrtPriceX96^2) / 2^192
        const num = sqrtPriceX96 * sqrtPriceX96;
        const price1Per0 = reduceRatio({ num, den: Q192 });
        // exact inverse
        const price0Per1 = price1Per0.num === 0n ? { num: 0n, den: 1n } : reduceRatio({ num: price1Per0.den, den: price1Per0.num });
        return { price1Per0, price0Per1 };
    }
    return { computeSpotPrices };
}
//# sourceMappingURL=pricer.js.map