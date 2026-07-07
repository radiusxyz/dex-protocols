"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReducer = createReducer;
function createReducer() {
    function init(info, state) {
        // If snapshot is already representative state, return it.
        // If you want to avoid shared references, clone here (not necessary for two bigints).
        return { info, state };
    }
    function applyUpdates(runtime, update) {
        let changed = false;
        if (update.reserve0 !== undefined && update.reserve0 !== runtime.state.reserve0) {
            runtime.state.reserve0 = update.reserve0;
            changed = true;
        }
        if (update.reserve1 !== undefined && update.reserve1 !== runtime.state.reserve1) {
            runtime.state.reserve1 = update.reserve1;
            changed = true;
        }
        return changed;
    }
    return { init, applyUpdates };
}
//# sourceMappingURL=reducer.js.map