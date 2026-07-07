export type EkuboCommonRuntime = {
    info: {
        feePips: number;
        tickSpacing: number;
    };
    state: {
        sqrtRatioX128: bigint;
        tick: number;
        liquidity: bigint;
        ticks: Map<number, bigint>;
    };
    _temp: {
        tickBitmap: Map<number, bigint>;
    };
};
export type EkuboCommonQuoterParams<TRuntime extends EkuboCommonRuntime> = {
    amountIn: bigint;
    zeroForOne: boolean;
    sqrtRatioLimitX128: bigint;
    runtime: TRuntime;
};
export type EkuboCommonQuoterReturn = {
    amountOut: bigint;
    sqrtRatioAfterX128: bigint;
    tickAfter: number;
    liquidityAfter: bigint;
};
export declare function normalizeAndValidateLimit(args: {
    sqrtRatioLimitX128: bigint;
    sqrtRatioCurrentX128: bigint;
    zeroForOne: boolean;
}): bigint;
export declare function quoteExactIn<TRuntime extends EkuboCommonRuntime>({ amountIn, zeroForOne, sqrtRatioLimitX128, runtime, }: EkuboCommonQuoterParams<TRuntime>): EkuboCommonQuoterReturn;
export declare function quoteMidFeePips(amountIn: bigint, sqrtRatioX128: bigint, tokenInIsToken0: boolean, feePips: number): bigint | null;
//# sourceMappingURL=quoter.d.ts.map