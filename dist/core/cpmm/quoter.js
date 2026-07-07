"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuoter = createQuoter;
const constants_1 = require("./constants");
// Pricer types
function createQuoter() {
    function quote({ amountIn, zeroForOne, runtime }) {
        const { state, info } = runtime;
        const { feeBps } = info;
        const { reserve0, reserve1 } = state;
        if (amountIn <= 0n) {
            throw new Error('amountIn must be > 0');
        }
        if (reserve0 <= 0n || reserve1 <= 0n) {
            throw new Error('reserves must be > 0');
        }
        if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps >= 10_000) {
            throw new Error('feeBps must be an integer in [0, 9999]');
        }
        const feeBpsBigInt = BigInt(feeBps);
        // multiplier after fee
        const m = constants_1.FEE_DENOMINATOR - feeBpsBigInt;
        const reserveIn = zeroForOne ? reserve0 : reserve1;
        const reserveOut = zeroForOne ? reserve1 : reserve0;
        const amountInWithFee = amountIn * m;
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn * constants_1.FEE_DENOMINATOR + amountInWithFee;
        const amountOut = numerator / denominator;
        if (amountOut <= 0n) {
            throw new Error('amountOut <= 0');
        }
        if (amountOut >= reserveOut) {
            throw new Error('amountOut >= reserveOut');
        } // safety
        let reserve0After;
        let reserve1After;
        if (zeroForOne) {
            reserve0After = reserve0 + amountIn;
            reserve1After = reserve1 - amountOut;
        }
        else {
            reserve1After = reserve1 + amountIn;
            reserve0After = reserve0 - amountOut;
        }
        if (reserve0After <= 0n || reserve1After <= 0n) {
            throw new Error('post-swap reserves invalid');
        }
        return {
            amountOut,
            reserve0: reserve0After,
            reserve1: reserve1After,
        };
    }
    return { quote };
}
//# sourceMappingURL=quoter.js.map