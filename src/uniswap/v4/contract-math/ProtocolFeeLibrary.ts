export class ProtocolFeeLibrary {
  static MAX_PROTOCOL_FEE = 1_000n;
  static FEE_0_THRESHOLD = 1_001n;
  static FEE_1_THRESHOLD = 1_001n << 12n;
  static PIPS_DENOMINATOR = 1_000_000n;

  static getZeroForOneFee(protocolFee: bigint): bigint {
    return BigInt(Number(protocolFee) & 0xfff);
  }

  static getOneForZeroFee(protocolFee: bigint): bigint {
    return protocolFee >> 12n;
  }

  static isValidProtocolFee(protocolFee: bigint): boolean {
    const isZeroForOneFeeOk = (protocolFee & 0xfffn) < ProtocolFeeLibrary.FEE_0_THRESHOLD;
    const isOneForZeroFeeOk = (protocolFee & 0xfff000n) < ProtocolFeeLibrary.FEE_1_THRESHOLD;
    return isZeroForOneFeeOk && isOneForZeroFeeOk;
  }

  static calculateSwapFee(protocolFee: bigint, lpFee: bigint): bigint {
    protocolFee &= 0xfffn;
    lpFee &= 0xffffffn;
    const numerator = protocolFee * lpFee;
    return protocolFee + lpFee - numerator / ProtocolFeeLibrary.PIPS_DENOMINATOR;
  }
}
