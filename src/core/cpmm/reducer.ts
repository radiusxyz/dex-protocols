import type { UniswapV2PoolInfo, UniswapV2PoolRuntime, UniswapV2PoolState, UniswapV2PoolUpdate } from './types';

export type UniswapV2Reducer = {
  init(info: UniswapV2PoolInfo, state: UniswapV2PoolState): UniswapV2PoolRuntime;
  applyUpdates(runtime: UniswapV2PoolRuntime, update: UniswapV2PoolUpdate): boolean;
};

export function createReducer(): UniswapV2Reducer {
  function init(info: UniswapV2PoolInfo, state: UniswapV2PoolState): UniswapV2PoolRuntime {
    // If snapshot is already representative state, return it.
    // If you want to avoid shared references, clone here (not necessary for two bigints).
    return { info, state };
  }

  function applyUpdates(runtime: UniswapV2PoolRuntime, update: UniswapV2PoolUpdate): boolean {
    let changed = false;

    if (update.reserve0 !== undefined && update.reserve0 !== runtime.state.reserve0) {
      runtime.state.reserve0 = update.reserve0;
      changed = true;
    }

    if (update.reserve1 !== undefined && update.reserve1 !== runtime.state.reserve1) {
      runtime.state.reserve1 = update.reserve1;
      changed = true;
    }

    return changed;
  }

  return { init, applyUpdates };
}
