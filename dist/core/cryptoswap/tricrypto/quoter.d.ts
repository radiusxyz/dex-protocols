import type { Addr } from '../../../types/index';
import type { CryptoSwapPoolInfo, CryptoSwapRuntime } from '../types';
import { analyzeTriCryptoQuote as analyzeTriCryptoQuoteMath, quoteTriCrypto as quoteTriCryptoMath } from './swap-math';
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
    tokenIn?: Addr;
    tokenOut?: Addr;
    coins?: Addr[];
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
export declare const analyzeTriCryptoQuote: typeof analyzeTriCryptoQuoteMath;
export declare const quoteTriCrypto: typeof quoteTriCryptoMath;
export declare function createQuoter<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo>(): {
    quote: (params: TriCryptoQuoterParams<I>) => TriCryptoQuoterReturn;
};
//# sourceMappingURL=quoter.d.ts.map