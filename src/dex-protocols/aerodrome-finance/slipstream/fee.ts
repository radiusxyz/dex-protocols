// src/dex-protocols/aerodrome-finance/slipstream/fee.ts
import {
  DEFAULT_FEE_CAP,
  DEFAULT_SCALING_FACTOR,
  MIN_OBSERVATION_CARDINALITY,
  SCALING_PRECISION,
  ZERO_FEE_INDICATOR,
} from '@src/dex-protocols/aerodrome-finance/slipstream/constants';
import { DynamicFeeConfig, Observation } from '@src/dex-protocols/aerodrome-finance/slipstream/types';

type ObserveTickCumulativesParams = {
  blockTimestamp: number;
  secondsAgos: [number, number];
  currentTick: number;
  observationIndex: number;
  liquidity: bigint;
  observationCardinality: number;
  observations: Map<number, Observation>;
};

export function getSlipstreamDefaultBaseFeePips(tickSpacing: number): number {
  // Keep this mapping as the single source of truth for Slipstream's default
  // base fee by tickSpacing. Both the domain quoter path and Paraswap tx-builder
  // reuse this helper so they cannot silently drift apart.
  switch (tickSpacing) {
    case 1:
      return 100;
    case 10:
    case 50:
    case 100:
      return 500;
    case 200:
      return 3000;
    case 2000:
      return 10000;
    default:
      throw new Error(`Unsupported AerodromeSlipstream tickSpacing: ${tickSpacing}`);
  }
}

export function getSlipstreamFeePips(args: {
  dynamicFeeConfig: DynamicFeeConfig;
  currentTick: number;
  liquidity: bigint;
  observationIndex: number;
  observationCardinality: number;
  observations: Map<number, Observation>;
  blockTimestamp: number;
  secondsAgo: number;
  defaultBaseFee?: number;

  observeTickCumulatives: (params: ObserveTickCumulativesParams) => bigint[];
}): number {
  const {
    dynamicFeeConfig,
    currentTick,
    liquidity,
    observationIndex,
    observationCardinality,
    observations,
    blockTimestamp,
    secondsAgo,
    defaultBaseFee = 0,
    observeTickCumulatives,
  } = args;

  // 420 => force 0 fee
  if (dynamicFeeConfig.baseFee === ZERO_FEE_INDICATOR) {
    return 0;
  }

  // baseFee: if 0 => fallback
  const baseFee = dynamicFeeConfig.baseFee === 0 ? defaultBaseFee : dynamicFeeConfig.baseFee;

  // If scalingFactor == 0, protocol uses defaults (and dynamic part becomes 0 anyway)
  const scalingFactor = dynamicFeeConfig.scalingFactor !== 0n ? dynamicFeeConfig.scalingFactor : DEFAULT_SCALING_FACTOR;

  const feeCap = dynamicFeeConfig.scalingFactor !== 0n ? dynamicFeeConfig.feeCap : DEFAULT_FEE_CAP;

  if (observationCardinality < MIN_OBSERVATION_CARDINALITY) {
    return Math.min(baseFee, feeCap);
  }

  const tickCumulatives = (() => {
    try {
      return observeTickCumulatives({
        blockTimestamp,
        secondsAgos: [secondsAgo, 0],
        currentTick,
        observationIndex,
        liquidity,
        observationCardinality,
        observations,
      });
    } catch {
      return null;
    }
  })();

  if (!tickCumulatives || tickCumulatives.length < 2) {
    return Math.min(baseFee, feeCap);
  }
  const [tickCumulative0, tickCumulative1] = tickCumulatives;
  if (tickCumulative0 === undefined || tickCumulative1 === undefined) {
    return Math.min(baseFee, feeCap);
  }
  const delta = tickCumulative1 - tickCumulative0;
  const denom = BigInt(secondsAgo);

  // Slipstream/Rust path uses integer division semantics (truncate toward zero).
  // Do not apply Uniswap style negative floor adjustment here.
  const mean = delta / denom;

  const twAvgTick = Number(mean);
  const absTickDelta = Math.abs(currentTick - twAvgTick);

  const dynamicFee = Number((BigInt(absTickDelta) * scalingFactor) / SCALING_PRECISION);
  const total = baseFee + dynamicFee;

  return Math.min(total, feeCap);
}

export function resolveSlipstreamFeePips(args: {
  tickSpacing: number;
  dynamicFeeConfig: DynamicFeeConfig;
  currentTick: number;
  liquidity: bigint;
  observationIndex: number;
  observationCardinality: number;
  observations: Map<number, Observation>;
  blockTimestamp: number;
  secondsAgo: number;
  defaultBaseFee?: number;
  observeTickCumulatives: (params: ObserveTickCumulativesParams) => bigint[];
}): { feePips: number; defaultBaseFeePips: number } {
  const defaultBaseFeePips = args.defaultBaseFee ?? getSlipstreamDefaultBaseFeePips(args.tickSpacing);
  const feePips = getSlipstreamFeePips({
    dynamicFeeConfig: args.dynamicFeeConfig,
    currentTick: args.currentTick,
    liquidity: args.liquidity,
    observationIndex: args.observationIndex,
    observationCardinality: args.observationCardinality,
    observations: args.observations,
    blockTimestamp: args.blockTimestamp,
    secondsAgo: args.secondsAgo,
    defaultBaseFee: defaultBaseFeePips,
    observeTickCumulatives: args.observeTickCumulatives,
  });

  return { feePips, defaultBaseFeePips };
}
