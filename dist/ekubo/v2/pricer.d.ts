export type EkuboV2PricerParams = {
    sqrtRatioX128: bigint;
};
type PriceRatio = {
    num: bigint;
    den: bigint;
};
export type EkuboV2PricerReturn = {
    price0Per1: PriceRatio;
    price1Per0: PriceRatio;
};
export declare function createPricer(): {
    computeSpotPrices: ({ sqrtRatioX128 }: EkuboV2PricerParams) => EkuboV2PricerReturn;
};
export {};
//# sourceMappingURL=pricer.d.ts.map