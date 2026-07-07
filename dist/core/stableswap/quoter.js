"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mulDivDown = mulDivDown;
exports.divDown = divDown;
exports.buildStoredRatesStableSwapNg = buildStoredRatesStableSwapNg;
exports.computeStableSwapNgDynamicFee = computeStableSwapNgDynamicFee;
exports.quoteStableSwapNg = quoteStableSwapNg;
exports.createQuoter = createQuoter;
const constants_1 = require("./constants");
function getDefinedAt(values, index, field) {
    const value = values[index];
    if (value === undefined) {
        throw new Error(`Missing ${field} at index=${index}`);
    }
    return value;
}
function pow10(exp) {
    return 10n ** BigInt(exp);
}
function mulDivDown(a, b, denominator) {
    if (denominator <= 0n) {
        throw new Error('mulDivDown denominator must be > 0');
    }
    return (a * b) / denominator;
}
function divDown(value, denominator) {
    if (denominator <= 0n) {
        throw new Error('divDown denominator must be > 0');
    }
    return value / denominator;
}
function buildDefaultStoredRate(decimals) {
    if (decimals === undefined) {
        return constants_1.PRECISION;
    }
    if (decimals === constants_1.DECIMALS_TARGET) {
        return constants_1.PRECISION;
    }
    if (decimals < constants_1.DECIMALS_TARGET) {
        return constants_1.PRECISION * pow10(constants_1.DECIMALS_TARGET - decimals);
    }
    return divDown(constants_1.PRECISION, pow10(decimals - constants_1.DECIMALS_TARGET));
}
function buildStoredRatesStableSwapNg(params) {
    const { runtime, balances, storedRates } = params;
    if (storedRates && storedRates.length >= balances.length) {
        return storedRates.slice(0, balances.length);
    }
    const coinDecimals = params.coinDecimals ?? runtime?.info.coinDecimals;
    // TODO(curve-ng): oracle-backed assets must multiply base rate by fetched oracle rate.
    // TODO(curve-ng): ERC4626 assets must use convertToAssets semantics, not plain decimals scaling.
    // TODO(curve-ng): rebasing asset handling may require pool-specific stored_rates semantics.
    return balances.map((_, index) => {
        return buildDefaultStoredRate(coinDecimals?.[index]);
    });
}
function buildAmplificationStableSwapNg(amplification, amplificationPrecision) {
    if (amplificationPrecision === undefined) {
        return amplification * constants_1.AMPLIFICATION_PRECISION;
    }
    if (amplificationPrecision !== constants_1.AMPLIFICATION_PRECISION) {
        throw new Error(`StableSwap-NG amplificationPrecision must be ${constants_1.AMPLIFICATION_PRECISION.toString()}`);
    }
    return amplification;
}
function getD(xp, amp) {
    const nCoins = BigInt(xp.length);
    const sum = xp.reduce((acc, value) => acc + value, 0n);
    if (sum === 0n) {
        return 0n;
    }
    let D = sum;
    const Ann = amp * nCoins;
    for (let i = 0; i < 255; i += 1) {
        let dP = D;
        for (const x of xp) {
            if (x <= 0n) {
                throw new Error('StableSwap-NG xp entries must be > 0');
            }
            dP = mulDivDown(dP, D, x * nCoins);
        }
        const prevD = D;
        const numerator = (mulDivDown(Ann, sum, constants_1.AMPLIFICATION_PRECISION) + dP * nCoins) * D;
        const denominator = mulDivDown(Ann - constants_1.AMPLIFICATION_PRECISION, D, constants_1.AMPLIFICATION_PRECISION) + (nCoins + 1n) * dP;
        D = divDown(numerator, denominator);
        if (D > prevD ? D - prevD <= 1n : prevD - D <= 1n) {
            return D;
        }
    }
    return D;
}
function getY(params) {
    const { tokenInIndex, tokenOutIndex, x, xp, amp, D } = params;
    const nCoins = xp.length;
    const nCoinsBig = BigInt(nCoins);
    const Ann = amp * nCoinsBig;
    let c = D;
    let sum = 0n;
    for (let idx = 0; idx < nCoins; idx += 1) {
        if (idx === tokenOutIndex) {
            continue;
        }
        const value = idx === tokenInIndex ? x : xp[idx];
        if (value === undefined || value <= 0n) {
            throw new Error('StableSwap-NG balance missing for invariant calculation');
        }
        sum += value;
        c = mulDivDown(c, D, value * nCoinsBig);
    }
    c = mulDivDown(c, D * constants_1.AMPLIFICATION_PRECISION, Ann * nCoinsBig);
    const b = sum + divDown(D * constants_1.AMPLIFICATION_PRECISION, Ann);
    let y = D;
    for (let i = 0; i < 255; i += 1) {
        const prevY = y;
        y = divDown(y * y + c, 2n * y + b - D);
        if (y > prevY ? y - prevY <= 1n : prevY - y <= 1n) {
            return y;
        }
    }
    return y;
}
function computeStableSwapNgDynamicFee(xpi, xpj, baseFee, feeMultiplier) {
    if (feeMultiplier <= constants_1.CURVE_FEE_DENOMINATOR) {
        return baseFee;
    }
    const xps = xpi + xpj;
    if (xps <= 0n) {
        return baseFee;
    }
    const xps2 = xps * xps;
    const denominator = divDown((feeMultiplier - constants_1.CURVE_FEE_DENOMINATOR) * 4n * xpi * xpj, xps2) + constants_1.CURVE_FEE_DENOMINATOR;
    return mulDivDown(feeMultiplier, baseFee, denominator);
}
/**
 * StableSwap-NG plain pool `get_dy(i, j, dx)` semantics.
 *
 * - `xp` is built as `stored_rates[idx] * balances[idx] / 1e18`, not plain decimals normalization.
 * - fee uses StableSwap-NG dynamic fee with `offpeg_fee_multiplier`, applied in xp-space before denormalization.
 * - oracle-backed / ERC4626 / rebasing assets are only approximated until `buildStoredRatesStableSwapNg()` is extended.
 * - metapools and token-level tax semantics are intentionally out of scope here.
 */
