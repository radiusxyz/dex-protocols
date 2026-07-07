import { describe, expect, it } from 'vitest';

import { aerodromeSlipstreamModule } from '../../src/aerodrome-finance/slipstream';
import { resolveSlipstreamFeePips } from '../../src/aerodrome-finance/slipstream/fee';
import { observeTickCumulativesSlipstream } from '../../src/aerodrome-finance/slipstream/observation-math';
import { uniswapV3Module } from '../../src/uniswap/v3';

import { capturedAerodromeSlipstreamFixture } from './captured-fixture';
import { capturedAerodromeSlipstreamOnchainQuoteFixture } from './onchain-quote-captured-fixture';
import { quoteCases } from './quote-cases';

function runtime() {
  return aerodromeSlipstreamModule.reducer.init(
    capturedAerodromeSlipstreamFixture.info,
    capturedAerodromeSlipstreamFixture.state,
  );
}

function quoteCaseKey(quoteCase: {
  label: string;
  sourceIndex?: number;
  zeroForOne: boolean;
  amountIn: bigint;
  sqrtPriceLimitX96: bigint;
}) {
  return [
    quoteCase.label,
    quoteCase.sourceIndex ?? 0,
    quoteCase.zeroForOne ? 'zero-for-one' : 'one-for-zero',
    quoteCase.amountIn.toString(),
    quoteCase.sqrtPriceLimitX96.toString(),
  ].join(':');
}

function capturedFeeRuntime() {
  const baseRuntime = runtime();

  return {
    info: {
      ...baseRuntime.info,
      feePips: capturedAerodromeSlipstreamOnchainQuoteFixture.source.poolFeePips,
    },
    state: baseRuntime.state,
    _temp: baseRuntime._temp,
  };
}

function fixtureDerivedFeePips() {
  const currentRuntime = runtime();

  return resolveSlipstreamFeePips({
    tickSpacing: currentRuntime.info.tickSpacing,
    dynamicFeeConfig: currentRuntime.state.dynamicFeeConfig,
    currentTick: currentRuntime.state.tick,
    liquidity: currentRuntime.state.liquidity,
    observationIndex: currentRuntime.state.observationState.observationIndex,
    observationCardinality: currentRuntime.state.observationState.observationCardinality,
    observations: currentRuntime.state.observationState.observations,
    blockTimestamp: capturedAerodromeSlipstreamOnchainQuoteFixture.source.blockTimestamp,
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

describe('Aerodrome Slipstream onchain parity fixtures', () => {
  it('records the onchain pool fee used by the captured QuoterV2 outputs', () => {
    expect(capturedAerodromeSlipstreamOnchainQuoteFixture.source.poolFeePips).toBe(998);

    // This documents the current Tycho fixture mismatch: the captured pool
    // observations/config compute 688, while onchain pool.fee() at the block is 998.
    expect(fixtureDerivedFeePips()).toBe(688);
  });

  it('matches captured QuoterV2 outputs for captured quote cases using the captured onchain pool fee', () => {
    const quoteCaseKeys = new Set(quoteCases.map((quoteCase) => quoteCaseKey(quoteCase)));

    expect(capturedAerodromeSlipstreamOnchainQuoteFixture.source).toMatchObject({
      protocol: 'AerodromeSlipstream',
      chainId: capturedAerodromeSlipstreamFixture.source.chainId,
      blockNumber: BigInt(capturedAerodromeSlipstreamFixture.source.blockNumber),
      blockTimestamp: capturedAerodromeSlipstreamOnchainQuoteFixture.source.blockTimestamp,
      pool: capturedAerodromeSlipstreamFixture.source.pool,
      poolFeePips: 998,
      quoteKind: 'aerodrome-slipstream',
    });
    expect(capturedAerodromeSlipstreamOnchainQuoteFixture.cases.length).toBeGreaterThan(0);

    for (const onchainQuote of capturedAerodromeSlipstreamOnchainQuoteFixture.cases) {
      expect(quoteCaseKeys.has(quoteCaseKey(onchainQuote))).toBe(true);

      const localQuote = uniswapV3Module.quoter.quote({
        runtime: capturedFeeRuntime(),
        amountIn: onchainQuote.amountIn,
        zeroForOne: onchainQuote.zeroForOne,
        sqrtPriceLimitX96: onchainQuote.sqrtPriceLimitX96,
      });

      expect(localQuote.amountOut).toBe(onchainQuote.amountOut);
      expect(localQuote.sqrtPriceAfterX96).toBe(onchainQuote.sqrtPriceAfterX96);
    }
  });
});
