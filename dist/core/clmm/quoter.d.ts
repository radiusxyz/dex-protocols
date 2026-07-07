import type { Tick, UniswapV3PoolRuntime } from './types';
export type UniswapV3QuoterParams = {
    amountIn: bigint;
    zeroForOne: boolean;
    sqrtPriceLimitX96: bigint;
    runtime: UniswapV3PoolRuntime;
};
export type UniswapV3QuoterReturn = {
    amountOut: bigint;
    sqrtPriceAfterX96: bigint;
    tickAfter: Tick;
    liquidityAfter: bigint;
};
export declare function normalizeAndValidateLimit(args: {
    sqrtPriceLimitX96: bigint;
    sqrtPriceCurrentX96: bigint;
    zeroForOne: boolean;
}): {
    sqrtPriceLimitX96: bigint;
    hasExplicitLimit: boolean;
};
export declare function createQuoter(): {
    quote: ({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime }: UniswapV3QuoterParams) => UniswapV3QuoterReturn;
    quoteMidFeePips: (amountIn: bigint, sqrtPriceX96: bigint, tokenInIsToken0: boolean, feePips: number) => bigint | null;
};
//# sourceMappingURL=quoter.d.ts.map