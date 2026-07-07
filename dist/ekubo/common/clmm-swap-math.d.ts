export declare function getAmount0Delta(sqrtRatioAX128: bigint, sqrtRatioBX128: bigint, liquidity: bigint, roundUp: boolean): bigint;
export declare function getAmount1Delta(sqrtRatioAX128: bigint, sqrtRatioBX128: bigint, liquidity: bigint, roundUp: boolean): bigint;
export declare function getNextSqrtPriceFromAmount0In(sqrtRatioX128: bigint, liquidity: bigint, amountIn: bigint): bigint;
export declare function getNextSqrtPriceFromAmount1In(sqrtRatioX128: bigint, liquidity: bigint, amountIn: bigint): bigint;
export declare function computeSwapStepExactIn(sqrtPCurr: bigint, sqrtPTarget: bigint, liquidity: bigint, amountRemaining: bigint, feePips: number, zeroForOne: boolean): {
    sqrtPNext: bigint;
    amountIn: bigint;
    amountOut: bigint;
    feeAmount: bigint;
};
export declare function addLiquidity(liq: bigint, liquidityNet: bigint, zeroForOne: boolean): bigint;
//# sourceMappingURL=clmm-swap-math.d.ts.map