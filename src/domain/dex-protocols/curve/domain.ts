import type { CurvePoolFamily, CurvePoolKind, CurvePoolRuntime, CurvePoolState, CurvePoolUpdate } from './types';

export type CurveDomain =
  | 'stableswap'
  | 'cryptoswap-legacy-2'
  | 'cryptoswap-2'
  | 'cryptoswap-legacy-tricrypto2'
  | 'cryptoswap-3'
  | 'ignore';

const IGNORE_POOL_KINDS = new Set<CurvePoolKind>(['llamma']);
const LEGACY_CRYPTOSWAP_2_POOL_KINDS = new Set<CurvePoolKind>(['cryptoswap']);
const CRYPTOSWAP_2_POOL_KINDS = new Set<CurvePoolKind>(['twocrypto', 'twocrypto-ng']);
const LEGACY_CRYPTOSWAP_3_POOL_KINDS = new Set<CurvePoolKind>(['tricrypto']);
const CRYPTOSWAP_3_POOL_KINDS = new Set<CurvePoolKind>(['tricrypto-ng']);

const STABLESWAP_POOL_KINDS = new Set<CurvePoolKind>(['stableswap', 'stableswap-ng']);

function usesCryptoSwapShape(state?: CurvePoolState | CurvePoolUpdate): boolean {
  if (!state) {
    return false;
  }

  return (
    state.priceOracle !== undefined ||
    state.priceScale !== undefined ||
    state.lastPrices !== undefined ||
    state.maTime !== undefined
  );
}

function isLegacyTriCryptoPool(
  runtimeOrArgs:
    | CurvePoolRuntime
    | {
        poolKind?: CurvePoolKind;
        poolFamily?: CurvePoolFamily;
        state?: CurvePoolState | CurvePoolUpdate;
        staticAttributes?: Record<string, unknown>;
      },
): boolean {
  const staticAttributes =
    'info' in runtimeOrArgs ? runtimeOrArgs.info.staticAttributes : runtimeOrArgs.staticAttributes;
  const factoryName = staticAttributes?.factory_name;
  const name = staticAttributes?.name;
  return factoryName === 'NA' || name === 'tricrypto2';
}

export function resolveCurveDomain(
  runtimeOrArgs:
    | CurvePoolRuntime
    | {
        poolKind?: CurvePoolKind;
        poolFamily?: CurvePoolFamily;
        state?: CurvePoolState | CurvePoolUpdate;
        staticAttributes?: Record<string, unknown>;
      },
): CurveDomain {
  const { poolKind, poolFamily, state } =
    'info' in runtimeOrArgs
      ? {
          poolKind: runtimeOrArgs.info.poolKind,
          poolFamily: runtimeOrArgs.info.poolFamily,
          state: runtimeOrArgs.state,
        }
      : runtimeOrArgs;

  if (poolKind && IGNORE_POOL_KINDS.has(poolKind)) {
    return 'ignore';
  }
  if (poolKind && LEGACY_CRYPTOSWAP_3_POOL_KINDS.has(poolKind)) {
    return isLegacyTriCryptoPool(runtimeOrArgs) ? 'cryptoswap-legacy-tricrypto2' : 'cryptoswap-3';
  }
  if (poolKind && CRYPTOSWAP_3_POOL_KINDS.has(poolKind)) {
    return 'cryptoswap-3';
  }
  if (poolKind && LEGACY_CRYPTOSWAP_2_POOL_KINDS.has(poolKind)) {
    return 'cryptoswap-legacy-2';
  }
  if (poolKind && CRYPTOSWAP_2_POOL_KINDS.has(poolKind)) {
    return 'cryptoswap-2';
  }
  if (poolKind && STABLESWAP_POOL_KINDS.has(poolKind)) {
    return 'stableswap';
  }

  if (poolFamily === 'cryptoswap') {
    return usesCryptoSwapShape(state) && state?.priceScale?.length && state.priceScale.length > 1
      ? isLegacyTriCryptoPool(runtimeOrArgs)
        ? 'cryptoswap-legacy-tricrypto2'
        : 'cryptoswap-3'
      : 'cryptoswap-legacy-2';
  }
  if (poolFamily === 'stableswap') {
    return 'stableswap';
  }

  return usesCryptoSwapShape(state) ? 'cryptoswap-2' : 'stableswap';
}
