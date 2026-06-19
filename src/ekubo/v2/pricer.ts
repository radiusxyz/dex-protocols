import { reduceRatio } from '../../core/clmm/pricer';

export type EkuboV2PricerParams = {
  sqrtRatioX128: bigint;
};

type PriceRatio = { num: bigint; den: bigint };

export type EkuboV2PricerReturn = {
  price0Per1: PriceRatio;
  price1Per0: PriceRatio;
};

export function createPricer() {
  function computeSpotPrices({ sqrtRatioX128 }: EkuboV2PricerParams): EkuboV2PricerReturn {
    const q256 = 2n ** 256n;

    if (sqrtRatioX128 === 0n) {
      const z = { num: 0n, den: 1n };
      return { price1Per0: z, price0Per1: z };
    }

    const num = sqrtRatioX128 * sqrtRatioX128;
    const price1Per0 = reduceRatio({ num, den: q256 });
    const price0Per1 =
      price1Per0.num === 0n ? { num: 0n, den: 1n } : reduceRatio({ num: price1Per0.den, den: price1Per0.num });

    return { price1Per0, price0Per1 };
  }

  return { computeSpotPrices };
}
