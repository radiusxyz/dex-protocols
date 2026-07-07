import type { CurvePoolFamily, CurvePoolKind, CurvePoolRuntime, CurvePoolState, CurvePoolUpdate } from './types';
export type CurveDomain = 'stableswap' | 'cryptoswap-legacy-2' | 'cryptoswap-2' | 'cryptoswap-legacy-tricrypto2' | 'cryptoswap-3' | 'ignore';
export declare function resolveCurveDomain(runtimeOrArgs: CurvePoolRuntime | {
    poolKind?: CurvePoolKind;
    poolFamily?: CurvePoolFamily;
    state?: CurvePoolState | CurvePoolUpdate;
    staticAttributes?: Record<string, unknown>;
}): CurveDomain;
//# sourceMappingURL=domain.d.ts.map