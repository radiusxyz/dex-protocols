export type PriceRatio = {
    num: bigint;
    den: bigint;
};
export type UniswapV2PricerParams = {
    reserve0: bigint;
    reserve1: bigint;
};
export type UniswapV2PricerReturn = {
    price0Per1: PriceRatio;
    price1Per0: PriceRatio;
};
export declare function createPricer(): {
    computePrices: ({ reserve0, reserve1 }: UniswapV2PricerParams) => UniswapV2PricerReturn;
};
//# sourceMappingURL=pricer.d.ts.map