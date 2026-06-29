import {
  buildTickBitmap,
  clearInitializedInBitmap,
  setInitializedInBitmap,
} from '../../core/clmm/tick-math';
import type { Tick } from '../../core/clmm/types';

import type { UniswapV4PoolInfo, UniswapV4PoolRuntime, UniswapV4PoolState, UniswapV4PoolUpdate } from './types';

export type UniswapV4Reducer = {
  init(info: UniswapV4PoolInfo, state: UniswapV4PoolState): UniswapV4PoolRuntime;
  applyUpdates(runtime: UniswapV4PoolRuntime, update: UniswapV4PoolUpdate): boolean;
};

function toBitmapTicks(ticks: Map<Tick, { liquidityGross: bigint; liquidityNet: bigint }>): Map<Tick, bigint> {
  const bitmapTicks = new Map<Tick, bigint>();
  for (const [tick, info] of ticks) {
    if (info.liquidityGross > 0n) {
      bitmapTicks.set(tick, info.liquidityNet);
    }
  }
  return bitmapTicks;
}

export function createReducer(): UniswapV4Reducer {
  function init(info: UniswapV4PoolInfo, state: UniswapV4PoolState): UniswapV4PoolRuntime {
    const ticks = new Map(state.ticks);
    const tickBitmap = buildTickBitmap({
      ticks: toBitmapTicks(ticks),
      tickSpacing: info.tickSpacing,
    });
    const lpFeeFromInfo = info.feePips !== undefined ? BigInt(info.feePips) : undefined;
    const lpFee = state.slot0.lpFee !== 0n ? state.slot0.lpFee : (lpFeeFromInfo ?? state.slot0.lpFee);

    return {
      info: { ...info },
      state: {
        ...state,
        slot0: {
          ...state.slot0,
          lpFee,
        },
        ticks,
      },
      _temp: { tickBitmap },
    };
  }

  function applyUpdates(runtime: UniswapV4PoolRuntime, update: UniswapV4PoolUpdate): boolean {
    const tickSpacing = runtime.info.tickSpacing;
    let changed = false;

    if (update.slot0?.sqrtPriceX96 !== undefined && update.slot0.sqrtPriceX96 !== runtime.state.slot0.sqrtPriceX96) {
      runtime.state.slot0.sqrtPriceX96 = update.slot0.sqrtPriceX96;
      changed = true;
    }
    if (update.slot0?.tick !== undefined && update.slot0.tick !== runtime.state.slot0.tick) {
      runtime.state.slot0.tick = update.slot0.tick;
      changed = true;
    }
    if (update.slot0?.protocolFee !== undefined && update.slot0.protocolFee !== runtime.state.slot0.protocolFee) {
      runtime.state.slot0.protocolFee = update.slot0.protocolFee;
      changed = true;
    }
    if (update.slot0?.lpFee !== undefined && update.slot0.lpFee !== runtime.state.slot0.lpFee) {
      runtime.state.slot0.lpFee = update.slot0.lpFee;
      changed = true;
    }
    if (update.liquidity !== undefined && update.liquidity !== runtime.state.liquidity) {
      runtime.state.liquidity = update.liquidity;
      changed = true;
    }

    if (update.updatedTicks.size > 0) {
      for (const [tick, tickInfo] of update.updatedTicks.entries()) {
        if (tick % tickSpacing !== 0) {
          throw new Error(`Tick ${tick} not aligned to tickSpacing=${tickSpacing}`);
        }

        const had = runtime.state.ticks.has(tick);
        const prev = runtime.state.ticks.get(tick);
        const nextTickInfo = {
          liquidityGross: tickInfo.liquidityGross ?? prev?.liquidityGross ?? 0n,
          liquidityNet: tickInfo.liquidityNet ?? prev?.liquidityNet ?? 0n,
        };
        runtime.state.ticks.set(tick, nextTickInfo);

        if (!had && nextTickInfo.liquidityGross > 0n) {
          setInitializedInBitmap(runtime._temp.tickBitmap, tick, tickSpacing);
          changed = true;
        } else if (
          prev?.liquidityGross !== nextTickInfo.liquidityGross ||
          prev?.liquidityNet !== nextTickInfo.liquidityNet
        ) {
          if ((prev?.liquidityGross ?? 0n) === 0n && nextTickInfo.liquidityGross > 0n) {
            setInitializedInBitmap(runtime._temp.tickBitmap, tick, tickSpacing);
          }
          if ((prev?.liquidityGross ?? 0n) > 0n && nextTickInfo.liquidityGross === 0n) {
            clearInitializedInBitmap(runtime._temp.tickBitmap, tick, tickSpacing);
          }
          changed = true;
        }
      }
    }

    if (update.deletedTicks.length > 0) {
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
