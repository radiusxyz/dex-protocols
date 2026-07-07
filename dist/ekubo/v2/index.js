"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ekuboV2Module = void 0;
const pricer_1 = require("./pricer");
const quoter_1 = require("./quoter");
const reducer_1 = require("./reducer");
exports.ekuboV2Module = {
    reducer: (0, reducer_1.createReducer)(),
    quoter: (0, quoter_1.createQuoter)(),
    pricer: (0, pricer_1.createPricer)(),
};
//# sourceMappingURL=index.js.map