/**
 * amount0 delta between two prices (sqrt ratios), for liquidity L.
 * If roundUp is true, rounds up (like Uniswap).
 */
export declare function getAmount0Delta(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint, roundUp: boolean): bigint;
/**
 * amount1 delta between two prices, for liquidity L.
 */
export declare function getAmount1Delta(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint, roundUp: boolean): bigint;
/**
 * Next sqrt price after swapping in amount of token0 (exact input)
 * sqrtP' = (L * Q96 * sqrtP) / (L*Q96 + amountIn*sqrtP)
 *
 * roundUp is true in v3-core for exact input token0.
 */
export declare function getNextSqrtPriceFromAmount0In(sqrtPX96: bigint, liquidity: bigint, amountIn: bigint): bigint;
/**
 * Next sqrt price after swapping in amount of token1 (exact input)
 * sqrtP' = sqrtP + amountIn * Q96 / L
 *
 * rounded down in v3-core (integer division)
 */
export declare function getNextSqrtPriceFromAmount1In(sqrtPX96: bigint, liquidity: bigint, amountIn: bigint): bigint;
/**
 * BigInt port of Uniswap V3 SwapMath.computeSwapStep for EXACT INPUT only.
 *
 * - amountRemaining is exact input remaining (>= 0)
 * - feePips is 0..1e6
 * - Direction is inferred by zeroForOne (token0->token1 means price decreases)
 */
export declare function computeSwapStepExactIn(sqrtPCurr: bigint, sqrtPTarget: bigint, liquidity: bigint, amountRemaining: bigint, feePips: number, zeroForOne: boolean): {
    sqrtPNext: bigint;
    amountIn: bigint;
    amountOut: bigint;
    feeAmount: bigint;
};
export declare function addLiquidity(liq: bigint, liquidityNet: bigint, zeroForOne: boolean): bigint;
/**
 * Swap step math.
 * Port UniswapV3 SwapMath.computeSwapStep:
 * inputs:
 *  - sqrtPriceCurrentX96
 *  - sqrtPriceTargetX96
 *  - liquidity
 *  - amountRemaining (exact input)
 *  - feePips (e.g. 3000 for 0.3%)
 * outputs:
 *  - sqrtPriceNextX96
 *  - amountIn
 *  - amountOut
 *  - feeAmount
 */
export declare function formatFixed(valueScaled: bigint, precision: number): string;
export declare function invertDecimalString(xStr: string, precision: number): string;
export declare function getInitializedTickIndicesFromWordFast(wordPos: number, word: bigint, tickSpacing: number): number[];
//# sourceMappingURL=swap-math.d.ts.map