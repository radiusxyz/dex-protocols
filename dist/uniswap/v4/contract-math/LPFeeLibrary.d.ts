export declare class LPFeeLibrary {
    static DYNAMIC_FEE_FLAG: bigint;
    static OVERRIDE_FEE_FLAG: bigint;
    static REMOVE_OVERRIDE_MASK: bigint;
    static MAX_LP_FEE: bigint;
    static isDynamicFee(fee: bigint): boolean;
    static isValid(fee: bigint): boolean;
    static validate(fee: bigint): void;
    static getInitialLPFee(fee: bigint): bigint;
    static isOverride(fee: bigint): boolean;
    static removeOverrideFlag(fee: bigint): bigint;
    static removeOverrideFlagAndValidate(fee: bigint): bigint;
}
//# sourceMappingURL=LPFeeLibrary.d.ts.map