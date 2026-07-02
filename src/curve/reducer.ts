import { createReducer as createCryptoSwapReducer } from '../core/cryptoswap/reducer';
import { createReducer as createStableSwapReducer } from '../core/stableswap/reducer';
import { resolveCurveDomain } from './domain';

import type { CurvePoolInfo, CurvePoolRuntime, CurvePoolState, CurvePoolUpdate } from './types';

export type CurveReducer = {
  init(info: CurvePoolInfo, state: CurvePoolState): CurvePoolRuntime;
  applyUpdates(runtime: CurvePoolRuntime, update: CurvePoolUpdate): boolean;
};

export function createReducer(): CurveReducer {
  const stableSwapReducer = createStableSwapReducer<CurvePoolInfo>();
  const cryptoSwapReducer = createCryptoSwapReducer<CurvePoolInfo>();

  function init(info: CurvePoolInfo, state: CurvePoolState): CurvePoolRuntime {
    const domain = resolveCurveDomain({
      poolKind: info.poolKind,
      poolFamily: info.poolFamily,
      state,
      ...(info.staticAttributes ? { staticAttributes: info.staticAttributes } : {}),
    });

    if (domain === 'ignore') {
      throw new Error('Curve LLAMMA pools are excluded from runtime initialization');
    }

    return domain === 'cryptoswap-legacy-2' ||
      domain === 'cryptoswap-2' ||
      domain === 'cryptoswap-legacy-tricrypto2' ||
      domain === 'cryptoswap-3'
      ? cryptoSwapReducer.init(info, state)
      : stableSwapReducer.init(info, state);
  }

  function applyUpdates(runtime: CurvePoolRuntime, update: CurvePoolUpdate): boolean {
    const updateSuggestsCryptoSwap =
      update.priceOracle !== undefined ||
      update.priceScale !== undefined ||
      update.lastPrices !== undefined ||
      update.maTime !== undefined;

    const domain = resolveCurveDomain({
      poolKind: runtime.info.poolKind,
      poolFamily: runtime.info.poolFamily,
      state: updateSuggestsCryptoSwap ? update : runtime.state,
      ...(runtime.info.staticAttributes ? { staticAttributes: runtime.info.staticAttributes } : {}),
    });

    if (domain === 'ignore') {
      throw new Error('Curve LLAMMA pools are excluded from runtime updates');
    }

    return domain === 'cryptoswap-legacy-2' ||
      domain === 'cryptoswap-2' ||
      domain === 'cryptoswap-legacy-tricrypto2' ||
      domain === 'cryptoswap-3'
      ? cryptoSwapReducer.applyUpdates(runtime, update)
      : stableSwapReducer.applyUpdates(runtime, update);
  }

  return { init, applyUpdates };
}
