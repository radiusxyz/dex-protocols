import { EkuboV2PoolRuntime, Tick } from './types';
import { quoteExactIn, quoteMidFeePips as quoteMidFeePipsCommon } from '../common/quoter';

export type EkuboV2QuoterParams = {
  amountIn: bigint;
  zeroForOne: boolean;
  sqrtRatioLimitX128: bigint;
  runtime: EkuboV2PoolRuntime;
};

export type EkuboV2QuoterReturn = {
  amountOut: bigint;
  sqrtRatioAfterX128: bigint;
  tickAfter: Tick;
  liquidityAfter: bigint;
};

export function createQuoter() {
  function quote({ amountIn, zeroForOne, sqrtRatioLimitX128, runtime }: EkuboV2QuoterParams): EkuboV2QuoterReturn {
    return quoteExactIn({
      amountIn,
      zeroForOne,
      sqrtRatioLimitX128,
      runtime,
    });
  }

  function quoteMidFeePips(
    amountIn: bigint,
    sqrtRatioX128: bigint,
    tokenInIsToken0: boolean,
    feePips: number,
  ): bigint | null {
    return quoteMidFeePipsCommon(amountIn, sqrtRatioX128, tokenInIsToken0, feePips);
  }

  return { quote, quoteMidFeePips };
}
