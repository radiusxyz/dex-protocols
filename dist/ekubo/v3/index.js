"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ekuboV3Module = exports.resolveEkuboV3Domain = exports.isEkuboV3ExtensionEnabled = void 0;
const pricer_1 = require("./pricer");
const quoter_1 = require("./quoter");
const reducer_1 = require("./reducer");
var domain_1 = require("./domain");
Object.defineProperty(exports, "isEkuboV3ExtensionEnabled", { enumerable: true, get: function () { return domain_1.isEkuboV3ExtensionEnabled; } });
Object.defineProperty(exports, "resolveEkuboV3Domain", { enumerable: true, get: function () { return domain_1.resolveEkuboV3Domain; } });
exports.ekuboV3Module = {
    reducer: (0, reducer_1.createReducer)(),
    quoter: (0, quoter_1.createQuoter)(),
    pricer: (0, pricer_1.createPricer)(),
};
//# sourceMappingURL=index.js.map