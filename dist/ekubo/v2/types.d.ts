import type { Addr } from '../../types/index';
export type Tick = number;
export type TickSpacing = number;
export type NetLiquidity = bigint;
export type WordPos = number;
export type BitMapWord = bigint;
export type BitPos = number;
export type TickBitmap = Map<WordPos, BitMapWord>;
export type EkuboV2PoolInfo = {
    token0: Addr;
    token1: Addr;
    feePips: number;
    tickSpacing: TickSpacing;
};
export type EkuboV2PoolState = {
    sqrtRatioX128: bigint;
    tick: Tick;
    liquidity: bigint;
    ticks: Map<Tick, NetLiquidity>;
};
export type EkuboV2PoolUpdate = {
    sqrtRatioX128?: bigint;
    liquidity?: bigint;
    updatedTicks: Map<Tick, NetLiquidity>;
    deletedTicks: Tick[];
    tick?: Tick;
};
export type EkuboV2PoolRuntime = {
    info: EkuboV2PoolInfo;
    state: EkuboV2PoolState;
    _temp: {
        tickBitmap: TickBitmap;
    };
};
//# sourceMappingURL=types.d.ts.map