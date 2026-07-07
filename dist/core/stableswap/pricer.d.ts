export type PriceRatio = {
    num: bigint;
    den: bigint;
};
export type StableSwapPricerParams = {
    reserve0: bigint;
    reserve1: bigint;
};
export type StableSwapPricerReturn = {
    price0Per1: PriceRatio;
    price1Per0: PriceRatio;
};
export declare function createPricer(): {
    computePrices: ({ reserve0, reserve1 }: StableSwapPricerParams) => StableSwapPricerReturn;
};
//# sourceMappingURL=pricer.d.ts.map