import { buildGeometricQuoteCases } from '../fixtures/quote-cases';

export const quoteCases = buildGeometricQuoteCases([
  {
    startAmountIn: 76_511_724_374n,
    count: 24,
    zeroForOne: true,
  },
  {
    startAmountIn: 121n,
    count: 24,
    zeroForOne: false,
  },
]);
