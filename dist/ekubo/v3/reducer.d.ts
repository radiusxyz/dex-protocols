import type { EkuboV3PoolInfo, EkuboV3PoolRuntime, EkuboV3PoolState, EkuboV3PoolUpdate } from './types';
export declare function createReducer(): {
    init: (info: EkuboV3PoolInfo, state: EkuboV3PoolState) => EkuboV3PoolRuntime;
    applyUpdates: (runtime: EkuboV3PoolRuntime, update: EkuboV3PoolUpdate) => boolean;
};
//# sourceMappingURL=reducer.d.ts.map