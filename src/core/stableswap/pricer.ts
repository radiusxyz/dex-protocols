export type PriceRatio = {
  num: bigint;
  den: bigint;
};

export type StableSwapPricerParams = {
  reserve0: bigint;
  reserve1: bigint;
};

export type StableSwapPricerReturn = {
  price0Per1: PriceRatio;
  price1Per0: PriceRatio;
};

export function createPricer() {
  function computePrices({ reserve0, reserve1 }: StableSwapPricerParams): StableSwapPricerReturn {
    if (reserve0 === 0n || reserve1 === 0n) {
      return {
        price0Per1: { num: 0n, den: 1n },
        price1Per0: { num: 0n, den: 1n },
      };
    }

    return {
      price0Per1: { num: reserve0, den: reserve1 },
      price1Per0: { num: reserve1, den: reserve0 },
    };
  }

  return { computePrices };
}
