"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LPFeeLibrary = void 0;
class LPFeeLibrary {
    static DYNAMIC_FEE_FLAG = 0x800000n;
    static OVERRIDE_FEE_FLAG = 0x400000n;
    static REMOVE_OVERRIDE_MASK = 0xbfffffn;
    static MAX_LP_FEE = 1000000n;
    static isDynamicFee(fee) {
        return fee === LPFeeLibrary.DYNAMIC_FEE_FLAG;
    }
    static isValid(fee) {
        return fee <= LPFeeLibrary.MAX_LP_FEE;
    }
    static validate(fee) {
        if (!LPFeeLibrary.isValid(fee)) {
            throw new Error(`LPFeeTooLarge: ${fee.toString()}`);
        }
    }
    static getInitialLPFee(fee) {
        if (LPFeeLibrary.isDynamicFee(fee)) {
            return 0n;
        }
        LPFeeLibrary.validate(fee);
        return fee;
    }
    static isOverride(fee) {
        return (fee & LPFeeLibrary.OVERRIDE_FEE_FLAG) !== 0n;
    }
    static removeOverrideFlag(fee) {
        return fee & LPFeeLibrary.REMOVE_OVERRIDE_MASK;
    }
    static removeOverrideFlagAndValidate(fee) {
        const newFee = LPFeeLibrary.removeOverrideFlag(fee);
        LPFeeLibrary.validate(newFee);
        return newFee;
    }
}
exports.LPFeeLibrary = LPFeeLibrary;
//# sourceMappingURL=LPFeeLibrary.js.map