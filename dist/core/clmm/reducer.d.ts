import type { UniswapV3PoolInfo, UniswapV3PoolRuntime, UniswapV3PoolState, UniswapV3PoolUpdate } from './types';
export type UniswapV3Reducer = {
    init(info: UniswapV3PoolInfo, state: UniswapV3PoolState): UniswapV3PoolRuntime;
    applyUpdates(runtime: UniswapV3PoolRuntime, update: UniswapV3PoolUpdate): boolean;
};
export declare function createReducer(): UniswapV3Reducer;
//# sourceMappingURL=reducer.d.ts.map