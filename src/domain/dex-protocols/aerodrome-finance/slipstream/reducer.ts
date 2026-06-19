import {
  buildTickBitmap,
  clearInitializedInBitmap,
  setInitializedInBitmap,
} from '@src/domain/dex-protocols/core/clmm/tick-math';

import type {
  AerodromeSlipstreamPoolInfo,
  AerodromeSlipstreamPoolState,
  AerodromeSlipstreamPoolRuntime,
  AerodromeSlipstreamPoolUpdate,
} from './types';

export type AerodromeSlipstreamReducer = {
  init(info: AerodromeSlipstreamPoolInfo, state: AerodromeSlipstreamPoolState): AerodromeSlipstreamPoolRuntime;
  applyUpdates(runtime: AerodromeSlipstreamPoolRuntime, update: AerodromeSlipstreamPoolUpdate): boolean;
};

export function createReducer(): AerodromeSlipstreamReducer {
  function init(
    info: AerodromeSlipstreamPoolInfo,
    state: AerodromeSlipstreamPoolState,
  ): AerodromeSlipstreamPoolRuntime {
    const ticks = new Map(state.ticks);
    const tickBitmap = buildTickBitmap({ ticks, tickSpacing: info.tickSpacing });

    const observations = new Map(state.observationState.observations);

    return {
      info: { ...info },
      state: {
        ...state,
        ticks,
        observationState: {
          ...state.observationState,
          observations,
        },
        dynamicFeeConfig: { ...state.dynamicFeeConfig },
      },
      _temp: { tickBitmap },
    };
  }

  function applyUpdates(runtime: AerodromeSlipstreamPoolRuntime, update: AerodromeSlipstreamPoolUpdate): boolean {
    const tickSpacing = runtime.info.tickSpacing;
    let changed = false;
    let feeInputsChanged = false;

    // pool-level fields
    if (update.sqrtPriceX96 !== undefined && update.sqrtPriceX96 !== runtime.state.sqrtPriceX96) {
      runtime.state.sqrtPriceX96 = update.sqrtPriceX96;
      changed = true;
    }

    if (update.tick !== undefined && update.tick !== runtime.state.tick) {
      runtime.state.tick = update.tick;
      changed = true;
      feeInputsChanged = true;
    }

    if (update.liquidity !== undefined && update.liquidity !== runtime.state.liquidity) {
      runtime.state.liquidity = update.liquidity;
      changed = true;
      feeInputsChanged = true;
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

    // observation head pointers
    if (
      update.observationIndex !== undefined &&
      update.observationIndex !== runtime.state.observationState.observationIndex
    ) {
      runtime.state.observationState.observationIndex = update.observationIndex;
      changed = true;
      feeInputsChanged = true;
    }

    if (
      update.observationCardinality !== undefined &&
      update.observationCardinality !== runtime.state.observationState.observationCardinality
    ) {
      runtime.state.observationState.observationCardinality = update.observationCardinality;
      changed = true;
      feeInputsChanged = true;
    }

    // observation slots upserts
    if (update.updatedObservations && update.updatedObservations.size > 0) {
      for (const [idx, observation] of update.updatedObservations.entries()) {
        const prev = runtime.state.observationState.observations.get(idx);

        // cheap change detection; good enough in practice
        const same =
          prev &&
          prev.initialized === observation.initialized &&
          prev.blockTimestamp === observation.blockTimestamp &&
          prev.tickCumulative === observation.tickCumulative &&
          prev.secondsPerLiquidityCumulativeX128 === observation.secondsPerLiquidityCumulativeX128;

        if (!same) {
          runtime.state.observationState.observations.set(idx, observation);
          changed = true;
          feeInputsChanged = true;
        }
      }
    }

    // dynamicFeeConfig partial updates
    if (update.dynamicFeeConfig) {
      const dynamicFeeConfig = runtime.state.dynamicFeeConfig;

      if (
        update.dynamicFeeConfig.baseFee !== undefined &&
        update.dynamicFeeConfig.baseFee !== dynamicFeeConfig.baseFee
      ) {
        dynamicFeeConfig.baseFee = update.dynamicFeeConfig.baseFee;
        changed = true;
      }
      if (update.dynamicFeeConfig.feeCap !== undefined && update.dynamicFeeConfig.feeCap !== dynamicFeeConfig.feeCap) {
        dynamicFeeConfig.feeCap = update.dynamicFeeConfig.feeCap;
        changed = true;
      }
      if (
        update.dynamicFeeConfig.scalingFactor !== undefined &&
        update.dynamicFeeConfig.scalingFactor !== dynamicFeeConfig.scalingFactor
      ) {
        dynamicFeeConfig.scalingFactor = update.dynamicFeeConfig.scalingFactor;
        changed = true;
      }
      feeInputsChanged = true;
    }
    if (feeInputsChanged) {
      delete runtime._temp.feeContext;
    }

    return changed;
  }

  return { init, applyUpdates };
}
