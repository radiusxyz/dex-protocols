export class LPFeeLibrary {
  static DYNAMIC_FEE_FLAG = 0x800000n;
  static OVERRIDE_FEE_FLAG = 0x400000n;
  static REMOVE_OVERRIDE_MASK = 0xbfffffn;
  static MAX_LP_FEE = 1_000_000n;

  static isDynamicFee(fee: bigint): boolean {
    return fee === LPFeeLibrary.DYNAMIC_FEE_FLAG;
  }

  static isValid(fee: bigint): boolean {
    return fee <= LPFeeLibrary.MAX_LP_FEE;
  }

  static validate(fee: bigint): void {
    if (!LPFeeLibrary.isValid(fee)) {
      throw new Error(`LPFeeTooLarge: ${fee.toString()}`);
    }
  }

  static getInitialLPFee(fee: bigint): bigint {
    if (LPFeeLibrary.isDynamicFee(fee)) {
      return 0n;
    }
    LPFeeLibrary.validate(fee);
    return fee;
  }

  static isOverride(fee: bigint): boolean {
    return (fee & LPFeeLibrary.OVERRIDE_FEE_FLAG) !== 0n;
  }

  static removeOverrideFlag(fee: bigint): bigint {
    return fee & LPFeeLibrary.REMOVE_OVERRIDE_MASK;
  }

  static removeOverrideFlagAndValidate(fee: bigint): bigint {
    const newFee = LPFeeLibrary.removeOverrideFlag(fee);
    LPFeeLibrary.validate(newFee);
    return newFee;
  }
}
