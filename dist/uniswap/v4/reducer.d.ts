import type { UniswapV4PoolInfo, UniswapV4PoolRuntime, UniswapV4PoolState, UniswapV4PoolUpdate } from './types';
export type UniswapV4Reducer = {
    init(info: UniswapV4PoolInfo, state: UniswapV4PoolState): UniswapV4PoolRuntime;
    applyUpdates(runtime: UniswapV4PoolRuntime, update: UniswapV4PoolUpdate): boolean;
};
export declare function createReducer(): UniswapV4Reducer;
//# sourceMappingURL=reducer.d.ts.map