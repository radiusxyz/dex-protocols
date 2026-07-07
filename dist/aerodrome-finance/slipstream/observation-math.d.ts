export type Observation = {
    blockTimestamp: number;
    tickCumulative: bigint;
    secondsPerLiquidityCumulativeX128: bigint;
    initialized: boolean;
};
export type ObservationState = {
    observations: Map<number, Observation>;
    observationIndex: number;
    observationCardinality: number;
};
export declare function observeTickCumulativesSlipstream(args: {
    time: number;
    secondsAgos: [number, number];
    tick: number;
    observationState: ObservationState;
    liquidity: bigint;
}): bigint[];
//# sourceMappingURL=observation-math.d.ts.map