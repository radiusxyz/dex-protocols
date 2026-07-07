"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aerodromeSlipstreamModule = void 0;
const pricer_1 = require("../../core/clmm/pricer");
const quoter_1 = require("./quoter");
const reducer_1 = require("./reducer");
exports.aerodromeSlipstreamModule = {
    reducer: (0, reducer_1.createReducer)(),
    quoter: (0, quoter_1.createQuoter)(),
    pricer: (0, pricer_1.createPricer)(),
};
//# sourceMappingURL=index.js.map