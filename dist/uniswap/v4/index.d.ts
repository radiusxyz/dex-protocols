export declare const uniswapV4Module: {
    readonly reducer: import("./reducer").UniswapV4Reducer;
    readonly quoter: {
        quote: ({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime }: import("./quoter").UniswapV4QuoterParams) => import("./quoter").UniswapV4QuoterReturn;
    };
    readonly pricer: {
        computeSpotPrices: ({ runtime }: import("./pricer").UniswapV4PricerParams) => import("../../core/clmm/pricer").UniswapV3PricerReturn;
    };
};
export * from './pricer';
export * from './quoter';
export * from './reducer';
export * from './types';
//# sourceMappingURL=index.d.ts.map