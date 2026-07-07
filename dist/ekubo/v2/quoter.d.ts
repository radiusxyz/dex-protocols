import type { EkuboV2PoolRuntime, Tick } from './types';
export type EkuboV2QuoterParams = {
    amountIn: bigint;
    zeroForOne: boolean;
    sqrtRatioLimitX128: bigint;
    runtime: EkuboV2PoolRuntime;
};
export type EkuboV2QuoterReturn = {
    amountOut: bigint;
    sqrtRatioAfterX128: bigint;
    tickAfter: Tick;
    liquidityAfter: bigint;
};
export declare function createQuoter(): {
    quote: ({ amountIn, zeroForOne, sqrtRatioLimitX128, runtime }: EkuboV2QuoterParams) => EkuboV2QuoterReturn;
    quoteMidFeePips: (amountIn: bigint, sqrtRatioX128: bigint, tokenInIsToken0: boolean, feePips: number) => bigint | null;
};
//# sourceMappingURL=quoter.d.ts.map