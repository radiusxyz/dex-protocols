import { analyzeTriCryptoQuote as analyzeTriCryptoQuoteMath, quoteTriCrypto as quoteTriCryptoMath } from './swap-math';

import type { CryptoSwapPoolInfo, CryptoSwapRuntime } from '../types';
import type { Token } from '@src/common/types';

export type TriCryptoQuoterParams<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo> = {
  amountIn: bigint;
  runtime?: CryptoSwapRuntime<I>;
  useLegacyMath?: boolean;
  legacyProfile?: 'tricrypto2';
  invariant?: bigint;
  currentTimestamp?: bigint;
  futureAGammaTime?: bigint;
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
  nCoins: number;
  tokenIn?: Token;
  tokenOut?: Token;
  coins?: Token[];
  coinDecimals?: number[];
  precisions?: bigint[];
  priceScale?: bigint[];
  priceOracle?: bigint[];
  lastPrices?: bigint[];
};

export type TriCryptoQuoterReturn = {
  amountOut: bigint;
  balancesAfter: bigint[];
};

export type TriCryptoQuoteAnalysis = {
  xpBefore: bigint[];
  xpAfterIn: bigint[];
  invariant: bigint;
  y: bigint;
  dyRaw: bigint;
  dynamicFee: bigint;
  feeAmount: bigint;
  dyNet: bigint;
  amountOut: bigint;
};

export const analyzeTriCryptoQuote = analyzeTriCryptoQuoteMath;
export const quoteTriCrypto = quoteTriCryptoMath;

export function createQuoter<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo>() {
  function quote(params: TriCryptoQuoterParams<I>): TriCryptoQuoterReturn {
    return quoteTriCrypto(params);
  }

  return { quote };
}
