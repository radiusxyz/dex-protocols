import type {
  StableSwapPoolInfo,
  StableSwapPoolState,
  StableSwapPoolUpdate,
  StableSwapRuntime,
} from '../stableswap/types';

export type CryptoSwapPoolInfo = StableSwapPoolInfo;

export type CryptoSwapPoolState = StableSwapPoolState & {
  invariant?: bigint;
  currentTimestamp?: bigint;
  futureAGammaTime?: bigint;
  midFee?: bigint;
  outFee?: bigint;
  feeGamma?: bigint;
  gamma?: bigint;
  precisions?: bigint[];
  priceOracle?: bigint[];
  priceScale?: bigint[];
  lastPrices?: bigint[];
  maTime?: bigint;
};

export type CryptoSwapPoolUpdate = StableSwapPoolUpdate & {
  invariant?: bigint;
  currentTimestamp?: bigint;
  futureAGammaTime?: bigint;
  midFee?: bigint;
  outFee?: bigint;
  feeGamma?: bigint;
  gamma?: bigint;
  precisions?: bigint[];
  priceOracle?: bigint[];
  priceScale?: bigint[];
  lastPrices?: bigint[];
  maTime?: bigint;
};

export type CryptoSwapRuntime<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo> = Omit<
  StableSwapRuntime<I>,
  'state'
> & {
  state: CryptoSwapPoolState;
};
