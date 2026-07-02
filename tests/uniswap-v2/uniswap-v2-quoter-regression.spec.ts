import { describe, expect, it } from 'vitest';

import { uniswapV2Module } from '../../src/uniswap/v2';

import { capturedUniswapV2Fixture } from './captured-fixture';
import { quoteCases } from './quote-cases';

function runtime() {
  return uniswapV2Module.reducer.init(capturedUniswapV2Fixture.info, capturedUniswapV2Fixture.state);
}

describe('Uniswap V2 quoter regressions', () => {
  it('quotes explicit geometric quote-case fixtures', () => {
    const results = quoteCases.map((quoteCase) =>
      uniswapV2Module.quoter.quote({
        runtime: runtime(),
        amountIn: quoteCase.amountIn,
        zeroForOne: quoteCase.zeroForOne,
      }),
    );

    expect(results).toMatchSnapshot();
  });

  it('rejects invalid reserve and amount boundaries', () => {
    expect(() => uniswapV2Module.quoter.quote({ runtime: runtime(), amountIn: 0n, zeroForOne: true })).toThrow(
      'amountIn must be > 0',
    );
    expect(() =>
      uniswapV2Module.quoter.quote({
        runtime: uniswapV2Module.reducer.init(capturedUniswapV2Fixture.info, { reserve0: 0n, reserve1: 1n }),
        amountIn: 1n,
        zeroForOne: true,
      }),
    ).toThrow('reserves must be > 0');
  });

  it('keeps extreme input output below the available reserve', () => {
    const currentRuntime = runtime();
    const result = uniswapV2Module.quoter.quote({
      runtime: currentRuntime,
      amountIn: currentRuntime.state.reserve0 * 10n ** 30n,
      zeroForOne: true,
    });

    expect(result.amountOut).toBeGreaterThan(0n);
    expect(result.amountOut).toBeLessThan(currentRuntime.state.reserve1);
  });
});
