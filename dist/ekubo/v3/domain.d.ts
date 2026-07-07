import type { Addr } from '../../types/index';
import type { EkuboV3PoolKind } from './types';
export type EkuboV3Domain = 'concentrated' | 'stableswap' | 'stableswap-extension';
export declare function isEkuboV3ExtensionEnabled(extension: Addr | string): boolean;
export declare function resolveEkuboV3Domain(args: {
    poolKind: EkuboV3PoolKind;
    extension: Addr | string;
}): EkuboV3Domain;
//# sourceMappingURL=domain.d.ts.map