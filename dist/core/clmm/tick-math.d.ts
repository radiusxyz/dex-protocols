import type { BitMapWord, BitPos, WordPos } from './types';
export declare function compressTickFloor(tick: number, tickSpacing: number): bigint;
export declare function position(compressed: bigint): {
    wordPos: WordPos;
    bitPos: BitPos;
};
export declare function leastSignificantBit(x: bigint): number;
export declare function mostSignificantBit(x: bigint): number;
export declare function getSqrtRatioAtTick(tick: number): bigint;
export declare function getTickAtSqrtRatio(sqrtRatioX96: bigint): number;
export declare function buildTickBitmap(args: {
    ticks: Map<number, bigint>;
    tickSpacing: number;
}): Map<number, bigint>;
export declare function setInitializedInBitmap(tickBitmap: Map<number, bigint>, tick: number, tickSpacing: number): void;
export declare function clearInitializedInBitmap(tickBitmap: Map<number, bigint>, tick: number, tickSpacing: number): void;
/**
 * Uniswap V3 core-style "next initialized tick within one word".
 *
 * - If lte=true: returns the greatest initialized tick <= tick within the same 256-bit word,
 *   else returns the word minimum boundary (initialized=false).
 * - If lte=false: returns the smallest initialized tick > tick within the same 256-bit word,
 *   else returns the word maximum boundary (initialized=false).
 */
export declare function nextInitializedTickWithinOneWord(args: {
    tick: number;
    tickSpacing: number;
    lte: boolean;
    tickBitmap: Map<WordPos, BitMapWord>;
}): {
    nextTick: number;
    initialized: boolean;
};
export declare function nextInitializedTick(args: {
    tick: number;
    tickSpacing: number;
    zeroForOne: boolean;
    tickBitmap: Map<number, bigint>;
}): {
    nextTick: number;
    initialized: boolean;
};
//# sourceMappingURL=tick-math.d.ts.map