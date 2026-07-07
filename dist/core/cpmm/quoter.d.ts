import type { UniswapV2PoolRuntime } from './types';
export type UniswapV2QuoterParams = {
    amountIn: bigint;
    zeroForOne: boolean;
    runtime: UniswapV2PoolRuntime;
};
export type UniswapV2QuoterReturn = {
    amountOut: bigint;
    reserve0: bigint;
    reserve1: bigint;
};
export declare function createQuoter(): {
    quote: ({ amountIn, zeroForOne, runtime }: UniswapV2QuoterParams) => UniswapV2QuoterReturn;
};
//# sourceMappingURL=quoter.d.ts.map