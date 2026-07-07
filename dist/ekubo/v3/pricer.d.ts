export type EkuboV3PricerParams = {
    sqrtRatioX128: bigint;
};
type PriceRatio = {
    num: bigint;
    den: bigint;
};
export type EkuboV3PricerReturn = {
    price0Per1: PriceRatio;
    price1Per0: PriceRatio;
};
export declare function createPricer(): {
    computeSpotPrices: ({ sqrtRatioX128 }: EkuboV3PricerParams) => EkuboV3PricerReturn;
};
export {};
//# sourceMappingURL=pricer.d.ts.map