import type { Addr } from '../../types/index';
export type Tick = number;
export type TickSpacing = number;
export type NetLiquidity = bigint;
export type WordPos = number;
export type BitMapWord = bigint;
export type BitPos = number;
export type TickBitmap = Map<WordPos, BitMapWord>;
export type UniswapV3PoolInfo = {
    token0: Addr;
    token1: Addr;
    feePips: number;
    tickSpacing: TickSpacing;
};
export type UniswapV3PoolState = {
    sqrtPriceX96: bigint;
    tick: Tick;
    liquidity: bigint;
    ticks: Map<Tick, NetLiquidity>;
};
export type UniswapV3PoolUpdate = {
    sqrtPriceX96?: bigint;
    liquidity?: bigint;
    updatedTicks: Map<Tick, NetLiquidity>;
    deletedTicks: Tick[];
    tick?: Tick;
};
export type UniswapV3PoolRuntime = {
    info: UniswapV3PoolInfo;
    state: UniswapV3PoolState;
    _temp: {
        tickBitmap: TickBitmap;
    };
};
//# sourceMappingURL=types.d.ts.map