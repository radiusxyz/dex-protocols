import { MAX_UINT256 } from '../../../core/clmm/constants';

export class FullMath {
  static mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
    const result = (a * b) / denominator;
    if (result > MAX_UINT256) {
      throw new Error('FullMath.mulDiv overflow');
    }
    return result;
  }

  static mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
    const result = (a * b + denominator - 1n) / denominator;
    if (result > MAX_UINT256) {
      throw new Error('FullMath.mulDivRoundingUp overflow');
    }
    return result;
  }
}
