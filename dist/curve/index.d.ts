export declare const curveModule: {
    readonly reducer: import("./reducer").CurveReducer;
    readonly quoter: {
        quote: (params: import("./quoter").CurveQuoterParams) => import("./quoter").CurveQuoterReturn;
    };
    readonly pricer: {
        computePrices: (params: {
            reserve0: bigint;
            reserve1: bigint;
        }) => import("../core/stableswap/pricer").StableSwapPricerReturn;
    };
};
//# sourceMappingURL=index.d.ts.map