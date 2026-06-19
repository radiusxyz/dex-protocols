import type { EkuboV3PoolKind } from './types';
import type { Token } from '@src/common/types';

export type EkuboV3Domain = 'concentrated' | 'stableswap' | 'stableswap-extension';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function isEkuboV3ExtensionEnabled(extension: Token | string): boolean {
  return extension.toLowerCase() !== ZERO_ADDRESS;
}

export function resolveEkuboV3Domain(args: { poolKind: EkuboV3PoolKind; extension: Token | string }): EkuboV3Domain {
  if (args.poolKind === 'concentrated') {
    return 'concentrated';
  }

  return isEkuboV3ExtensionEnabled(args.extension) ? 'stableswap-extension' : 'stableswap';
}
