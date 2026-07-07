export declare const aerodromeSlipstreamModule: {
    readonly reducer: import("./reducer").AerodromeSlipstreamReducer;
    readonly quoter: {
        quote: ({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime, blockTimestamp, secondsAgo, defaultBaseFee, }: import("./quoter").AerodromeSlipstreamQuoterParams) => import("./quoter").AerodromeSlipstreamQuoterReturn;
        quoteMidFeePips: (amountIn: bigint, sqrtPriceX96: bigint, tokenInIsToken0: boolean, feePips: number) => bigint | null;
    };
    readonly pricer: {
        computeSpotPrices: ({ sqrtPriceX96 }: import("../../core/clmm/pricer").UniswapV3PricerParams) => import("../../core/clmm/pricer").UniswapV3PricerReturn;
    };
};
//# sourceMappingURL=index.d.ts.map