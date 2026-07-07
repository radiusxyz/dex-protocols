export declare class ProtocolFeeLibrary {
    static MAX_PROTOCOL_FEE: bigint;
    static FEE_0_THRESHOLD: bigint;
    static FEE_1_THRESHOLD: bigint;
    static PIPS_DENOMINATOR: bigint;
    static getZeroForOneFee(protocolFee: bigint): bigint;
    static getOneForZeroFee(protocolFee: bigint): bigint;
    static isValidProtocolFee(protocolFee: bigint): boolean;
    static calculateSwapFee(protocolFee: bigint, lpFee: bigint): bigint;
}
//# sourceMappingURL=ProtocolFeeLibrary.d.ts.map