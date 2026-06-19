// You need the “next initialized tick” in direction.
// With ticksSorted this is easy via binary search.

import { Addr } from '../../../types/index';
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

export type UniswapV3PoolInfo = {
  token0: Addr;
  token1: Addr;
  feePips: number;
  tickSpacing: TickSpacing;
};

export type UniswapV3PoolState = {
  sqrtPriceX96: bigint;
  tick: Tick;
  liquidity: bigint;
  ticks: Map<Tick, NetLiquidity>;
};

export type UniswapV3PoolUpdate = {
  sqrtPriceX96?: bigint;
  liquidity?: bigint;
  updatedTicks: Map<Tick, NetLiquidity>;
  deletedTicks: Tick[];
  tick?: Tick;
};

export type UniswapV3PoolRuntime = {
  info: UniswapV3PoolInfo;
  state: UniswapV3PoolState;
  // Temporary data for quoter/pricer use only
  _temp: {
    tickBitmap: TickBitmap;
  };
};
