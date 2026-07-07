"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolFeeLibrary = void 0;
class ProtocolFeeLibrary {
    static MAX_PROTOCOL_FEE = 1000n;
    static FEE_0_THRESHOLD = 1001n;
    static FEE_1_THRESHOLD = 1001n << 12n;
    static PIPS_DENOMINATOR = 1000000n;
    static getZeroForOneFee(protocolFee) {
        return BigInt(Number(protocolFee) & 0xfff);
    }
    static getOneForZeroFee(protocolFee) {
        return protocolFee >> 12n;
    }
    static isValidProtocolFee(protocolFee) {
        const isZeroForOneFeeOk = (protocolFee & 0xfffn) < ProtocolFeeLibrary.FEE_0_THRESHOLD;
        const isOneForZeroFeeOk = (protocolFee & 0xfff000n) < ProtocolFeeLibrary.FEE_1_THRESHOLD;
        return isZeroForOneFeeOk && isOneForZeroFeeOk;
    }
    static calculateSwapFee(protocolFee, lpFee) {
        protocolFee &= 0xfffn;
        lpFee &= 0xffffffn;
        const numerator = protocolFee * lpFee;
        return protocolFee + lpFee - numerator / ProtocolFeeLibrary.PIPS_DENOMINATOR;
    }
}
exports.ProtocolFeeLibrary = ProtocolFeeLibrary;
//# sourceMappingURL=ProtocolFeeLibrary.js.map