export declare class SqrtPriceMath {
    static getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96: bigint, liquidity: bigint, amount: bigint, add: boolean): bigint;
    static getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96: bigint, liquidity: bigint, amount: bigint, add: boolean): bigint;
    static getNextSqrtPriceFromInput(sqrtPX96: bigint, liquidity: bigint, amountIn: bigint, zeroForOne: boolean): bigint;
    static getNextSqrtPriceFromOutput(sqrtPX96: bigint, liquidity: bigint, amountOut: bigint, zeroForOne: boolean): bigint;
    static getAmount0Delta(sqrtPriceAX96: bigint, sqrtPriceBX96: bigint, liquidity: bigint, roundUp: boolean): bigint;
    static getAmount1Delta(sqrtPriceAX96: bigint, sqrtPriceBX96: bigint, liquidity: bigint, roundUp: boolean): bigint;
}
//# sourceMappingURL=SqrtPriceMath.d.ts.map