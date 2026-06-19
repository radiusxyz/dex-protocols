import { Addr } from '@src/types';

export type StableSwapPoolInfo = {
  token0: Addr;
  token1: Addr;
  coins: Addr[];
  coinDecimals?: number[];
  assetTypes?: number[];
  oracleRates?: bigint[];
  isErc4626?: boolean[];
  lpToken?: Addr;
  feeRaw?: bigint;
};

export type StableSwapPoolState = {
  reserve0: bigint;
  reserve1: bigint;
  balances: bigint[];
  nCoins?: number;
  fee?: bigint;
  offpegFeeMultiplier?: bigint;
  amplification?: bigint;
  amplificationPrecision?: bigint;
  storedRates?: bigint[];
  assetTypes?: number[];
  oracleRates?: bigint[];
  isErc4626?: boolean[];
  virtualPrice?: bigint;
};

export type StableSwapPoolUpdate = {
  reserve0?: bigint;
  reserve1?: bigint;
  balances?: bigint[];
  nCoins?: number;
  fee?: bigint;
  offpegFeeMultiplier?: bigint;
  amplification?: bigint;
  amplificationPrecision?: bigint;
  storedRates?: bigint[];
  assetTypes?: number[];
  oracleRates?: bigint[];
  isErc4626?: boolean[];
  virtualPrice?: bigint;
};

export type StableSwapRuntime<I extends StableSwapPoolInfo = StableSwapPoolInfo> = {
  info: I;
  state: StableSwapPoolState;
};
