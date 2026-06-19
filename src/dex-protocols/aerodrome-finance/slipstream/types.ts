// You need the “next initialized tick” in direction.
// With ticksSorted this is easy via binary search.

import { UniswapV3PoolInfo, UniswapV3PoolState, UniswapV3PoolUpdate } from '@src/dex-protocols/uniswap/v3/types';
// Current tick, can be negative, can be uninitialized
export type Tick = number;
// Tick spacing, always positive
export type TickSpacing = number;
export type NetLiquidity = bigint;
// Identifies a chunk of 256 compressed ticks
// Which group of 256 possible tick slots am I looking at?
export type WordPos = number;
// Picks the bit inside the word
// Inside that group, which of the 256 slots are initialized?
export type BitMapWord = bigint;
// Within this word (this group of 256 compressed ticks), which specific slot corresponds to my tick?
export type BitPos = number; // must be in [0..255]

export type TickBitmap = Map<WordPos, BitMapWord>;

// ===== Observations =====

export type Observation = {
  blockTimestamp: number; // uint32 in solidity, but number is fine in JS
  tickCumulative: bigint; // int56 in V3; store as bigint
  secondsPerLiquidityCumulativeX128: bigint; // uint160
  initialized: boolean;
};

// Keep both the "buffer" and the head pointers needed to query it
export type ObservationState = {
  observations: Map<number, Observation>; // key = ring slot index
  observationIndex: number; // head pointer
  observationCardinality: number; // active length
};

// ===== Dynamic Fee Config =====

export type DynamicFeeConfig = {
  baseFee: number; // u32; 0 => use defaultBaseFee; 420 => force 0
  feeCap: number; // u32; if scalingFactor==0 => use DEFAULT_FEE_CAP
  scalingFactor: bigint; // u64; 0 => use DEFAULT_SCALING_FACTOR (and default cap)
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
  // Temporary data for quoter/pricer use only
  _temp: {
    tickBitmap: TickBitmap;

    // Inputs for dynamic fee computation during a quote
    feeContext?: {
      secondsAgo: number; // e.g. 600
      computedFeePips?: number; // fee used for this quote step(s)
      computedAtTimestamp?: number; // optional
    };
  };
};
