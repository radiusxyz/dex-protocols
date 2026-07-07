import { getSqrtRatioAtTick } from '../../src/core/clmm/tick-math';
import type { UniswapV3PoolInfo, UniswapV3PoolState, UniswapV3PoolUpdate } from '../../src/uniswap/v3/types';

const LIQUIDITY = 1_000_000_000_000_000_000n;

export const simpleUniswapV3Fixture = {
  pool: '0x0000000000000000000000000000000000000003',
  info: {
    token0: '0x0000000000000000000000000000000000000001',
    token1: '0x0000000000000000000000000000000000000002',
    feePips: 3000,
    tickSpacing: 60,
  } satisfies UniswapV3PoolInfo,
  state: {
    sqrtPriceX96: getSqrtRatioAtTick(0),
    tick: 0,
    liquidity: LIQUIDITY,
    ticks: new Map([
      [-60, LIQUIDITY],
      [60, -LIQUIDITY],
    ]),
  } satisfies UniswapV3PoolState,
  update: {
    sqrtPriceX96: getSqrtRatioAtTick(1),
    tick: 1,
    liquidity: LIQUIDITY + 1n,
    updatedTicks: new Map([
      [60, -(LIQUIDITY + 1n)],
      [120, -500n],
    ]),
    deletedTicks: [-60],
  } satisfies UniswapV3PoolUpdate,
  nextState: {
    sqrtPriceX96: getSqrtRatioAtTick(1),
    tick: 1,
    liquidity: LIQUIDITY + 1n,
    ticks: new Map([
      [60, -(LIQUIDITY + 1n)],
      [120, -500n],
    ]),
  } satisfies UniswapV3PoolState,
  quotes: [
    {
      amountIn: 1_000_000n,
      zeroForOne: true,
      expected: {
        amountOut: 996_999n,
        sqrtPriceAfterX96: 79_228_162_514_185_347_115_517_307_545n,
        tickAfter: -1,
        liquidityAfter: LIQUIDITY,
      },
    },
    {
      amountIn: 1_000_000n,
      zeroForOne: false,
      expected: {
        amountOut: 996_999n,
        sqrtPriceAfterX96: 79_228_162_514_343_328_071_570_671_880n,
        tickAfter: 0,
        liquidityAfter: LIQUIDITY,
      },
    },
    {
      amountIn: 1_000_000_000_000_000n,
      zeroForOne: true,
      expected: {
        amountOut: 996_006_981_039_903n,
        sqrtPriceAfterX96: 79_149_250_711_305_166_342_700_278_159n,
        tickAfter: -20,
        liquidityAfter: LIQUIDITY,
      },
    },
    {
      amountIn: 1_000_000_000_000_000n,
      zeroForOne: false,
      expected: {
        amountOut: 996_006_981_039_903n,
        sqrtPriceAfterX96: 79_307_152_992_291_059_138_124_713_654n,
        tickAfter: 19,
        liquidityAfter: LIQUIDITY,
      },
    },
  ],
} as const;
