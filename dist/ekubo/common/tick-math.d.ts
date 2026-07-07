export type BitMapWord = bigint;
export type BitPos = number;
export type WordPos = number;
export declare function decodeEkuboCompactSqrtRatioToX128(sqrtRatio: bigint): bigint;
export declare function compressTickFloor(tick: number, tickSpacing: number): bigint;
export declare function position(compressed: bigint): {
    wordPos: WordPos;
    bitPos: BitPos;
};
export declare function leastSignificantBit(x: bigint): number;
export declare function mostSignificantBit(x: bigint): number;
export declare function getSqrtRatioAtTick(tick: number): bigint;
export declare function getTickAtSqrtRatio(sqrtRatioX128: bigint): number;
export declare function toSqrtRatio(tick: number): bigint;
export declare function buildTickBitmap(args: {
    ticks: Map<number, bigint>;
    tickSpacing: number;
}): Map<number, bigint>;
export declare function setInitializedInBitmap(tickBitmap: Map<number, bigint>, tick: number, tickSpacing: number): void;
export declare function clearInitializedInBitmap(tickBitmap: Map<number, bigint>, tick: number, tickSpacing: number): void;
export declare function nextInitializedTickWithinOneWord(args: {
    tick: number;
    tickSpacing: number;
    lte: boolean;
    tickBitmap: Map<WordPos, BitMapWord>;
}): {
    nextTick: number;
    initialized: boolean;
};
//# sourceMappingURL=tick-math.d.ts.map