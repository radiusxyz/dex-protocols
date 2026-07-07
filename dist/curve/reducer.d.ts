import type { CurvePoolInfo, CurvePoolRuntime, CurvePoolState, CurvePoolUpdate } from './types';
export type CurveReducer = {
    init(info: CurvePoolInfo, state: CurvePoolState): CurvePoolRuntime;
    applyUpdates(runtime: CurvePoolRuntime, update: CurvePoolUpdate): boolean;
};
export declare function createReducer(): CurveReducer;
//# sourceMappingURL=reducer.d.ts.map