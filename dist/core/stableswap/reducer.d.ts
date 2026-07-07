import type { StableSwapPoolInfo, StableSwapPoolState, StableSwapPoolUpdate, StableSwapRuntime } from './types';
export type StableSwapReducer<I extends StableSwapPoolInfo = StableSwapPoolInfo> = {
    init(info: I, state: StableSwapPoolState): StableSwapRuntime<I>;
    applyUpdates(runtime: StableSwapRuntime<I>, update: StableSwapPoolUpdate): boolean;
};
export declare function createReducer<I extends StableSwapPoolInfo = StableSwapPoolInfo>(): StableSwapReducer<I>;
//# sourceMappingURL=reducer.d.ts.map