function quoteStableSwapNg({ amountIn, tokenInIndex, tokenOutIndex, balances, amplification, amplificationPrecision, fee, offpegFeeMultiplier, storedRates, nCoins, coinDecimals, runtime, }) {
    const reserveIn = balances[tokenInIndex];
    const reserveOut = balances[tokenOutIndex];
    if (amountIn <= 0n) {
        throw new Error('amountIn must be > 0');
    }
    if (tokenInIndex < 0 || tokenOutIndex < 0) {
        throw new Error('Curve token indexes must be >= 0');
    }
    if (tokenInIndex === tokenOutIndex) {
        throw new Error('Curve token indexes must differ');
    }
    if (nCoins <= Math.max(tokenInIndex, tokenOutIndex)) {
        throw new Error('Curve token index out of bounds for nCoins');
    }
    if (reserveIn === undefined || reserveOut === undefined) {
        throw new Error('Curve balances missing for requested token indexes');
    }
    if (reserveIn <= 0n || reserveOut <= 0n) {
        throw new Error('StableSwap reserves must be > 0');
    }
    if (amplification === undefined || amplification <= 0n) {
        throw new Error('StableSwap amplification must be > 0');
    }
    const amp = buildAmplificationStableSwapNg(amplification, amplificationPrecision);
    const rates = buildStoredRatesStableSwapNg({
        balances,
        ...(runtime ? { runtime } : {}),
        ...(storedRates ? { storedRates } : {}),
        ...(coinDecimals ? { coinDecimals } : {}),
    });
    if (rates.length !== balances.length) {
        throw new Error('StableSwap-NG storedRates length mismatch');
    }
    const xp = balances.map((balance, index) => mulDivDown(getDefinedAt(rates, index, 'stableSwapNg rate'), balance, constants_1.PRECISION));
    const D = getD(xp, amp);
    const xpIn = getDefinedAt(xp, tokenInIndex, 'stableSwapNg xp');
    const xpOut = getDefinedAt(xp, tokenOutIndex, 'stableSwapNg xp');
    const rateIn = getDefinedAt(rates, tokenInIndex, 'stableSwapNg rate');
    const rateOut = getDefinedAt(rates, tokenOutIndex, 'stableSwapNg rate');
    const x = xpIn + mulDivDown(amountIn, rateIn, constants_1.PRECISION);
    const y = getY({
        tokenInIndex,
        tokenOutIndex,
        x,
        xp,
        amp,
        D,
    });
    const dyRaw = xpOut - y - 1n;
    const xAvg = divDown(xpIn + x, 2n);
    const yAvg = divDown(xpOut + y, 2n);
    // Curve's dynamic_fee(i, j) getter uses current xp[i]/xp[j], but get_dy parity is closer when midpoint values are used.
    const dynamicFee = computeStableSwapNgDynamicFee(xAvg, yAvg, fee ?? 0n, offpegFeeMultiplier ?? constants_1.CURVE_FEE_DENOMINATOR);
    const feeAmount = mulDivDown(dynamicFee, dyRaw, constants_1.CURVE_FEE_DENOMINATOR);
    const dyNet = dyRaw - feeAmount;
    const amountOut = mulDivDown(dyNet, constants_1.PRECISION, rateOut);
    if (amountOut <= 0n) {
        throw new Error('amountOut <= 0');
    }
    if (amountOut >= reserveOut) {
        throw new Error('amountOut >= reserveOut');
    }
    const nextBalances = [...balances];
    nextBalances[tokenInIndex] = reserveIn + amountIn;
    nextBalances[tokenOutIndex] = reserveOut - amountOut;
    return { amountOut, balancesAfter: nextBalances };
}
function createQuoter() {
    function quote(params) {
        return quoteStableSwapNg(params);
    }
    return { quote };
}
//# sourceMappingURL=quoter.js.map