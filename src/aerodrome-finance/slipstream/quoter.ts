// src/protocols/aerodrome-finance/slipstream/quoter.ts

import { resolveSlipstreamFeePips } from './fee';
import { observeTickCumulativesSlipstream } from './observation-math';
import { uniswapV3Module } from '../../uniswap/v3/index';

import { DEFAULT_SECONDS_AGO } from './constants';
import { Tick, AerodromeSlipstreamPoolRuntime } from './types';

export type AerodromeSlipstreamQuoterParams = {
  amountIn: bigint;
  zeroForOne: boolean;
  sqrtPriceLimitX96: bigint;
  runtime: AerodromeSlipstreamPoolRuntime;
  blockTimestamp: number; // NEW
  secondsAgo?: number; // optional (default 600)
  defaultBaseFee?: number; // optional (default 0)
};

export type AerodromeSlipstreamQuoterReturn = {
  amountOut: bigint;
  sqrtPriceAfterX96: bigint;
  tickAfter: Tick;
  liquidityAfter: bigint;
};

export function createQuoter() {
  const { quote: quoteUniswapV3, quoteMidFeePips } = uniswapV3Module.quoter;

  function quote({
    amountIn,
    zeroForOne,
    sqrtPriceLimitX96,
    runtime,
    blockTimestamp,
    secondsAgo = DEFAULT_SECONDS_AGO,
    defaultBaseFee,
  }: AerodromeSlipstreamQuoterParams): AerodromeSlipstreamQuoterReturn {
    // optional cache by (blockTimestamp, secondsAgo)
    const cached = runtime._temp.feeContext;
    const feePips =
      cached &&
      cached.computedAtTimestamp === blockTimestamp &&
      cached.secondsAgo === secondsAgo &&
      cached.computedFeePips !== undefined
        ? cached.computedFeePips
        : resolveSlipstreamFeePips({
            tickSpacing: runtime.info.tickSpacing,
            dynamicFeeConfig: runtime.state.dynamicFeeConfig,
            currentTick: runtime.state.tick,
            liquidity: runtime.state.liquidity,
            observationIndex: runtime.state.observationState.observationIndex,
            observationCardinality: runtime.state.observationState.observationCardinality,
            observations: runtime.state.observationState.observations,
            blockTimestamp,
            secondsAgo,
            ...(defaultBaseFee !== undefined ? { defaultBaseFee } : {}),
            observeTickCumulatives: ({
              blockTimestamp,
              secondsAgos,
              currentTick,
              observationIndex,
              liquidity,
              observationCardinality,
              observations,
            }) =>
              observeTickCumulativesSlipstream({
                time: blockTimestamp,
                secondsAgos,
                tick: currentTick,
                observationState: {
                  observations,
                  observationIndex,
                  observationCardinality,
                },
                liquidity,
              }),
          }).feePips;

    runtime._temp.feeContext = {
      secondsAgo,
      computedFeePips: feePips,
      computedAtTimestamp: blockTimestamp,
    };
    return quoteUniswapV3({
      amountIn,
      zeroForOne,
      sqrtPriceLimitX96,
      runtime: {
        info: {
          ...runtime.info,
          feePips,
        },
        state: runtime.state,
        _temp: runtime._temp,
      },
    });
  }
  return { quote, quoteMidFeePips };
}
