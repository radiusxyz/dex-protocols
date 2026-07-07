"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReducer = createReducer;
const reducer_1 = require("../core/cryptoswap/reducer");
const reducer_2 = require("../core/stableswap/reducer");
const domain_1 = require("./domain");
function createReducer() {
    const stableSwapReducer = (0, reducer_2.createReducer)();
    const cryptoSwapReducer = (0, reducer_1.createReducer)();
    function init(info, state) {
        const domain = (0, domain_1.resolveCurveDomain)({
            poolKind: info.poolKind,
            poolFamily: info.poolFamily,
            state,
            ...(info.staticAttributes ? { staticAttributes: info.staticAttributes } : {}),
        });
        if (domain === 'ignore') {
            throw new Error('Curve LLAMMA pools are excluded from runtime initialization');
        }
        return domain === 'cryptoswap-legacy-2' ||
            domain === 'cryptoswap-2' ||
            domain === 'cryptoswap-legacy-tricrypto2' ||
            domain === 'cryptoswap-3'
            ? cryptoSwapReducer.init(info, state)
            : stableSwapReducer.init(info, state);
    }
    function applyUpdates(runtime, update) {
        const updateSuggestsCryptoSwap = update.priceOracle !== undefined ||
            update.priceScale !== undefined ||
            update.lastPrices !== undefined ||
            update.maTime !== undefined;
        const domain = (0, domain_1.resolveCurveDomain)({
            poolKind: runtime.info.poolKind,
            poolFamily: runtime.info.poolFamily,
            state: updateSuggestsCryptoSwap ? update : runtime.state,
            ...(runtime.info.staticAttributes ? { staticAttributes: runtime.info.staticAttributes } : {}),
        });
        if (domain === 'ignore') {
            throw new Error('Curve LLAMMA pools are excluded from runtime updates');
        }
        return domain === 'cryptoswap-legacy-2' ||
            domain === 'cryptoswap-2' ||
            domain === 'cryptoswap-legacy-tricrypto2' ||
            domain === 'cryptoswap-3'
            ? cryptoSwapReducer.applyUpdates(runtime, update)
            : stableSwapReducer.applyUpdates(runtime, update);
    }
    return { init, applyUpdates };
}
//# sourceMappingURL=reducer.js.map