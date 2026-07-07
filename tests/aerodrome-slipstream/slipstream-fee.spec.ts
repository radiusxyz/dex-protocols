import { describe, expect, it } from 'vitest';

import { getSlipstreamDefaultBaseFeePips } from '../../src/aerodrome-finance/slipstream/fee';

describe('Slipstream fee defaults', () => {
  it.each([
    { tickSpacing: 1, expectedFeePips: 100 },
    { tickSpacing: 10, expectedFeePips: 500 },
    { tickSpacing: 50, expectedFeePips: 500 },
    { tickSpacing: 100, expectedFeePips: 500 },
    { tickSpacing: 200, expectedFeePips: 3000 },
    { tickSpacing: 500, expectedFeePips: 10000 },
    { tickSpacing: 2000, expectedFeePips: 10000 },
  ])('maps tickSpacing=$tickSpacing to feePips=$expectedFeePips', ({ tickSpacing, expectedFeePips }) => {
    expect(getSlipstreamDefaultBaseFeePips(tickSpacing)).toBe(expectedFeePips);
  });

  it('throws for unsupported tickSpacing', () => {
    expect(() => getSlipstreamDefaultBaseFeePips(777)).toThrow('Unsupported AerodromeSlipstream tickSpacing');
  });
});
