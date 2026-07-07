import type { UniswapV2PoolInfo, UniswapV2PoolRuntime, UniswapV2PoolState, UniswapV2PoolUpdate } from './types';
export type UniswapV2Reducer = {
    init(info: UniswapV2PoolInfo, state: UniswapV2PoolState): UniswapV2PoolRuntime;
    applyUpdates(runtime: UniswapV2PoolRuntime, update: UniswapV2PoolUpdate): boolean;
};
export declare function createReducer(): UniswapV2Reducer;
//# sourceMappingURL=reducer.d.ts.map