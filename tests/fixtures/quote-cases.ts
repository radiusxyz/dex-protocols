export type QuoteCase = {
  label: 'boundary' | 'geometric';
  sourceIndex?: number;
  amountIn: bigint;
  zeroForOne: boolean;
  sqrtPriceLimitX96: bigint;
  mode?: 'natural' | 'clamp';
  nextTick?: number;
  delta?: bigint;
};

export type GeometricQuoteCaseConfig = {
  startAmountIn: bigint;
  count: number;
  zeroForOne: boolean;
  sqrtPriceLimitX96?: bigint;
};

export function buildGeometricQuoteCases(configs: readonly GeometricQuoteCaseConfig[]): QuoteCase[] {
  return configs.flatMap((config) => {
    const cases: QuoteCase[] = [];
    let amountIn = config.startAmountIn;

    for (let sourceIndex = 0; sourceIndex < config.count; sourceIndex += 1) {
      cases.push({
        label: 'geometric',
        sourceIndex,
        amountIn,
        zeroForOne: config.zeroForOne,
        sqrtPriceLimitX96: config.sqrtPriceLimitX96 ?? 0n,
      });
      amountIn *= 2n;
    }

    return cases;
  });
}
