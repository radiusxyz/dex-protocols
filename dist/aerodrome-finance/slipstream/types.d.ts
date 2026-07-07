import type { UniswapV3PoolInfo, UniswapV3PoolState, UniswapV3PoolUpdate } from '../../uniswap/v3/types';
export type Tick = number;
export type TickSpacing = number;
export type NetLiquidity = bigint;
export type WordPos = number;
export type BitMapWord = bigint;
export type BitPos = number;
export type TickBitmap = Map<WordPos, BitMapWord>;
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
export type DynamicFeeConfig = {
    baseFee: number;
    feeCap: number;
    scalingFactor: bigint;
};
export type AerodromeSlipstreamPoolInfo = Omit<UniswapV3PoolInfo, 'feePips'>;
export type AerodromeSlipstreamPoolState = UniswapV3PoolState & {
    observationState: ObservationState;
    dynamicFeeConfig: DynamicFeeConfig;
};
export type AerodromeSlipstreamPoolUpdate = UniswapV3PoolUpdate & {
    observationIndex?: number;
    observationCardinality?: number;
    updatedObservations?: Map<number, Observation>;
    dynamicFeeConfig?: Partial<DynamicFeeConfig>;
};
export type AerodromeSlipstreamPoolRuntime = {
    info: AerodromeSlipstreamPoolInfo;
    state: AerodromeSlipstreamPoolState;
    _temp: {
        tickBitmap: TickBitmap;
        feeContext?: {
            secondsAgo: number;
            computedFeePips?: number;
            computedAtTimestamp?: number;
        };
    };
};
//# sourceMappingURL=types.d.ts.map