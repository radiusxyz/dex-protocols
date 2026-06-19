import { Q96 } from '../../../core/clmm/constants';

import { FullMath } from './FullMath';
import { UnsafeMath } from './UnsafeMath';

const MAX_UINT160 = (1n << 160n) - 1n;
const Q96_RESOLUTION = 96n;

export class SqrtPriceMath {
  static getNextSqrtPriceFromAmount0RoundingUp(
    sqrtPX96: bigint,
    liquidity: bigint,
    amount: bigint,
    add: boolean,
  ): bigint {
    if (amount === 0n) {
      return sqrtPX96;
    }

    const numerator1 = liquidity << Q96_RESOLUTION;

    if (add) {
      const product = amount * sqrtPX96;
      const denominator = numerator1 + product;
      return (numerator1 * sqrtPX96 + denominator - 1n) / denominator;
    }

    const product = amount * sqrtPX96;
    if (product >= numerator1) {
      throw new Error('PriceOverflow');
    }
    const denominator = numerator1 - product;
    return (numerator1 * sqrtPX96 + denominator - 1n) / denominator;
  }

  static getNextSqrtPriceFromAmount1RoundingDown(
    sqrtPX96: bigint,
    liquidity: bigint,
    amount: bigint,
    add: boolean,
  ): bigint {
    if (add) {
      const quotient =
        amount <= MAX_UINT160 ? (amount << Q96_RESOLUTION) / liquidity : FullMath.mulDiv(amount, Q96, liquidity);
      return sqrtPX96 + quotient;
    }

    const quotient =
      amount <= MAX_UINT160
        ? UnsafeMath.divRoundingUp(amount << Q96_RESOLUTION, liquidity)
        : FullMath.mulDivRoundingUp(amount, Q96, liquidity);

    if (sqrtPX96 <= quotient) {
      throw new Error('NotEnoughLiquidity');
    }
    return sqrtPX96 - quotient;
  }

  static getNextSqrtPriceFromInput(sqrtPX96: bigint, liquidity: bigint, amountIn: bigint, zeroForOne: boolean): bigint {
    if (sqrtPX96 === 0n || liquidity === 0n) {
      throw new Error('InvalidPriceOrLiquidity');
    }
    return zeroForOne
      ? SqrtPriceMath.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
      : SqrtPriceMath.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true);
  }

  static getNextSqrtPriceFromOutput(
    sqrtPX96: bigint,
    liquidity: bigint,
    amountOut: bigint,
    zeroForOne: boolean,
  ): bigint {
    if (sqrtPX96 === 0n || liquidity === 0n) {
      throw new Error('InvalidPriceOrLiquidity');
    }
    return zeroForOne
      ? SqrtPriceMath.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountOut, false)
      : SqrtPriceMath.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false);
  }

  static getAmount0Delta(sqrtPriceAX96: bigint, sqrtPriceBX96: bigint, liquidity: bigint, roundUp: boolean): bigint {
    let sqrtA = sqrtPriceAX96;
    let sqrtB = sqrtPriceBX96;
    if (sqrtA > sqrtB) {
      [sqrtA, sqrtB] = [sqrtB, sqrtA];
    }

    const numerator1 = BigInt.asIntN(256, liquidity) << Q96_RESOLUTION;
    const numerator2 = sqrtB - sqrtA;

    return roundUp
      ? UnsafeMath.divRoundingUp(FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtB), sqrtA)
      : FullMath.mulDiv(numerator1, numerator2, sqrtB) / sqrtA;
  }

  static getAmount1Delta(sqrtPriceAX96: bigint, sqrtPriceBX96: bigint, liquidity: bigint, roundUp: boolean): bigint {
    let sqrtA = sqrtPriceAX96;
    let sqrtB = sqrtPriceBX96;
    if (sqrtA > sqrtB) {
      [sqrtA, sqrtB] = [sqrtB, sqrtA];
    }

    const _liquidity = BigInt.asUintN(256, liquidity);
    return roundUp
      ? FullMath.mulDivRoundingUp(_liquidity, sqrtB - sqrtA, Q96)
      : FullMath.mulDiv(_liquidity, sqrtB - sqrtA, Q96);
  }
}
