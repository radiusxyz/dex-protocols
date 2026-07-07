import type { Tick } from '../../core/clmm/types';
import type { UniswapV4PoolRuntime } from './types';
export type UniswapV4QuoterParams = {
    amountIn: bigint;
    zeroForOne: boolean;
    sqrtPriceLimitX96: bigint;
    runtime: UniswapV4PoolRuntime;
};
export type UniswapV4QuoterReturn = {
    amountOut: bigint;
    amountInConsumed: bigint;
    feeAmount: bigint;
    sqrtPriceAfterX96: bigint;
    tickAfter: Tick;
    liquidityAfter: bigint;
    swapFeePips: bigint;
    /**
     * Signed trader-side deltas:
     * - negative: token paid by trader
     * - positive: token received by trader
     */
    amount0Delta: bigint;
    amount1Delta: bigint;
};
export declare function createQuoter(): {
    quote: ({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime }: UniswapV4QuoterParams) => UniswapV4QuoterReturn;
};
//# sourceMappingURL=quoter.d.ts.map