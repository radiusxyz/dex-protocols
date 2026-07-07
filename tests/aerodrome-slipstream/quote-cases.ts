import { buildGeometricQuoteCases } from '../fixtures/quote-cases';

export const quoteCases = buildGeometricQuoteCases([
  {
    startAmountIn: 10_000_000_000n,
    count: 24,
    zeroForOne: true,
  },
  {
    startAmountIn: 10_000_000_000n,
    count: 24,
    zeroForOne: false,
  },
]);
