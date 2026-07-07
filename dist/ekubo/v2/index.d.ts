export declare const ekuboV2Module: {
    readonly reducer: {
        init: (info: import("./types").EkuboV2PoolInfo, state: import("./types").EkuboV2PoolState) => import("./types").EkuboV2PoolRuntime;
        applyUpdates: (runtime: import("./types").EkuboV2PoolRuntime, update: import("./types").EkuboV2PoolUpdate) => boolean;
    };
    readonly quoter: {
        quote: ({ amountIn, zeroForOne, sqrtRatioLimitX128, runtime }: import("./quoter").EkuboV2QuoterParams) => import("./quoter").EkuboV2QuoterReturn;
        quoteMidFeePips: (amountIn: bigint, sqrtRatioX128: bigint, tokenInIsToken0: boolean, feePips: number) => bigint | null;
    };
    readonly pricer: {
        computeSpotPrices: ({ sqrtRatioX128 }: import("./pricer").EkuboV2PricerParams) => import("./pricer").EkuboV2PricerReturn;
    };
};
//# sourceMappingURL=index.d.ts.map