import type { EkuboV2PoolInfo, EkuboV2PoolRuntime, EkuboV2PoolState, EkuboV2PoolUpdate } from './types';
export declare function createReducer(): {
    init: (info: EkuboV2PoolInfo, state: EkuboV2PoolState) => EkuboV2PoolRuntime;
    applyUpdates: (runtime: EkuboV2PoolRuntime, update: EkuboV2PoolUpdate) => boolean;
};
//# sourceMappingURL=reducer.d.ts.map