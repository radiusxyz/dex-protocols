"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsafeMath = void 0;
class UnsafeMath {
    static divRoundingUp(x, y) {
        if (x === 0n) {
            return 0n;
        }
        return (x + y - 1n) / y;
    }
    static simpleMulDiv(a, b, denominator) {
        if (denominator === 0n) {
            return 0n;
        }
        return (a * b) / denominator;
    }
}
exports.UnsafeMath = UnsafeMath;
//# sourceMappingURL=UnsafeMath.js.map