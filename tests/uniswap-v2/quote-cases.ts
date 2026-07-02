import { buildGeometricQuoteCases } from '../fixtures/quote-cases';

export const quoteCases = buildGeometricQuoteCases([
  {
    startAmountIn: 8_062n,
    count: 24,
    zeroForOne: true,
  },
  {
    startAmountIn: 5_071_308_830_382n,
    count: 24,
    zeroForOne: false,
  },
]);
