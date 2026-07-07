"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.U32 = exports.SCALING_PRECISION = exports.DEFAULT_FEE_CAP = exports.DEFAULT_SCALING_FACTOR = exports.MIN_OBSERVATION_CARDINALITY = exports.MIN_SECONDS_AGO = exports.DEFAULT_SECONDS_AGO = exports.ZERO_FEE_INDICATOR = exports.MAX_TICK = exports.MIN_TICK = void 0;
exports.MIN_TICK = -887272;
exports.MAX_TICK = 887272;
exports.ZERO_FEE_INDICATOR = 420;
exports.DEFAULT_SECONDS_AGO = 600;
exports.MIN_SECONDS_AGO = 2;
exports.MIN_OBSERVATION_CARDINALITY = Math.floor(exports.DEFAULT_SECONDS_AGO / exports.MIN_SECONDS_AGO);
exports.DEFAULT_SCALING_FACTOR = 0n;
exports.DEFAULT_FEE_CAP = 10_000;
exports.SCALING_PRECISION = 1000000n;
exports.U32 = 2 ** 32;
//# sourceMappingURL=constants.js.map