"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aerodromeVolatileModule = void 0;
const pricer_1 = require("../../core/cpmm/pricer");
const quoter_1 = require("../../core/cpmm/quoter");
const reducer_1 = require("../../core/cpmm/reducer");
exports.aerodromeVolatileModule = {
    reducer: (0, reducer_1.createReducer)(),
    quoter: (0, quoter_1.createQuoter)(),
    pricer: (0, pricer_1.createPricer)(),
};
//# sourceMappingURL=index.js.map