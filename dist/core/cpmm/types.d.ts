import type { Addr } from '../../types/index';
export type UniswapV2PoolInfo = {
    token0: Addr;
    token1: Addr;
    feeBps: number;
};
export type UniswapV2PoolState = {
    reserve0: bigint;
    reserve1: bigint;
};
export type UniswapV2PoolUpdate = {
    reserve0: bigint;
    reserve1: bigint;
};
export type UniswapV2PoolRuntime = {
    info: UniswapV2PoolInfo;
    state: UniswapV2PoolState;
};
//# sourceMappingURL=types.d.ts.map