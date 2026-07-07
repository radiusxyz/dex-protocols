import type { CurvePoolRuntime } from './types';
export type CurveQuoterParams = {
    amountIn: bigint;
    zeroForOne: boolean;
    runtime: CurvePoolRuntime;
};
export type CurveQuoterReturn = {
    amountOut: bigint;
    balancesAfter: bigint[];
    reserve0?: bigint;
    reserve1?: bigint;
};
export declare function createQuoter(): {
    quote: (params: CurveQuoterParams) => CurveQuoterReturn;
};
//# sourceMappingURL=quoter.d.ts.map