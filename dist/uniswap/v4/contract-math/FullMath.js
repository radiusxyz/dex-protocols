"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullMath = void 0;
const constants_1 = require("../../../core/clmm/constants");
class FullMath {
    static mulDiv(a, b, denominator) {
        const result = (a * b) / denominator;
        if (result > constants_1.MAX_UINT256) {
            throw new Error('FullMath.mulDiv overflow');
        }
        return result;
    }
    static mulDivRoundingUp(a, b, denominator) {
        const result = (a * b + denominator - 1n) / denominator;
        if (result > constants_1.MAX_UINT256) {
            throw new Error('FullMath.mulDivRoundingUp overflow');
        }
        return result;
    }
}
exports.FullMath = FullMath;
//# sourceMappingURL=FullMath.js.map