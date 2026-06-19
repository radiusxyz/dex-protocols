export type PriceRatio = {
  num: bigint;
  den: bigint;
};

export type UniswapV2PricerParams = {
  reserve0: bigint;
  reserve1: bigint;
};

export type UniswapV2PricerReturn = {
  price0Per1: PriceRatio;
  price1Per0: PriceRatio;
};

export function createPricer() {
  function computePrices({ reserve0, reserve1 }: UniswapV2PricerParams): UniswapV2PricerReturn {
    if (reserve0 === 0n || reserve1 === 0n) {
      return { price0Per1: { num: 0n, den: 1n }, price1Per0: { num: 0n, den: 1n } };
    }

    const price1Per0 = { num: reserve1, den: reserve0 };
    const price0Per1 = { num: reserve0, den: reserve1 };

    return {
      price1Per0,
      price0Per1,
    };
  }
  return { computePrices };
}
