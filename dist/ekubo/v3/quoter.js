"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuoter = createQuoter;
const quoter_1 = require("../../core/stableswap/quoter");
const quoter_2 = require("../common/quoter");
const domain_1 = require("./domain");
function isStableRuntime(runtime) {
    return runtime.info.poolKind === 'stableswap';
}
function isConcentratedRuntime(runtime) {
    return runtime.info.poolKind === 'concentrated';
}
function createQuoter() {
    const stableSwapQuoter = (0, quoter_1.createQuoter)();
    function quote({ runtime, ...params }) {
        const domain = (0, domain_1.resolveEkuboV3Domain)({
            poolKind: runtime.info.poolKind,
            extension: runtime.info.extension,
        });
        if (domain !== 'concentrated') {
            if (!isStableRuntime(runtime)) {
                throw new Error(`EkuboV3 domain ${domain} requires a stable runtime.`);
            }
            const stableRuntime = runtime;
            const tokenInIndex = params.zeroForOne ? 0 : 1;
            const tokenOutIndex = params.zeroForOne ? 1 : 0;
            const result = stableSwapQuoter.quote({
                amountIn: params.amountIn,
                tokenInIndex,
                tokenOutIndex,
                balances: stableRuntime.state.balances,
                nCoins: stableRuntime.state.nCoins,
                runtime: stableRuntime,
                ...(stableRuntime.state.fee !== undefined ? { fee: stableRuntime.state.fee } : {}),
                ...(stableRuntime.state.amplification !== undefined
                    ? { amplification: stableRuntime.state.amplification }
                    : {}),
                ...(stableRuntime.state.amplificationPrecision !== undefined
                    ? { amplificationPrecision: stableRuntime.state.amplificationPrecision }
                    : {}),
            });
            return {
                amountOut: result.amountOut,
                sqrtRatioAfterX128: runtime.state.sqrtRatioX128,
                tickAfter: runtime.state.tick,
                liquidityAfter: runtime.state.liquidity,
            };
        }
        if (!isConcentratedRuntime(runtime)) {
            throw new Error(`EkuboV3 domain ${domain} requires a concentrated runtime.`);
        }
        if (runtime.info.tickSpacing <= 0) {
            throw new Error(`EkuboV3 domain ${domain} is not supported by the CLMM quoter yet.`);
        }
        // Ekubo v3 extensions change pool identity/config semantics, but the latest Tycho
        // state we consume is still expressed as CLMM liquidity/ticks. We therefore reuse
        // the common exact-in quote path unless a future extension requires extra state.
        return (0, quoter_2.quoteExactIn)({
            ...params,
            runtime,
        });
    }
    function quoteMidFeePips(amountIn, sqrtRatioX128, tokenInIsToken0, feePips) {
        return (0, quoter_2.quoteMidFeePips)(amountIn, sqrtRatioX128, tokenInIsToken0, feePips);
    }
    return { quote, quoteMidFeePips };
}
//# sourceMappingURL=quoter.js.map