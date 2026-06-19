import { buildTickBitmap, clearInitializedInBitmap, setInitializedInBitmap } from './tick-math';

import type { UniswapV3PoolInfo, UniswapV3PoolState, UniswapV3PoolRuntime, UniswapV3PoolUpdate } from './types';

export type UniswapV3Reducer = {
  init(info: UniswapV3PoolInfo, state: UniswapV3PoolState): UniswapV3PoolRuntime;
  applyUpdates(runtime: UniswapV3PoolRuntime, update: UniswapV3PoolUpdate): boolean;
};

export function createReducer(): UniswapV3Reducer {
  function init(info: UniswapV3PoolInfo, state: UniswapV3PoolState): UniswapV3PoolRuntime {
    // clone ticks so no shared references leak in
    const ticks = new Map(state.ticks);

    const tickBitmap = buildTickBitmap({ ticks, tickSpacing: info.tickSpacing });

    return {
      info: { ...info },
      state: {
        ...state,
        ticks,
      },
      _temp: { tickBitmap },
    };
  }

  function applyUpdates(runtime: UniswapV3PoolRuntime, update: UniswapV3PoolUpdate): boolean {
    const tickSpacing = runtime.info.tickSpacing;
    let changed = false;

    // pool-level fields
    if (update.sqrtPriceX96 !== undefined && update.sqrtPriceX96 !== runtime.state.sqrtPriceX96) {
      runtime.state.sqrtPriceX96 = update.sqrtPriceX96;
      changed = true;
    }

    if (update.tick !== undefined && update.tick !== runtime.state.tick) {
      runtime.state.tick = update.tick;
      changed = true;
    }

    if (update.liquidity !== undefined && update.liquidity !== runtime.state.liquidity) {
      runtime.state.liquidity = update.liquidity;
      changed = true;
    }

    // tick additions/updates
    if (update.updatedTicks && update.updatedTicks.size > 0) {
      for (const [tick, liquidityNet] of update.updatedTicks.entries()) {
        if (tick % tickSpacing !== 0) {
          throw new Error(`Tick ${tick} not aligned to tickSpacing=${tickSpacing}`);
        }

        const had = runtime.state.ticks.has(tick);
        const prev = runtime.state.ticks.get(tick);

        if (!had) {
          runtime.state.ticks.set(tick, liquidityNet);
          setInitializedInBitmap(runtime._temp.tickBitmap, tick, tickSpacing);
          changed = true;
        } else if (prev !== liquidityNet) {
          runtime.state.ticks.set(tick, liquidityNet);
          // bitmap already has bit set
          changed = true;
        }
      }
    }

    // tick deletions
    if (update.deletedTicks && update.deletedTicks.length > 0) {
      for (const tick of update.deletedTicks) {
        if (tick % tickSpacing !== 0) {
          throw new Error(`Tick ${tick} not aligned to tickSpacing=${tickSpacing}`);
        }

        const existed = runtime.state.ticks.delete(tick);
        if (existed) {
          clearInitializedInBitmap(runtime._temp.tickBitmap, tick, tickSpacing);
          changed = true;
        }
      }
    }

    return changed;
  }

  return { init, applyUpdates };
}
