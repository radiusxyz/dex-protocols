export declare class SwapMath {
    static MAX_SWAP_FEE: bigint;
    static getSqrtPriceTarget(zeroForOne: boolean, sqrtPriceNextX96: bigint, sqrtPriceLimitX96: bigint): bigint;
    static computeSwapStep(sqrtPriceCurrentX96: bigint, sqrtPriceTargetX96: bigint, liquidity: bigint, amountRemaining: bigint, feePips: bigint): {
        sqrtPriceNextX96: bigint;
        amountIn: bigint;
        amountOut: bigint;
        feeAmount: bigint;
    };
}
//# sourceMappingURL=SwapMath.d.ts.map