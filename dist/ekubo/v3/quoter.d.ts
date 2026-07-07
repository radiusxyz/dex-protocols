import type { EkuboV3PoolRuntime } from './types';
export type EkuboV3QuoterParams = {
    amountIn: bigint;
    zeroForOne: boolean;
    sqrtRatioLimitX128: bigint;
    runtime: EkuboV3PoolRuntime;
};
export type EkuboV3QuoterReturn = {
    amountOut: bigint;
    sqrtRatioAfterX128: number | bigint;
    tickAfter: number;
    liquidityAfter: bigint;
};
export declare function createQuoter(): {
    quote: ({ runtime, ...params }: EkuboV3QuoterParams) => EkuboV3QuoterReturn;
    quoteMidFeePips: (amountIn: bigint, sqrtRatioX128: bigint, tokenInIsToken0: boolean, feePips: number) => bigint | null;
};
//# sourceMappingURL=quoter.d.ts.map