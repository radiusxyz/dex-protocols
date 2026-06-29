import type { Addr } from '../../types/index';
import type { Tick, TickBitmap, TickSpacing } from '../../core/clmm/types';

export type UniswapV4TickInfo = {
  liquidityGross: bigint;
  liquidityNet: bigint;
};

export type UniswapV4Slot0 = {
  sqrtPriceX96: bigint;
  tick: Tick;
  /**
   * Packed fee layout from Uniswap v4:
   * - low 12 bits: zeroForOne protocol fee pips
   * - next 12 bits: oneForZero protocol fee pips
   */
  protocolFee: bigint;
  /**
   * LP fee in pips (1e6 denominator). Dynamic fee pools are out of scope for the
   * local exact-in quoter for now, so callers should pass the resolved fee.
   */
  lpFee: bigint;
};

export type UniswapV4PoolInfo = {
  token0: Addr;
  token1: Addr;
  tickSpacing: TickSpacing;
  feePips?: number;
  hooks?: Addr;
};

export type UniswapV4PoolState = {
  slot0: UniswapV4Slot0;
  liquidity: bigint;
  ticks: Map<Tick, UniswapV4TickInfo>;
};

export type UniswapV4PoolUpdate = {
  slot0?: Partial<UniswapV4Slot0>;
  liquidity?: bigint;
  updatedTicks: Map<Tick, Partial<UniswapV4TickInfo>>;
  deletedTicks: Tick[];
};

export type UniswapV4PoolRuntime = {
  info: UniswapV4PoolInfo;
  state: UniswapV4PoolState;
  _temp: {
    tickBitmap: TickBitmap;
  };
};
