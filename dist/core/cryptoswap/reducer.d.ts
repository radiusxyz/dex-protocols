import type { CryptoSwapPoolInfo, CryptoSwapPoolState, CryptoSwapPoolUpdate, CryptoSwapRuntime } from './types';
export type CryptoSwapReducer<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo> = {
    init(info: I, state: CryptoSwapPoolState): CryptoSwapRuntime<I>;
    applyUpdates(runtime: CryptoSwapRuntime<I>, update: CryptoSwapPoolUpdate): boolean;
};
export declare function createReducer<I extends CryptoSwapPoolInfo = CryptoSwapPoolInfo>(): CryptoSwapReducer<I>;
//# sourceMappingURL=reducer.d.ts.map