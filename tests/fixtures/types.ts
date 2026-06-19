export type QuoteFixture = {
  protocolId: string;
  chainId: number;
  blockNumber: string;
  pool: `0x${string}`;
  info: unknown;
  state: unknown;
  quotes: QuoteCaseFixture[];
};

export type QuoteCaseFixture = {
  zeroForOne: boolean;
  amountIn: string;
  sqrtPriceLimitX96?: string;
  blockTimestamp?: number;
  secondsAgo?: number;
  defaultBaseFee?: number;
  expected: {
    amountOut: string;
    sqrtPriceAfterX96?: string;
    tickAfter?: number;
    liquidityAfter?: string;
  };
};

export function reviveBigint(value: string, fieldName: string): bigint {
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`${fieldName} must be a decimal integer string`);
  }
  return BigInt(value);
}
