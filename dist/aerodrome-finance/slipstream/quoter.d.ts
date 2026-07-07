import type { AerodromeSlipstreamPoolRuntime, Tick } from './types';
export type AerodromeSlipstreamQuoterParams = {
    amountIn: bigint;
    zeroForOne: boolean;
    sqrtPriceLimitX96: bigint;
    runtime: AerodromeSlipstreamPoolRuntime;
    blockTimestamp: number;
    secondsAgo?: number;
    defaultBaseFee?: number;
};
export type AerodromeSlipstreamQuoterReturn = {
    amountOut: bigint;
    sqrtPriceAfterX96: bigint;
    tickAfter: Tick;
    liquidityAfter: bigint;
};
export declare function createQuoter(): {
    quote: ({ amountIn, zeroForOne, sqrtPriceLimitX96, runtime, blockTimestamp, secondsAgo, defaultBaseFee, }: AerodromeSlipstreamQuoterParams) => AerodromeSlipstreamQuoterReturn;
    quoteMidFeePips: (amountIn: bigint, sqrtPriceX96: bigint, tokenInIsToken0: boolean, feePips: number) => bigint | null;
};
//# sourceMappingURL=quoter.d.ts.map