"use strict";
// src/protocols/aerodrome-finance/slipstream/quoter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuoter = createQuoter;
const index_1 = require("../../uniswap/v3/index");
const constants_1 = require("./constants");
const fee_1 = require("./fee");
const observation_math_1 = require("./observation-math");
function createQuoter() {
    const { quote: quoteUniswapV3, quoteMidFeePips } = index_1.uniswapV3Module.quoter;
    function quote({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime, blockTimestamp, secondsAgo = constants_1.DEFAULT_SECONDS_AGO, defaultBaseFee, }) {
        // optional cache by (blockTimestamp, secondsAgo)
        const cached = runtime._temp.feeContext;
        const feePips = cached &&
            cached.computedAtTimestamp === blockTimestamp &&
            cached.secondsAgo === secondsAgo &&
            cached.computedFeePips !== undefined
            ? cached.computedFeePips
            : (0, fee_1.resolveSlipstreamFeePips)({
                tickSpacing: runtime.info.tickSpacing,
                dynamicFeeConfig: runtime.state.dynamicFeeConfig,
                currentTick: runtime.state.tick,
                liquidity: runtime.state.liquidity,
                observationIndex: runtime.state.observationState.observationIndex,
                observationCardinality: runtime.state.observationState.observationCardinality,
                observations: runtime.state.observationState.observations,
                blockTimestamp,
                secondsAgo,
                ...(defaultBaseFee !== undefined ? { defaultBaseFee } : {}),
                observeTickCumulatives: ({ blockTimestamp, secondsAgos, currentTick, observationIndex, liquidity, observationCardinality, observations, }) => (0, observation_math_1.observeTickCumulativesSlipstream)({
                    time: blockTimestamp,
                    secondsAgos,
                    tick: currentTick,
                    observationState: {
                        observations,
                        observationIndex,
                        observationCardinality,
                    },
                    liquidity,
                }),
            }).feePips;
        runtime._temp.feeContext = {
            secondsAgo,
            computedFeePips: feePips,
            computedAtTimestamp: blockTimestamp,
        };
        return quoteUniswapV3({
            amountIn,
            zeroForOne,
            sqrtPriceLimitX96,
            runtime: {
                info: {
                    ...runtime.info,
                    feePips,
                },
                state: runtime.state,
                _temp: runtime._temp,
            },
        });
    }
    return { quote, quoteMidFeePips };
}
//# sourceMappingURL=quoter.js.map