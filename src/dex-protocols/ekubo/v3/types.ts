import { Addr } from '../../../types/index';

export type EkuboV3PoolFamily = 'clmm' | 'stableswap';
export type EkuboV3PoolKind = 'concentrated' | 'stableswap';

export type Tick = number;
export type TickSpacing = number;
export type NetLiquidity = bigint;
export type WordPos = number;
export type BitMapWord = bigint;
export type BitPos = number;
export type TickBitmap = Map<WordPos, BitMapWord>;

type EkuboV3PoolInfoBase = {
  token0: Addr;
  token1: Addr;
  feePips: number;
  poolTypeConfig: string;
  extension: Addr;
};

export type EkuboV3ConcentratedPoolInfo = EkuboV3PoolInfoBase & {
  poolFamily: 'clmm';
  poolKind: 'concentrated';
  tickSpacing: TickSpacing;
};

export type EkuboV3StablePoolInfo = EkuboV3PoolInfoBase & {
  poolFamily: 'stableswap';
  poolKind: 'stableswap';
  amplification?: number;
  centerTick?: number;
  tickSpacing?: never;
  coins: Addr[];
};

type EkuboV3PoolStateBase = {
  sqrtRatioX128: bigint;
  tick: Tick;
  liquidity: bigint;
  ticks: Map<Tick, NetLiquidity>;
};

export type EkuboV3ConcentratedPoolState = EkuboV3PoolStateBase;

export type EkuboV3StablePoolState = EkuboV3PoolStateBase & {
  balances: bigint[];
  reserve0: bigint;
  reserve1: bigint;
  nCoins: number;
  fee?: bigint;
  amplification?: bigint;
  amplificationPrecision?: bigint;
};

export type EkuboV3PoolInfo = EkuboV3ConcentratedPoolInfo | EkuboV3StablePoolInfo;
export type EkuboV3PoolState = EkuboV3ConcentratedPoolState | EkuboV3StablePoolState;

export type EkuboV3PoolUpdate = {
  sqrtRatioX128?: bigint;
  liquidity?: bigint;
  updatedTicks: Map<Tick, NetLiquidity>;
  deletedTicks: Tick[];
  tick?: Tick;
};

type EkuboV3PoolRuntimeBase = {
  _temp: {
    tickBitmap: TickBitmap;
  };
};

export type EkuboV3ConcentratedPoolRuntime = EkuboV3PoolRuntimeBase & {
  info: EkuboV3ConcentratedPoolInfo;
  state: EkuboV3ConcentratedPoolState;
};

export type EkuboV3StablePoolRuntime = EkuboV3PoolRuntimeBase & {
  info: EkuboV3StablePoolInfo;
  state: EkuboV3StablePoolState;
};

export type EkuboV3PoolRuntime = EkuboV3ConcentratedPoolRuntime | EkuboV3StablePoolRuntime;
