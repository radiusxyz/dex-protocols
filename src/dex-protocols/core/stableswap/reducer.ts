import type { StableSwapPoolInfo, StableSwapPoolState, StableSwapPoolUpdate, StableSwapRuntime } from './types';

export type StableSwapReducer<I extends StableSwapPoolInfo = StableSwapPoolInfo> = {
  init(info: I, state: StableSwapPoolState): StableSwapRuntime<I>;
  applyUpdates(runtime: StableSwapRuntime<I>, update: StableSwapPoolUpdate): boolean;
};

export function createReducer<I extends StableSwapPoolInfo = StableSwapPoolInfo>(): StableSwapReducer<I> {
  function init(info: I, state: StableSwapPoolState): StableSwapRuntime<I> {
    const balances = [...state.balances];
    const nCoins = state.nCoins ?? (balances.length > 0 ? balances.length : info.coins.length);

    return {
      info: {
        ...info,
        coins: [...info.coins],
        ...(info.coinDecimals ? { coinDecimals: [...info.coinDecimals] } : {}),
        ...(info.assetTypes ? { assetTypes: [...info.assetTypes] } : {}),
        ...(info.oracleRates ? { oracleRates: [...info.oracleRates] } : {}),
        ...(info.isErc4626 ? { isErc4626: [...info.isErc4626] } : {}),
      },
      state: {
        ...state,
        balances,
        nCoins,
        reserve0: balances[0] ?? state.reserve0,
        reserve1: balances[1] ?? state.reserve1,
      },
    };
  }

  function applyUpdates(runtime: StableSwapRuntime<I>, update: StableSwapPoolUpdate): boolean {
    let changed = false;

    if (update.reserve0 !== undefined && update.reserve0 !== runtime.state.reserve0) {
      runtime.state.reserve0 = update.reserve0;
      changed = true;
    }

    if (update.reserve1 !== undefined && update.reserve1 !== runtime.state.reserve1) {
      runtime.state.reserve1 = update.reserve1;
      changed = true;
    }

    if (update.balances !== undefined) {
      runtime.state.balances = [...update.balances];
      runtime.state.nCoins = update.nCoins ?? update.balances.length;
      if (update.balances[0] !== undefined) {
        runtime.state.reserve0 = update.balances[0];
      }
      if (update.balances[1] !== undefined) {
        runtime.state.reserve1 = update.balances[1];
      }
      changed = true;
    }

    if (update.nCoins !== undefined && update.nCoins !== runtime.state.nCoins) {
      runtime.state.nCoins = update.nCoins;
      changed = true;
    }

    if (update.fee !== undefined && update.fee !== runtime.state.fee) {
      runtime.state.fee = update.fee;
      changed = true;
    }

    if (update.offpegFeeMultiplier !== undefined && update.offpegFeeMultiplier !== runtime.state.offpegFeeMultiplier) {
      runtime.state.offpegFeeMultiplier = update.offpegFeeMultiplier;
      changed = true;
    }

    if (update.amplification !== undefined && update.amplification !== runtime.state.amplification) {
      runtime.state.amplification = update.amplification;
      changed = true;
    }

    if (
      update.amplificationPrecision !== undefined &&
      update.amplificationPrecision !== runtime.state.amplificationPrecision
    ) {
      runtime.state.amplificationPrecision = update.amplificationPrecision;
      changed = true;
    }

    if (update.storedRates !== undefined) {
      runtime.state.storedRates = [...update.storedRates];
      changed = true;
    }

    if (update.assetTypes !== undefined) {
      runtime.state.assetTypes = [...update.assetTypes];
      changed = true;
    }

    if (update.oracleRates !== undefined) {
      runtime.state.oracleRates = [...update.oracleRates];
      changed = true;
    }

    if (update.isErc4626 !== undefined) {
      runtime.state.isErc4626 = [...update.isErc4626];
      changed = true;
    }

    if (update.virtualPrice !== undefined && update.virtualPrice !== runtime.state.virtualPrice) {
      runtime.state.virtualPrice = update.virtualPrice;
      changed = true;
    }

    return changed;
  }

  return { init, applyUpdates };
}
