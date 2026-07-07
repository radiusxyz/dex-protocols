import type { CryptoSwapPoolInfo, CryptoSwapPoolState, CryptoSwapPoolUpdate } from '../core/cryptoswap/types';
import type { Addr } from '../types/index';
export type CurvePoolFamily = 'unknown' | 'stableswap' | 'cryptoswap';
export type CurvePoolKind = 'unknown' | 'llamma' | 'stableswap' | 'stableswap-ng' | 'cryptoswap' | 'tricrypto' | 'tricrypto-ng' | 'twocrypto' | 'twocrypto-ng';
export type CurvePoolInfo = CryptoSwapPoolInfo & {
    poolFamily: CurvePoolFamily;
    poolKind: CurvePoolKind;
    staticAttributes?: Record<string, unknown>;
};
export type CurvePoolState = CryptoSwapPoolState & {
    coins?: Addr[];
};
export type CurvePoolUpdate = CryptoSwapPoolUpdate;
export type CurvePoolRuntime = {
    info: CurvePoolInfo;
    state: CurvePoolState;
};
//# sourceMappingURL=types.d.ts.map