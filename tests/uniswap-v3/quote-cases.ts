import type { QuoteCase } from '../fixtures/quote-cases';

import { uniswapV3BoundaryQuoteCases, uniswapV3GeometricProgressiveQuoteCases } from './quoter-regression-fixtures';

export const quoteCases = [
  ...uniswapV3GeometricProgressiveQuoteCases.map(
    ([amountIn, zeroForOne, sqrtPriceLimitX96], sourceIndex): QuoteCase => ({
      label: 'geometric',
      sourceIndex,
      amountIn,
      zeroForOne,
      sqrtPriceLimitX96,
    }),
  ),
  ...uniswapV3BoundaryQuoteCases.map(
    ([mode, nextTick, delta, amountIn, zeroForOne, sqrtPriceLimitX96], sourceIndex): QuoteCase => ({
      label: 'boundary',
      sourceIndex,
      mode,
      nextTick,
      delta,
      amountIn,
      zeroForOne,
      sqrtPriceLimitX96,
    }),
  ),
] satisfies QuoteCase[];
