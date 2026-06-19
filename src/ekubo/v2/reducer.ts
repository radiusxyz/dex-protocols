import { buildTickBitmap, clearInitializedInBitmap, setInitializedInBitmap } from '../common/tick-math';

import type { EkuboV2PoolInfo, EkuboV2PoolState, EkuboV2PoolUpdate, EkuboV2PoolRuntime } from './types';

export function createReducer() {
  function init(info: EkuboV2PoolInfo, state: EkuboV2PoolState): EkuboV2PoolRuntime {
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

  function applyUpdates(runtime: EkuboV2PoolRuntime, update: EkuboV2PoolUpdate): boolean {
    const tickSpacing = runtime.info.tickSpacing;
    let changed = false;

    if (update.sqrtRatioX128 !== undefined && update.sqrtRatioX128 !== runtime.state.sqrtRatioX128) {
      runtime.state.sqrtRatioX128 = update.sqrtRatioX128;
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
        changed = true;
      }
    }

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

    return changed;
  }

  return { init, applyUpdates };
}
