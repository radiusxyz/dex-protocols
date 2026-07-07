import { describe, expect, it } from 'vitest';

import { pancakeSwapV3Module } from '../../src/pancake-swap/v3';
import { buildBoundaryQuoteCases } from '../fixtures/clmm-boundary';

import { capturedPancakeSwapV3Fixture } from './captured-fixture';
import { quoteCases } from './quote-cases';

function runtime() {
  return pancakeSwapV3Module.reducer.init(capturedPancakeSwapV3Fixture.info, capturedPancakeSwapV3Fixture.state);
}

function quote(args: { amountIn: bigint; zeroForOne: boolean; sqrtPriceLimitX96: bigint }) {
  return pancakeSwapV3Module.quoter.quote({
    runtime: runtime(),
    amountIn: args.amountIn,
    zeroForOne: args.zeroForOne,
    sqrtPriceLimitX96: args.sqrtPriceLimitX96,
  });
}

describe('PancakeSwap V3 quoter regressions', () => {
  it('quotes explicit geometric quote-case fixtures', () => {
    const results = quoteCases.map((quoteCase) => quote(quoteCase));

    expect(results).toMatchSnapshot();
  });

  it('rejects invalid price-limit and empty-liquidity boundaries', () => {
    const currentRuntime = runtime();

    expect(() =>
      pancakeSwapV3Module.quoter.quote({
        runtime: currentRuntime,
        amountIn: 1n,
        zeroForOne: true,
        sqrtPriceLimitX96: currentRuntime.state.sqrtPriceX96 + 1n,
      }),
    ).toThrow('This swap is impossible from the current price in this direction.');
    expect(() =>
      pancakeSwapV3Module.quoter.quote({
        runtime: pancakeSwapV3Module.reducer.init(capturedPancakeSwapV3Fixture.info, {
          liquidity: 0n,
          sqrtPriceX96: currentRuntime.state.sqrtPriceX96,
          tick: currentRuntime.state.tick,
          ticks: new Map(),
        }),
        amountIn: 1n,
        zeroForOne: true,
        sqrtPriceLimitX96: 0n,
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
      feePips: currentRuntime.info.feePips,
    });

    expect(boundaryCases.map((quoteCase) => ({ ...quoteCase, result: quote(quoteCase) }))).toMatchSnapshot();
  });
});
