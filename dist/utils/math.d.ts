export declare function mulDiv(a: bigint, b: bigint, den: bigint): bigint;
export declare function mulDivRoundingUp(a: bigint, b: bigint, den: bigint): bigint;
export declare function divRoundingUp(x: bigint, d: bigint): bigint;
export declare function divFloor(a: number, b: number): number;
export declare function pow10(n: number): bigint;
type Ratio = {
    n: bigint;
    d: bigint;
};
export declare function applyRatiosFloor(x: bigint, ratios: Ratio[]): bigint;
export {};
//# sourceMappingURL=math.d.ts.map