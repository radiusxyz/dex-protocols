export declare const uniswapV3Module: {
    readonly reducer: import("../../core/clmm/reducer").UniswapV3Reducer;
    readonly quoter: {
        quote: ({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime }: import("../../core/clmm/quoter").UniswapV3QuoterParams) => import("../../core/clmm/quoter").UniswapV3QuoterReturn;
        quoteMidFeePips: (amountIn: bigint, sqrtPriceX96: bigint, tokenInIsToken0: boolean, feePips: number) => bigint | null;
    };
    readonly pricer: {
        computeSpotPrices: ({ sqrtPriceX96 }: import("../../core/clmm/pricer").UniswapV3PricerParams) => import("../../core/clmm/pricer").UniswapV3PricerReturn;
    };
};
//# sourceMappingURL=index.d.ts.map