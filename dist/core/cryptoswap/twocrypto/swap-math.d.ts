import type { TwoCryptoQuoteAnalysis, TwoCryptoQuoterParams, TwoCryptoQuoterReturn } from './quoter';
export type TwoCryptoGetYTrace = {
    limMul: bigint;
    xj: bigint;
    k0i: bigint;
    annGamma2: bigint;
    a: bigint;
    b: bigint;
    c: bigint;
    d: bigint;
    delta0: bigint;
    delta1: bigint;
    divider: bigint;
    sqrtArg: bigint;
    sqrtVal?: bigint;
    bCbrt?: bigint;
    secondCbrt?: bigint;
    c1?: bigint;
    root?: bigint;
    y?: bigint;
    frac?: bigint;
    fallbackReason?: string;
};
export declare function traceGetYTwoCryptoNg(amp: bigint, gamma: bigint, xp: bigint[], D: bigint, index: number): TwoCryptoGetYTrace;
export declare function computeTwoCryptoNgDynamicFee(xp: bigint[], midFee: bigint, outFee: bigint, feeGamma: bigint): bigint;
export declare function analyzeTwoCryptoNgQuote<I extends TwoCryptoQuoterParams = TwoCryptoQuoterParams>({ amountIn, tokenInIndex, tokenOutIndex, balances, fee, midFee, outFee, feeGamma, amplification, amplificationPrecision, gamma, invariant, currentTimestamp, futureAGammaTime, useLegacyMath, nCoins, coinDecimals, precisions, priceScale, priceOracle, lastPrices, }: I): TwoCryptoQuoteAnalysis;
export declare function quoteTwoCryptoNg<I extends TwoCryptoQuoterParams = TwoCryptoQuoterParams>(params: I): TwoCryptoQuoterReturn;
//# sourceMappingURL=swap-math.d.ts.map