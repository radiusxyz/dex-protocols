import { describe, expect, it } from 'vitest';

import { aerodromeSlipstreamModule } from '../../src/aerodrome-finance/slipstream';
import { resolveSlipstreamFeePips } from '../../src/aerodrome-finance/slipstream/fee';
import { observeTickCumulativesSlipstream } from '../../src/aerodrome-finance/slipstream/observation-math';
import { buildBoundaryQuoteCases, getMaxObservationTimestamp } from '../fixtures/clmm-boundary';

import { capturedAerodromeSlipstreamFixture } from './captured-fixture';
import { quoteCases } from './quote-cases';

function runtime() {
  return aerodromeSlipstreamModule.reducer.init(
    capturedAerodromeSlipstreamFixture.info,
    capturedAerodromeSlipstreamFixture.state,
  );
}

function blockTimestamp() {
  return getMaxObservationTimestamp(capturedAerodromeSlipstreamFixture.state.observationState.observations);
}

function quote(args: { amountIn: bigint; zeroForOne: boolean; sqrtPriceLimitX96: bigint }) {
  return aerodromeSlipstreamModule.quoter.quote({
    runtime: runtime(),
    amountIn: args.amountIn,
    zeroForOne: args.zeroForOne,
    sqrtPriceLimitX96: args.sqrtPriceLimitX96,
    blockTimestamp: blockTimestamp(),
  });
}

function feePips() {
  const currentRuntime = runtime();
  const timestamp = blockTimestamp();

  return resolveSlipstreamFeePips({
    tickSpacing: currentRuntime.info.tickSpacing,
    dynamicFeeConfig: currentRuntime.state.dynamicFeeConfig,
    currentTick: currentRuntime.state.tick,
    liquidity: currentRuntime.state.liquidity,
    observationIndex: currentRuntime.state.observationState.observationIndex,
    observationCardinality: currentRuntime.state.observationState.observationCardinality,
    observations: currentRuntime.state.observationState.observations,
    blockTimestamp: timestamp,
    secondsAgo: 600,
    observeTickCumulatives: ({
      blockTimestamp,
      secondsAgos,
      currentTick,
      liquidity,
      observationCardinality,
      observationIndex,
      observations,
    }) =>
      observeTickCumulativesSlipstream({
        time: blockTimestamp,
        secondsAgos,
        tick: currentTick,
        liquidity,
        observationState: {
          observations,
          observationIndex,
          observationCardinality,
        },
      }),
  }).feePips;
}

describe('Aerodrome Slipstream quoter regressions', () => {
  it('quotes explicit geometric quote-case fixtures', () => {
    const results = quoteCases.map((quoteCase) => quote(quoteCase));

    expect(results).toMatchSnapshot();
  });

  it('rejects invalid price-limit and empty-liquidity boundaries', () => {
    const currentRuntime = runtime();

    expect(() =>
      aerodromeSlipstreamModule.quoter.quote({
        runtime: currentRuntime,
        amountIn: 1n,
        zeroForOne: true,
        sqrtPriceLimitX96: currentRuntime.state.sqrtPriceX96 + 1n,
        blockTimestamp: blockTimestamp(),
      }),
    ).toThrow('This swap is impossible from the current price in this direction.');
    expect(() =>
      aerodromeSlipstreamModule.quoter.quote({
        runtime: aerodromeSlipstreamModule.reducer.init(capturedAerodromeSlipstreamFixture.info, {
          ...capturedAerodromeSlipstreamFixture.state,
          liquidity: 0n,
          ticks: new Map(),
        }),
        amountIn: 1n,
        zeroForOne: true,
        sqrtPriceLimitX96: 0n,
        blockTimestamp: blockTimestamp(),
      }),
    ).toThrow('Cannot quote against an empty pool');
  });

  it('quotes deterministic next-tick boundary windows', () => {
    const currentRuntime = runtime();
    const boundaryCases = buildBoundaryQuoteCases({
      tick: currentRuntime.state.tick,
      sqrtPriceX96: currentRuntime.state.sqrtPriceX96,
      liquidity: currentRuntime.state.liquidity,
      tickSpacing: currentRuntime.info.tickSpacing,
      tickBitmap: currentRuntime._temp.tickBitmap,
      feePips: feePips(),
    });

    expect(boundaryCases.map((quoteCase) => ({ ...quoteCase, result: quote(quoteCase) }))).toMatchSnapshot();
  });
});
