import type { DynamicFeeConfig, Observation } from './types';
type ObserveTickCumulativesParams = {
    blockTimestamp: number;
    secondsAgos: [number, number];
    currentTick: number;
    observationIndex: number;
    liquidity: bigint;
    observationCardinality: number;
    observations: Map<number, Observation>;
};
export declare function getSlipstreamDefaultBaseFeePips(tickSpacing: number): number;
export declare function getSlipstreamFeePips(args: {
    dynamicFeeConfig: DynamicFeeConfig;
    currentTick: number;
    liquidity: bigint;
    observationIndex: number;
    observationCardinality: number;
    observations: Map<number, Observation>;
    blockTimestamp: number;
    secondsAgo: number;
    defaultBaseFee?: number;
    observeTickCumulatives: (params: ObserveTickCumulativesParams) => bigint[];
}): number;
export declare function resolveSlipstreamFeePips(args: {
    tickSpacing: number;
    dynamicFeeConfig: DynamicFeeConfig;
    currentTick: number;
    liquidity: bigint;
    observationIndex: number;
    observationCardinality: number;
    observations: Map<number, Observation>;
    blockTimestamp: number;
    secondsAgo: number;
    defaultBaseFee?: number;
    observeTickCumulatives: (params: ObserveTickCumulativesParams) => bigint[];
}): {
    feePips: number;
    defaultBaseFeePips: number;
};
export {};
//# sourceMappingURL=fee.d.ts.map