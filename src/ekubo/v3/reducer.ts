import { AMPLIFICATION_PRECISION, CURVE_FEE_DENOMINATOR } from '../../core/stableswap/constants';
import { createReducer as createStableSwapReducer } from '../../core/stableswap/reducer';

import { resolveEkuboV3Domain } from './domain';
import { buildTickBitmap, clearInitializedInBitmap, setInitializedInBitmap } from '../common/tick-math';

import type {
  EkuboV3PoolInfo,
  EkuboV3PoolState,
  EkuboV3PoolUpdate,
  EkuboV3PoolRuntime,
  EkuboV3StablePoolInfo,
  EkuboV3StablePoolRuntime,
} from './types';

type EkuboV3StableRuntimeInternal = EkuboV3PoolRuntime & {
  info: EkuboV3StablePoolInfo;
  state: EkuboV3PoolState & {
    balances: bigint[];
    reserve0: bigint;
    reserve1: bigint;
    nCoins: number;
    fee?: bigint;
    amplification?: bigint;
    amplificationPrecision?: bigint;
  };
};

function toStableSwapFeeRaw(feePips: number): bigint {
  return (BigInt(feePips) * CURVE_FEE_DENOMINATOR) / 1_000_000n;
}

function isStablePoolInfo(info: EkuboV3PoolInfo): info is EkuboV3StablePoolInfo {
  return info.poolKind === 'stableswap';
}

export function createReducer() {
  const stableSwapReducer = createStableSwapReducer<EkuboV3StableRuntimeInternal['info']>();

  function init(info: EkuboV3PoolInfo, state: EkuboV3PoolState): EkuboV3PoolRuntime {
    const domain = resolveEkuboV3Domain({ poolKind: info.poolKind, extension: info.extension });
    if (domain !== 'concentrated') {
      if (!isStablePoolInfo(info)) {
        throw new Error(`EkuboV3 domain ${domain} requires stable pool info.`);
      }
      const balancesByToken = (
        state as EkuboV3PoolState & {
          balancesByToken?: Map<string, bigint>;
        }
      ).balancesByToken;
      const balances = [
        balancesByToken?.get(info.token0.toLowerCase()) ?? 0n,
        balancesByToken?.get(info.token1.toLowerCase()) ?? 0n,
      ];
      const stableInfo = {
        ...info,
        coins: [info.token0, info.token1],
      };
      const stableState = {
        balances,
        reserve0: balances[0] ?? 0n,
        reserve1: balances[1] ?? 0n,
        nCoins: 2,
        fee: toStableSwapFeeRaw(info.feePips),
        ...(typeof info.amplification === 'number'
          ? {
              amplification: BigInt(info.amplification),
              amplificationPrecision: AMPLIFICATION_PRECISION,
            }
          : {}),
      };
      const stableRuntime = stableSwapReducer.init(stableInfo, stableState);
      const runtime: EkuboV3StablePoolRuntime = {
        info: { ...stableInfo, coins: stableRuntime.info.coins },
        state: {
          ...state,
          balances: stableRuntime.state.balances,
          reserve0: stableRuntime.state.reserve0,
          reserve1: stableRuntime.state.reserve1,
          nCoins: stableRuntime.state.nCoins ?? 2,
          ...(stableRuntime.state.fee !== undefined ? { fee: stableRuntime.state.fee } : {}),
          ...(stableRuntime.state.amplification !== undefined
            ? { amplification: stableRuntime.state.amplification }
            : {}),
          ...(stableRuntime.state.amplificationPrecision !== undefined
            ? { amplificationPrecision: stableRuntime.state.amplificationPrecision }
            : {}),
        },
        _temp: { tickBitmap: new Map() },
      };
      return runtime;
    }

    if (typeof info.tickSpacing !== 'number' || info.tickSpacing <= 0) {
      throw new Error(`EkuboV3 domain ${domain} is not supported by the CLMM runtime yet.`);
    }

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

  function applyUpdates(runtime: EkuboV3PoolRuntime, update: EkuboV3PoolUpdate): boolean {
    const domain = resolveEkuboV3Domain({
      poolKind: runtime.info.poolKind,
      extension: runtime.info.extension,
    });
    if (domain !== 'concentrated') {
      let changed = false;
      const stableRuntime = runtime as EkuboV3StableRuntimeInternal;

      if (update.sqrtRatioX128 !== undefined && update.sqrtRatioX128 !== stableRuntime.state.sqrtRatioX128) {
        stableRuntime.state.sqrtRatioX128 = update.sqrtRatioX128;
        changed = true;
      }
      if (update.tick !== undefined && update.tick !== stableRuntime.state.tick) {
        stableRuntime.state.tick = update.tick;
        changed = true;
      }
      if (update.liquidity !== undefined && update.liquidity !== stableRuntime.state.liquidity) {
        stableRuntime.state.liquidity = update.liquidity;
        changed = true;
      }
      if (update.updatedTicks.size > 0 || update.deletedTicks.length > 0) {
        for (const [tick, liquidityNet] of update.updatedTicks.entries()) {
          stableRuntime.state.ticks.set(tick, liquidityNet);
        }
        for (const tick of update.deletedTicks) {
          stableRuntime.state.ticks.delete(tick);
        }
        changed = true;
      }
      return changed;
    }

    if (typeof runtime.info.tickSpacing !== 'number' || runtime.info.tickSpacing <= 0) {
      throw new Error(`EkuboV3 domain ${domain} is not supported by the CLMM runtime yet.`);
    }

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
