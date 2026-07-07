import type { AerodromeSlipstreamPoolInfo, AerodromeSlipstreamPoolRuntime, AerodromeSlipstreamPoolState, AerodromeSlipstreamPoolUpdate } from './types';
export type AerodromeSlipstreamReducer = {
    init(info: AerodromeSlipstreamPoolInfo, state: AerodromeSlipstreamPoolState): AerodromeSlipstreamPoolRuntime;
    applyUpdates(runtime: AerodromeSlipstreamPoolRuntime, update: AerodromeSlipstreamPoolUpdate): boolean;
};
export declare function createReducer(): AerodromeSlipstreamReducer;
//# sourceMappingURL=reducer.d.ts.map