import { createQuoter as createStableSwapQuoter } from '../../core/stableswap/quoter';
import { quoteExactIn, quoteMidFeePips as quoteMidFeePipsCommon } from '../common/quoter';
import { resolveEkuboV3Domain } from './domain';

import type { EkuboV3ConcentratedPoolRuntime, EkuboV3PoolRuntime, EkuboV3StablePoolRuntime } from './types';

export type EkuboV3QuoterParams = {
  amountIn: bigint;
  zeroForOne: boolean;
  sqrtRatioLimitX128: bigint;
  runtime: EkuboV3PoolRuntime;
};

export type EkuboV3QuoterReturn = {
  amountOut: bigint;
  sqrtRatioAfterX128: number | bigint;
  tickAfter: number;
  liquidityAfter: bigint;
};

function isStableRuntime(runtime: EkuboV3PoolRuntime): runtime is EkuboV3StablePoolRuntime {
  return runtime.info.poolKind === 'stableswap';
}

function isConcentratedRuntime(runtime: EkuboV3PoolRuntime): runtime is EkuboV3ConcentratedPoolRuntime {
  return runtime.info.poolKind === 'concentrated';
}

export function createQuoter() {
  const stableSwapQuoter = createStableSwapQuoter<EkuboV3StablePoolRuntime['info']>();

  function quote({ runtime, ...params }: EkuboV3QuoterParams): EkuboV3QuoterReturn {
    const domain = resolveEkuboV3Domain({
      poolKind: runtime.info.poolKind,
      extension: runtime.info.extension,
    });
    if (domain !== 'concentrated') {
      if (!isStableRuntime(runtime)) {
        throw new Error(`EkuboV3 domain ${domain} requires a stable runtime.`);
      }
      const stableRuntime = runtime;

      const tokenInIndex = params.zeroForOne ? 0 : 1;
      const tokenOutIndex = params.zeroForOne ? 1 : 0;
      const result = stableSwapQuoter.quote({
        amountIn: params.amountIn,
        tokenInIndex,
        tokenOutIndex,
        balances: stableRuntime.state.balances,
        nCoins: stableRuntime.state.nCoins,
        runtime: stableRuntime,
        ...(stableRuntime.state.fee !== undefined ? { fee: stableRuntime.state.fee } : {}),
        ...(stableRuntime.state.amplification !== undefined
          ? { amplification: stableRuntime.state.amplification }
          : {}),
        ...(stableRuntime.state.amplificationPrecision !== undefined
          ? { amplificationPrecision: stableRuntime.state.amplificationPrecision }
          : {}),
      });

      return {
        amountOut: result.amountOut,
        sqrtRatioAfterX128: runtime.state.sqrtRatioX128,
        tickAfter: runtime.state.tick,
        liquidityAfter: runtime.state.liquidity,
      };
    }

    if (!isConcentratedRuntime(runtime)) {
      throw new Error(`EkuboV3 domain ${domain} requires a concentrated runtime.`);
    }

    if (runtime.info.tickSpacing <= 0) {
      throw new Error(`EkuboV3 domain ${domain} is not supported by the CLMM quoter yet.`);
    }

    // Ekubo v3 extensions change pool identity/config semantics, but the latest Tycho
    // state we consume is still expressed as CLMM liquidity/ticks. We therefore reuse
    // the common exact-in quote path unless a future extension requires extra state.
    return quoteExactIn({
      ...params,
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
