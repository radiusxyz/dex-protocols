"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlipstreamDefaultBaseFeePips = getSlipstreamDefaultBaseFeePips;
exports.getSlipstreamFeePips = getSlipstreamFeePips;
exports.resolveSlipstreamFeePips = resolveSlipstreamFeePips;
// src/aerodrome-finance/slipstream/fee.ts
const constants_1 = require("./constants");
function getSlipstreamDefaultBaseFeePips(tickSpacing) {
    // Keep this mapping as the single source of truth for Slipstream's default
    // base fee by tickSpacing. Both the domain quoter path and Paraswap tx-builder
    // reuse this helper so they cannot silently drift apart.
    switch (tickSpacing) {
        case 1:
            return 100;
        case 10:
        case 50:
        case 100:
            return 500;
        case 200:
            return 3000;
        case 500:
            return 10000;
        case 2000:
            return 10000;
        default:
            throw new Error(`Unsupported AerodromeSlipstream tickSpacing: ${tickSpacing}`);
    }
}
function getSlipstreamFeePips(args) {
    const { dynamicFeeConfig, currentTick, liquidity, observationIndex, observationCardinality, observations, blockTimestamp, secondsAgo, defaultBaseFee = 0, observeTickCumulatives, } = args;
    // 420 => force 0 fee
    if (dynamicFeeConfig.baseFee === constants_1.ZERO_FEE_INDICATOR) {
        return 0;
    }
    // baseFee: if 0 => fallback
    const baseFee = dynamicFeeConfig.baseFee === 0 ? defaultBaseFee : dynamicFeeConfig.baseFee;
    // If scalingFactor == 0, protocol uses defaults (and dynamic part becomes 0 anyway)
    const scalingFactor = dynamicFeeConfig.scalingFactor !== 0n ? dynamicFeeConfig.scalingFactor : constants_1.DEFAULT_SCALING_FACTOR;
    const feeCap = dynamicFeeConfig.scalingFactor !== 0n ? dynamicFeeConfig.feeCap : constants_1.DEFAULT_FEE_CAP;
    if (observationCardinality < constants_1.MIN_OBSERVATION_CARDINALITY) {
        return Math.min(baseFee, feeCap);
    }
    const tickCumulatives = (() => {
        try {
            return observeTickCumulatives({
                blockTimestamp,
                secondsAgos: [secondsAgo, 0],
                currentTick,
                observationIndex,
                liquidity,
                observationCardinality,
                observations,
            });
        }
        catch {
            return null;
        }
    })();
    if (!tickCumulatives || tickCumulatives.length < 2) {
        return Math.min(baseFee, feeCap);
    }
    const [tickCumulative0, tickCumulative1] = tickCumulatives;
    if (tickCumulative0 === undefined || tickCumulative1 === undefined) {
        return Math.min(baseFee, feeCap);
    }
    const delta = tickCumulative1 - tickCumulative0;
    const denom = BigInt(secondsAgo);
    // Slipstream/Rust path uses integer division semantics (truncate toward zero).
    // Do not apply Uniswap style negative floor adjustment here.
    const mean = delta / denom;
    const twAvgTick = Number(mean);
    const absTickDelta = Math.abs(currentTick - twAvgTick);
    const dynamicFee = Number((BigInt(absTickDelta) * scalingFactor) / constants_1.SCALING_PRECISION);
    const total = baseFee + dynamicFee;
    return Math.min(total, feeCap);
}
function resolveSlipstreamFeePips(args) {
    const defaultBaseFeePips = args.defaultBaseFee ?? getSlipstreamDefaultBaseFeePips(args.tickSpacing);
    const feePips = getSlipstreamFeePips({
        dynamicFeeConfig: args.dynamicFeeConfig,
        currentTick: args.currentTick,
        liquidity: args.liquidity,
        observationIndex: args.observationIndex,
        observationCardinality: args.observationCardinality,
        observations: args.observations,
        blockTimestamp: args.blockTimestamp,
        secondsAgo: args.secondsAgo,
        defaultBaseFee: defaultBaseFeePips,
        observeTickCumulatives: args.observeTickCumulatives,
    });
    return { feePips, defaultBaseFeePips };
}
//# sourceMappingURL=fee.js.map