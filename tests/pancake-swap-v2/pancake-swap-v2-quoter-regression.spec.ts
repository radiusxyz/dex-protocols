import { describe, expect, it } from 'vitest';

import { pancakeSwapV2Module } from '../../src/pancake-swap/v2';

import { capturedPancakeSwapV2Fixture } from './captured-fixture';
import { quoteCases } from './quote-cases';

function runtime() {
  return pancakeSwapV2Module.reducer.init(capturedPancakeSwapV2Fixture.info, capturedPancakeSwapV2Fixture.state);
}

describe('PancakeSwap V2 quoter regressions', () => {
  it('quotes explicit geometric quote-case fixtures', () => {
    const results = quoteCases.map((quoteCase) =>
      pancakeSwapV2Module.quoter.quote({
        runtime: runtime(),
        amountIn: quoteCase.amountIn,
        zeroForOne: quoteCase.zeroForOne,
      }),
    );

    expect(results).toMatchSnapshot();
  });

  it('rejects invalid reserve and amount boundaries', () => {
    expect(() => pancakeSwapV2Module.quoter.quote({ runtime: runtime(), amountIn: 0n, zeroForOne: true })).toThrow(
      'amountIn must be > 0',
    );
    expect(() =>
      pancakeSwapV2Module.quoter.quote({
        runtime: pancakeSwapV2Module.reducer.init(capturedPancakeSwapV2Fixture.info, { reserve0: 0n, reserve1: 1n }),
        amountIn: 1n,
        zeroForOne: true,
      }),
    ).toThrow('reserves must be > 0');
  });

  it('keeps extreme input output below the available reserve', () => {
    const currentRuntime = runtime();
    const result = pancakeSwapV2Module.quoter.quote({
      runtime: currentRuntime,
      amountIn: currentRuntime.state.reserve0 * 10n ** 30n,
      zeroForOne: true,
    });

    expect(result.amountOut).toBeGreaterThan(0n);
    expect(result.amountOut).toBeLessThan(currentRuntime.state.reserve1);
  });
});
