export { isEkuboV3ExtensionEnabled, resolveEkuboV3Domain } from './domain';
export declare const ekuboV3Module: {
    readonly reducer: {
        init: (info: import("./types").EkuboV3PoolInfo, state: import("./types").EkuboV3PoolState) => import("./types").EkuboV3PoolRuntime;
        applyUpdates: (runtime: import("./types").EkuboV3PoolRuntime, update: import("./types").EkuboV3PoolUpdate) => boolean;
    };
    readonly quoter: {
        quote: ({ runtime, ...params }: import("./quoter").EkuboV3QuoterParams) => import("./quoter").EkuboV3QuoterReturn;
        quoteMidFeePips: (amountIn: bigint, sqrtRatioX128: bigint, tokenInIsToken0: boolean, feePips: number) => bigint | null;
    };
    readonly pricer: {
        computeSpotPrices: ({ sqrtRatioX128 }: import("./pricer").EkuboV3PricerParams) => import("./pricer").EkuboV3PricerReturn;
    };
};
//# sourceMappingURL=index.d.ts.map