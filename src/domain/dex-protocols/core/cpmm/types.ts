import { Token } from '@src/common/types';

export type UniswapV2PoolInfo = {
  token0: Token;
  token1: Token;
  feeBps: number;
};

export type UniswapV2PoolState = {
  reserve0: bigint;
  reserve1: bigint;
};

export type UniswapV2PoolUpdate = {
  reserve0: bigint;
  reserve1: bigint;
};

export type UniswapV2PoolRuntime = {
  info: UniswapV2PoolInfo;
  state: UniswapV2PoolState;
};
