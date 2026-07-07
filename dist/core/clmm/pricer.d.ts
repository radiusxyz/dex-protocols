export type UniswapV3PricerParams = {
    sqrtPriceX96: bigint;
};
type PriceRatio = {
    num: bigint;
    den: bigint;
};
export type UniswapV3PricerReturn = {
    price0Per1: PriceRatio;
    price1Per0: PriceRatio;
};
export declare function reduceRatio(r: PriceRatio): PriceRatio;
export declare function createPricer(): {
    computeSpotPrices: ({ sqrtPriceX96 }: UniswapV3PricerParams) => UniswapV3PricerReturn;
};
export {};
//# sourceMappingURL=pricer.d.ts.map