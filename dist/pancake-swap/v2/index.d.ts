export declare const pancakeSwapV2Module: {
    readonly reducer: import("../../core/cpmm/reducer").UniswapV2Reducer;
    readonly quoter: {
        quote: ({ amountIn, zeroForOne, runtime }: import("../../core/cpmm/quoter").UniswapV2QuoterParams) => import("../../core/cpmm/quoter").UniswapV2QuoterReturn;
    };
    readonly pricer: {
        computePrices: ({ reserve0, reserve1 }: import("../../core/cpmm/pricer").UniswapV2PricerParams) => import("../../core/cpmm/pricer").UniswapV2PricerReturn;
    };
};
//# sourceMappingURL=index.d.ts.map