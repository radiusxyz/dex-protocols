"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POWERS_OF_2 = exports.MAX_SQRT_RATIO = exports.MIN_SQRT_RATIO = exports.MAX_TICK = exports.MIN_TICK = exports.MAX_UINT256 = exports.ONE = exports.ZERO = exports.NEGATIVE_ONE = exports.FEE_DENOMINATOR = exports.Q192 = exports.Q128 = exports.Q96 = exports.Q32 = void 0;
exports.Q32 = 2n ** 32n;
exports.Q96 = 2n ** 96n;
exports.Q128 = 2n ** 128n;
exports.Q192 = exports.Q96 * exports.Q96; // or 2n ** 192n
exports.FEE_DENOMINATOR = 1000000n;
exports.NEGATIVE_ONE = -1n;
exports.ZERO = 0n;
exports.ONE = 1n;
exports.MAX_UINT256 = (1n << 256n) - 1n;
// Uniswap v3-core constants
exports.MIN_TICK = -887272;
exports.MAX_TICK = 887272;
// From v3-core TickMath.sol
exports.MIN_SQRT_RATIO = 4295128739n;
exports.MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n;
// same powers as SDK
exports.POWERS_OF_2 = [
    [128, 1n << 128n],
    [64, 1n << 64n],
    [32, 1n << 32n],
    [16, 1n << 16n],
    [8, 1n << 8n],
    [4, 1n << 4n],
    [2, 1n << 2n],
    [1, 1n << 1n],
];
//# sourceMappingURL=constants.js.map