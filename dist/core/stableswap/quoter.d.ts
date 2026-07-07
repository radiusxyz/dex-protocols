import type { Addr } from '../../types/index';
import type { StableSwapPoolInfo, StableSwapRuntime } from './types';
export type StableSwapQuoterParams<I extends StableSwapPoolInfo = StableSwapPoolInfo> = {
    amountIn: bigint;
    runtime?: StableSwapRuntime<I>;
    tokenInIndex: number;
    tokenOutIndex: number;
    balances: bigint[];
    amplification?: bigint;
    amplificationPrecision?: bigint;
    fee?: bigint;
    offpegFeeMultiplier?: bigint;
    storedRates?: bigint[];
    assetTypes?: number[];
    oracleRates?: bigint[];
    isErc4626?: boolean[];
    nCoins: number;
    tokenIn?: Addr;
    tokenOut?: Addr;
    coins?: Addr[];
    coinDecimals?: number[];
    zeroForOne?: boolean;
};
export type StableSwapQuoterReturn = {
    amountOut: bigint;
    balancesAfter: bigint[];
};
export declare function mulDivDown(a: bigint, b: bigint, denominator: bigint): bigint;
export declare function divDown(value: bigint, denominator: bigint): bigint;
export declare function buildStoredRatesStableSwapNg<I extends StableSwapPoolInfo = StableSwapPoolInfo>(params: {
    runtime?: StableSwapRuntime<I>;
    balances: bigint[];
    storedRates?: bigint[];
    coinDecimals?: number[];
}): bigint[];
export declare function computeStableSwapNgDynamicFee(xpi: bigint, xpj: bigint, baseFee: bigint, feeMultiplier: bigint): bigint;
/**
 * StableSwap-NG plain pool `get_dy(i, j, dx)` semantics.
 *
 * - `xp` is built as `stored_rates[idx] * balances[idx] / 1e18`, not plain decimals normalization.
 * - fee uses StableSwap-NG dynamic fee with `offpeg_fee_multiplier`, applied in xp-space before denormalization.
 * - oracle-backed / ERC4626 / rebasing assets are only approximated until `buildStoredRatesStableSwapNg()` is extended.
 * - metapools and token-level tax semantics are intentionally out of scope here.
 */
export declare function quoteStableSwapNg<I extends StableSwapPoolInfo = StableSwapPoolInfo>({ amountIn, tokenInIndex, tokenOutIndex, balances, amplification, amplificationPrecision, fee, offpegFeeMultiplier, storedRates, nCoins, coinDecimals, runtime, }: StableSwapQuoterParams<I>): StableSwapQuoterReturn;
export declare function createQuoter<I extends StableSwapPoolInfo = StableSwapPoolInfo>(): {
    quote: (params: StableSwapQuoterParams<I>) => StableSwapQuoterReturn;
};
//# sourceMappingURL=quoter.d.ts.map