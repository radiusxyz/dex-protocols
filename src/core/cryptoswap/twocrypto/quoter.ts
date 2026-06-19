import {
  analyzeTwoCryptoNgQuote as analyzeTwoCryptoNgQuoteMath,
  computeTwoCryptoNgDynamicFee as computeTwoCryptoNgDynamicFeeMath,
  quoteTwoCryptoNg as quoteTwoCryptoNgMath,
} from './swap-math';

import type { CryptoSwapPoolInfo, CryptoSwapRuntime } from '../types';
import type { Addr } from '../../../../types/index';

export type TwoCryptoQuoterParams<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo> = {
  amountIn: bigint;
  runtime?: CryptoSwapRuntime<I>;
  tokenInIndex: number;
  tokenOutIndex: number;
  balances: bigint[];
  fee?: bigint;
  midFee?: bigint;
  outFee?: bigint;
  feeGamma?: bigint;
  amplification?: bigint;
  amplificationPrecision?: bigint;
  gamma?: bigint;
  invariant?: bigint;
  currentTimestamp?: bigint;
  futureAGammaTime?: bigint;
  useLegacyMath?: boolean;
  nCoins: number;
  tokenIn?: Addr;
  tokenOut?: Addr;
  coins?: Addr[];
  precisions?: bigint[];
  coinDecimals?: number[];
  priceScale?: bigint[];
  priceOracle?: bigint[];
  lastPrices?: bigint[];
};

export type TwoCryptoQuoterReturn = {
  amountOut: bigint;
  balancesAfter: bigint[];
  reserve0?: bigint;
  reserve1?: bigint;
};

export type TwoCryptoQuoteAnalysis = {
  effectivePriceScales: bigint[];
  dxXp: bigint;
  reserveInXp: bigint;
  reserveOutXp: bigint;
  xpBefore: bigint[];
  xpAfterIn: bigint[];
  D: bigint;
  y: bigint;
  dyRaw: bigint;
  dyRawRoundedUp: bigint;
  noFeeAmountOut: bigint;
  dynamicFee: bigint;
  feeAmount: bigint;
  dyNet: bigint;
  amountOut: bigint;
  amountOutRoundedUp: bigint;
  denormalizationLoss: bigint;
  amountInRoundTrip: bigint;
  amountInRoundTripLoss: bigint;
};

export const analyzeTwoCryptoNgQuote = analyzeTwoCryptoNgQuoteMath;
export const computeTwoCryptoNgDynamicFee = computeTwoCryptoNgDynamicFeeMath;
export const quoteTwoCryptoNg = quoteTwoCryptoNgMath;

export function createQuoter<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo>() {
  function quote(params: TwoCryptoQuoterParams<I>): TwoCryptoQuoterReturn {
    return quoteTwoCryptoNg(params);
  }

  return { quote };
}
