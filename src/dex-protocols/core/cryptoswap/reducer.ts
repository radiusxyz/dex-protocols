import { createReducer as createStableSwapReducer } from '../stableswap/reducer';

import type { CryptoSwapPoolInfo, CryptoSwapPoolState, CryptoSwapPoolUpdate, CryptoSwapRuntime } from './types';

export type CryptoSwapReducer<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo> = {
  init(info: I, state: CryptoSwapPoolState): CryptoSwapRuntime<I>;
  applyUpdates(runtime: CryptoSwapRuntime<I>, update: CryptoSwapPoolUpdate): boolean;
};

export function createReducer<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo>(): CryptoSwapReducer<I> {
  const stableSwapReducer = createStableSwapReducer<I>();

  function init(info: I, state: CryptoSwapPoolState): CryptoSwapRuntime<I> {
    const runtime = stableSwapReducer.init(info, state);

    return {
      ...runtime,
      state: {
        ...runtime.state,
        ...(state.invariant !== undefined ? { invariant: state.invariant } : {}),
        ...(state.currentTimestamp !== undefined ? { currentTimestamp: state.currentTimestamp } : {}),
        ...(state.futureAGammaTime !== undefined ? { futureAGammaTime: state.futureAGammaTime } : {}),
        ...(state.midFee !== undefined ? { midFee: state.midFee } : {}),
        ...(state.outFee !== undefined ? { outFee: state.outFee } : {}),
        ...(state.feeGamma !== undefined ? { feeGamma: state.feeGamma } : {}),
        ...(state.gamma !== undefined ? { gamma: state.gamma } : {}),
        ...(state.precisions ? { precisions: [...state.precisions] } : {}),
        ...(state.priceOracle ? { priceOracle: [...state.priceOracle] } : {}),
        ...(state.priceScale ? { priceScale: [...state.priceScale] } : {}),
        ...(state.lastPrices ? { lastPrices: [...state.lastPrices] } : {}),
        ...(state.maTime !== undefined ? { maTime: state.maTime } : {}),
      },
    };
  }

  function applyUpdates(runtime: CryptoSwapRuntime<I>, update: CryptoSwapPoolUpdate): boolean {
    let changed = stableSwapReducer.applyUpdates(runtime, update);

    if (update.midFee !== undefined && update.midFee !== runtime.state.midFee) {
      runtime.state.midFee = update.midFee;
      changed = true;
    }

    if (update.outFee !== undefined && update.outFee !== runtime.state.outFee) {
      runtime.state.outFee = update.outFee;
      changed = true;
    }

    if (update.feeGamma !== undefined && update.feeGamma !== runtime.state.feeGamma) {
      runtime.state.feeGamma = update.feeGamma;
      changed = true;
    }

    if (update.gamma !== undefined && update.gamma !== runtime.state.gamma) {
      runtime.state.gamma = update.gamma;
      changed = true;
    }

    if (update.invariant !== undefined && update.invariant !== runtime.state.invariant) {
      runtime.state.invariant = update.invariant;
      changed = true;
    }

    if (update.currentTimestamp !== undefined && update.currentTimestamp !== runtime.state.currentTimestamp) {
      runtime.state.currentTimestamp = update.currentTimestamp;
      changed = true;
    }

    if (update.futureAGammaTime !== undefined && update.futureAGammaTime !== runtime.state.futureAGammaTime) {
      runtime.state.futureAGammaTime = update.futureAGammaTime;
      changed = true;
    }

    if (update.precisions !== undefined) {
      runtime.state.precisions = [...update.precisions];
      changed = true;
    }

    if (update.priceOracle !== undefined) {
      runtime.state.priceOracle = [...update.priceOracle];
      changed = true;
    }

    if (update.priceScale !== undefined) {
      runtime.state.priceScale = [...update.priceScale];
      changed = true;
    }

    if (update.lastPrices !== undefined) {
      runtime.state.lastPrices = [...update.lastPrices];
      changed = true;
    }

    if (update.maTime !== undefined && update.maTime !== runtime.state.maTime) {
      runtime.state.maTime = update.maTime;
      changed = true;
    }

    return changed;
  }

  return { init, applyUpdates };
}
