"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceGetYTwoCryptoNg = traceGetYTwoCryptoNg;
exports.computeTwoCryptoNgDynamicFee = computeTwoCryptoNgDynamicFee;
exports.analyzeTwoCryptoNgQuote = analyzeTwoCryptoNgQuote;
exports.quoteTwoCryptoNg = quoteTwoCryptoNg;
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
function sqrtBigInt(value) {
    if (value < 0n) {
        throw new Error('sqrtBigInt requires value >= 0');
    }
    if (value < 2n) {
        return value;
    }
    let x0 = value;
    let x1 = (x0 + value / x0) / 2n;
    while (x1 < x0) {
        x0 = x1;
        x1 = (x0 + value / x0) / 2n;
    }
    return x0;
}
function absDiff(a, b) {
    return a > b ? a - b : b - a;
}
function absBigInt(value) {
    return value < 0n ? -value : value;
}
function maxBigInt(a, b) {
    return a > b ? a : b;
}
function minBigInt(a, b) {
    return a < b ? a : b;
}
function log2BigInt(value, roundup) {
    if (value <= 0n) {
        return 0n;
    }
    const result = BigInt(value.toString(2).length - 1);
    return roundup && 1n << result < value ? result + 1n : result;
}
function cbrtBigInt(value) {
    if (value < 0n) {
        throw new Error('cbrtBigInt requires value >= 0');
    }
    if (value < 2n) {
        return value;
    }
    let xx = 0n;
    const threshold = 115792089237316195423570985008687907853269n;
    if (value >= threshold * constants_1.PRECISION) {
        xx = value;
    }
    else if (value >= threshold) {
        xx = value * constants_1.PRECISION;
    }
    else {
        xx = value * constants_1.PRECISION * constants_1.PRECISION;
    }
    const log2x = log2BigInt(xx, false);
    const remainder = log2x % 3n;
    let a = (2n ** (log2x / 3n) * 1260n ** remainder) / 1000n ** remainder;
    for (let i = 0; i < 7; i += 1) {
        a = (2n * a + xx / (a * a)) / 3n;
    }
    if (value >= threshold * constants_1.PRECISION) {
        return a * 10n ** 12n;
    }
    if (value >= threshold) {
        return a * 10n ** 6n;
    }
    return a;
}
function cbrtSignedBigInt(value) {
    return value < 0n ? -cbrtBigInt(-value) : cbrtBigInt(value);
}
function buildPrecisionMultiplier(decimals, explicitPrecision) {
    if (explicitPrecision !== undefined) {
        if (explicitPrecision <= 0n) {
            throw new Error('TwoCrypto-NG precision multiplier must be > 0');
        }
        return explicitPrecision;
    }
    if (decimals === undefined || decimals === constants_1.DECIMALS_TARGET) {
        return 1n;
    }
    if (decimals < constants_1.DECIMALS_TARGET) {
        return pow10(constants_1.DECIMALS_TARGET - decimals);
    }
    throw new Error('TwoCrypto-NG decimals > 18 require explicit pool precisions');
}
function buildLegacyPrecisionTuple(coinDecimals, precisions) {
    const p0 = buildPrecisionMultiplier(coinDecimals?.[0], precisions?.[0]);
    const p1 = buildPrecisionMultiplier(coinDecimals?.[1], precisions?.[1]);
    return [p0, p1];
}
function normalizeByDecimalsOnly(amount, decimals, explicitPrecision) {
    return amount * buildPrecisionMultiplier(decimals, explicitPrecision);
}
function buildCryptoAmplification(amplification, amplificationPrecision) {
    if (amplification === undefined || amplification <= 0n) {
        throw new Error('TwoCrypto-NG amplification must be > 0');
    }
    if (amplificationPrecision === undefined) {
        return amplification;
    }
    if (amplificationPrecision !== constants_1.AMPLIFICATION_PRECISION) {
        throw new Error(`TwoCrypto-NG amplificationPrecision must be ${constants_1.AMPLIFICATION_PRECISION.toString()}`);
    }
    return amplification;
}
function scaleForIndex(index, priceScale, priceOracle, lastPrices) {
    if (index === 0) {
        return constants_1.PRECISION;
    }
    return priceScale?.[index - 1] ?? priceOracle?.[index - 1] ?? lastPrices?.[index - 1] ?? constants_1.PRECISION;
}
function buildEffectivePriceScales(balances, coinDecimals, precisions, priceScale, priceOracle, lastPrices) {
    const existing = [constants_1.PRECISION];
    const explicitScale = scaleForIndex(1, priceScale, priceOracle, lastPrices);
    if (explicitScale !== constants_1.PRECISION ||
        priceScale?.[0] !== undefined ||
        priceOracle?.[0] !== undefined ||
        lastPrices?.[0] !== undefined) {
        existing.push(explicitScale);
        return existing;
    }
    const base0 = normalizeByDecimalsOnly(balances[0] ?? 0n, coinDecimals?.[0], precisions?.[0]);
    const base1 = normalizeByDecimalsOnly(balances[1] ?? 0n, coinDecimals?.[1], precisions?.[1]);
    if (base0 > 0n && base1 > 0n) {
        existing.push(mulDivDown(base0, constants_1.PRECISION, base1));
        return existing;
    }
    existing.push(constants_1.PRECISION);
    return existing;
}
function normalizeCoinToXp(amount, index, coinDecimals, precisions, effectivePriceScales) {
    const precisionMultiplier = buildPrecisionMultiplier(coinDecimals?.[index], precisions?.[index]);
    const scaled = amount * precisionMultiplier;
    return mulDivDown(scaled, effectivePriceScales[index] ?? constants_1.PRECISION, constants_1.PRECISION);
}
function denormalizeXpToCoin(amount, index, coinDecimals, precisions, effectivePriceScales) {
    const scale = effectivePriceScales[index] ?? constants_1.PRECISION;
    const precisionMultiplier = buildPrecisionMultiplier(coinDecimals?.[index], precisions?.[index]);
    const unscaled = mulDivDown(amount, constants_1.PRECISION, scale);
    return divDown(unscaled, precisionMultiplier);
}
function denormalizeXpToCoinUp(amount, index, coinDecimals, precisions, effectivePriceScales) {
    const scale = effectivePriceScales[index] ?? constants_1.PRECISION;
    const precisionMultiplier = buildPrecisionMultiplier(coinDecimals?.[index], precisions?.[index]);
    const unscaledNumerator = amount * constants_1.PRECISION;
    const unscaled = divDown(unscaledNumerator + scale - 1n, scale);
    return divDown(unscaled + precisionMultiplier - 1n, precisionMultiplier);
}
function assertTwoCryptoMathBounds(amp, gamma) {
    if (amp < constants_1.MIN_A || amp > constants_1.MAX_A) {
        throw new Error('TwoCrypto-NG amplification out of bounds');
    }
    if (gamma < constants_1.MIN_GAMMA || gamma > constants_1.MAX_GAMMA) {
        throw new Error('TwoCrypto-NG gamma out of bounds');
    }
}
function clampGammaForMath(gamma) {
    return minBigInt(maxBigInt(gamma, constants_1.MIN_GAMMA), constants_1.MAX_GAMMA);
}
function computeTwoCryptoLimMul(gamma) {
    let limMul = 100n * constants_1.WAD;
    if (gamma > constants_1.MAX_GAMMA_SMALL) {
        limMul = mulDivDown(limMul, constants_1.MAX_GAMMA_SMALL, gamma);
    }
    return limMul;
}
function computeTwoCryptoTraceDivider(threshold) {
    if (threshold > 10n ** 48n) {
        return 10n ** 30n;
    }
    if (threshold > 10n ** 46n) {
        return 10n ** 28n;
    }
    if (threshold > 10n ** 44n) {
        return 10n ** 26n;
    }
    if (threshold > 10n ** 42n) {
        return 10n ** 24n;
    }
    if (threshold > 10n ** 40n) {
        return 10n ** 22n;
    }
    if (threshold > 10n ** 38n) {
        return 10n ** 20n;
    }
    if (threshold > 10n ** 36n) {
        return 10n ** 18n;
    }
    if (threshold > 10n ** 34n) {
        return 10n ** 16n;
    }
    if (threshold > 10n ** 32n) {
        return 10n ** 14n;
    }
    if (threshold > 10n ** 30n) {
        return 10n ** 12n;
    }
    if (threshold > 10n ** 28n) {
        return 10n ** 10n;
    }
    if (threshold > 10n ** 26n) {
        return 10n ** 8n;
    }
    if (threshold > 10n ** 24n) {
        return 10n ** 6n;
    }
    if (threshold > 10n ** 20n) {
        return 10n ** 2n;
    }
    return 1n;
}
function newtonDTwoCryptoNg(xp, amp, gamma, k0Prev = 0n) {
    const boundedGamma = clampGammaForMath(gamma);
    assertTwoCryptoMathBounds(amp, boundedGamma);
    const x0 = xp[0];
    const x1 = xp[1];
    if (x0 === undefined || x1 === undefined || x0 <= 0n || x1 <= 0n) {
        throw new Error('TwoCrypto-NG requires two positive balances');
    }
    const x = x0 >= x1 ? [x0, x1] : [x1, x0];
    const S = x[0] + x[1];
    let D = k0Prev === 0n ? constants_1.N_COINS * sqrtBigInt(x[0] * x[1]) : sqrtBigInt(((4n * x[0] * x[1]) / k0Prev) * constants_1.WAD);
    if (k0Prev !== 0n && S < D) {
        D = S;
    }
    const g1k0Base = boundedGamma + constants_1.WAD;
    for (let i = 0; i < 255; i += 1) {
        const prevD = D;
        if (D <= 0n) {
            throw new Error('TwoCrypto-NG D==0');
        }
        const K0 = (((constants_1.WAD * constants_1.N_COINS ** 2n * x[0]) / D) * x[1]) / D;
        const g1k0 = absDiff(g1k0Base, K0) + 1n;
        const mul1 = (((((constants_1.WAD * D) / boundedGamma) * g1k0) / boundedGamma) * g1k0 * constants_1.A_MULTIPLIER) / amp;
        const mul2 = (2n * constants_1.WAD * constants_1.N_COINS * K0) / g1k0;
        const negFprime = S + (S * mul2) / constants_1.WAD + (mul1 * constants_1.N_COINS) / K0 - (mul2 * D) / constants_1.WAD;
        const DPlus = (D * (negFprime + S)) / negFprime;
        let DMinus = (D * D) / negFprime;
        if (constants_1.WAD > K0) {
            DMinus += (((D * (mul1 / negFprime)) / constants_1.WAD) * (constants_1.WAD - K0)) / K0;
        }
        else {
            DMinus -= (((D * (mul1 / negFprime)) / constants_1.WAD) * (K0 - constants_1.WAD)) / K0;
        }
        D = DPlus > DMinus ? DPlus - DMinus : (DMinus - DPlus) / 2n;
        const diff = absDiff(D, prevD);
        if (diff * 10n ** 14n < maxBigInt(10n ** 16n, D)) {
            return D;
        }
    }
    throw new Error('TwoCrypto-NG newton_D did not converge');
}
function newtonYTwoCryptoNg(amp, gamma, xp, D, index, initialY) {
    const boundedGamma = clampGammaForMath(gamma);
    const xj = xp[1 - index];
    if (xj === undefined || xj <= 0n) {
        throw new Error('TwoCrypto-NG invalid x[j]');
    }
    let y = initialY ?? (D * D) / (xj * constants_1.N_COINS ** 2n);
    const K0i = (constants_1.WAD * constants_1.N_COINS * xj) / D;
    const convergenceLimit = maxBigInt(maxBigInt(xj / 10n ** 14n, D / 10n ** 14n), 100n);
    for (let i = 0; i < 255; i += 1) {
        const prevY = y;
        const K0 = (K0i * y * constants_1.N_COINS) / D;
        const S = xj + y;
        const g1k0 = absDiff(boundedGamma + constants_1.WAD, K0) + 1n;
        const mul1 = (((((constants_1.WAD * D) / boundedGamma) * g1k0) / boundedGamma) * g1k0 * constants_1.A_MULTIPLIER) / amp;
        const mul2 = constants_1.WAD + (2n * constants_1.WAD * K0) / g1k0;
        let yfprime = constants_1.WAD * y + S * mul2 + mul1;
        const dyfprime = D * mul2;
        if (yfprime < dyfprime) {
            y = prevY / 2n;
            continue;
        }
        yfprime -= dyfprime;
        const fprime = yfprime / y;
        let yMinus = mul1 / fprime;
        const yPlus = (yfprime + constants_1.WAD * D) / fprime + (yMinus * constants_1.WAD) / K0;
        yMinus += (constants_1.WAD * S) / fprime;
        y = yPlus < yMinus ? prevY / 2n : yPlus - yMinus;
        const diff = absDiff(y, prevY);
        if (diff < maxBigInt(convergenceLimit, y / 10n ** 14n)) {
            return y;
        }
    }
    throw new Error('TwoCrypto-NG newton_y did not converge');
}
function getYTwoCryptoNg(amp, gamma, xp, D, index) {
    const boundedGamma = clampGammaForMath(gamma);
    assertTwoCryptoMathBounds(amp, boundedGamma);
    const trace = traceGetYTwoCryptoNg(amp, boundedGamma, xp, D, index);
    if (trace.y === undefined || trace.frac === undefined || trace.fallbackReason) {
        return newtonYTwoCryptoNg(amp, boundedGamma, xp, D, index);
    }
    if (trace.frac < 10n ** 36n / constants_1.N_COINS / trace.limMul || trace.frac > trace.limMul / constants_1.N_COINS) {
        return newtonYTwoCryptoNg(amp, boundedGamma, xp, D, index);
    }
    return trace.y;
}
function traceGetYTwoCryptoNg(amp, gamma, xp, D, index) {
    const boundedGamma = clampGammaForMath(gamma);
    assertTwoCryptoMathBounds(amp, boundedGamma);
    const limMul = computeTwoCryptoLimMul(boundedGamma);
    const xj = xp[1 - index];
    if (xj === undefined || xj <= 0n) {
        return {
            limMul,
            xj: 0n,
            k0i: 0n,
            annGamma2: 0n,
            a: 0n,
            b: 0n,
            c: 0n,
            d: 0n,
            delta0: 0n,
            delta1: 0n,
            divider: 1n,
            sqrtArg: 0n,
            fallbackReason: 'invalid-xj',
        };
    }
    const k0i = (constants_1.WAD * constants_1.N_COINS * xj) / D;
    const annGamma2 = amp * boundedGamma * boundedGamma;
    let a = 10n ** 32n;
    let b = (D * annGamma2) / 400000000n / xj - 3n * 10n ** 32n - 2n * boundedGamma * 10n ** 14n;
    let c = 3n * 10n ** 32n +
        4n * boundedGamma * 10n ** 14n +
        (boundedGamma * boundedGamma) / 10n ** 4n +
        (((4n * annGamma2) / 400000000n) * xj) / D -
        (4n * annGamma2) / 400000000n;
    let d = -((constants_1.WAD + boundedGamma) ** 2n / 10n ** 4n);
    if (k0i < 10n ** 36n / limMul || k0i > limMul) {
        return {
            limMul,
            xj,
            k0i,
            annGamma2,
            a,
            b,
            c,
            d,
            delta0: 0n,
            delta1: 0n,
            divider: 1n,
            sqrtArg: 0n,
            fallbackReason: 'k0i-out-of-range',
        };
    }
    if (b === 0n) {
        return {
            limMul,
            xj,
            k0i,
            annGamma2,
            a,
            b,
            c,
            d,
            delta0: 0n,
            delta1: 0n,
            divider: 1n,
            sqrtArg: 0n,
            fallbackReason: 'zero-b',
        };
    }
    let delta0 = (3n * a * c) / b - b;
    let delta1 = 3n * delta0 + b - (((27n * a * a) / b) * d) / b;
    const threshold = minBigInt(minBigInt(absBigInt(delta0), absBigInt(delta1)), a);
    const divider = computeTwoCryptoTraceDivider(threshold);
    a /= divider;
    b /= divider;
    c /= divider;
    d /= divider;
    if (b === 0n) {
        return {
            limMul,
            xj,
            k0i,
            annGamma2,
            a,
            b,
            c,
            d,
            delta0,
            delta1,
            divider,
            sqrtArg: 0n,
            fallbackReason: 'zero-b-after-divider',
        };
    }
    delta0 = (3n * a * c) / b - b;
    delta1 = 3n * delta0 + b - (((27n * a * a) / b) * d) / b;
    const sqrtArg = delta1 * delta1 + ((4n * delta0 * delta0) / b) * delta0;
    if (sqrtArg <= 0n) {
        return {
            limMul,
            xj,
            k0i,
            annGamma2,
            a,
            b,
            c,
            d,
            delta0,
            delta1,
            divider,
            sqrtArg,
            fallbackReason: 'non-positive-sqrt-arg',
        };
    }
    const sqrtVal = sqrtBigInt(sqrtArg);
    const bCbrt = cbrtSignedBigInt(b);
    const secondCbrt = delta1 > 0n ? cbrtBigInt((delta1 + sqrtVal) / 2n) : -cbrtBigInt((sqrtVal - delta1) / 2n);
    const c1 = (((bCbrt * bCbrt) / constants_1.WAD) * secondCbrt) / constants_1.WAD;
    if (c1 === 0n || a === 0n) {
        return {
            limMul,
            xj,
            k0i,
            annGamma2,
            a,
            b,
            c,
            d,
            delta0,
            delta1,
            divider,
            sqrtArg,
            sqrtVal,
            bCbrt,
            secondCbrt,
            c1,
            fallbackReason: 'zero-c1-or-a',
        };
    }
    const root = (constants_1.WAD * c1 - constants_1.WAD * b - ((constants_1.WAD * b) / c1) * delta0) / (3n * a);
    const y = (((D * D) / xj) * root) / 4n / constants_1.WAD;
    const frac = (y * constants_1.WAD) / D;
    return {
        limMul,
        xj,
        k0i,
        annGamma2,
        a,
        b,
        c,
        d,
        delta0,
        delta1,
        divider,
        sqrtArg,
        sqrtVal,
        bCbrt,
        secondCbrt,
        c1,
        root,
        y,
        frac,
    };
}
function getYTwoCryptoLegacy(amp, gamma, xp, D, index) {
    const boundedGamma = clampGammaForMath(gamma);
    assertTwoCryptoMathBounds(amp, boundedGamma);
    return newtonYTwoCryptoNg(amp, boundedGamma, xp, D, index);
}
function computeTwoCryptoNgDynamicFee(xp, midFee, outFee, feeGamma) {
    if (outFee <= midFee) {
        return midFee;
    }
    const x = xp[0];
    const y = xp[1];
    if (x === undefined || y === undefined) {
        throw new Error('TwoCrypto-NG xp missing');
    }
    const sum = x + y;
    const balanceTerm = (((constants_1.WAD * constants_1.N_COINS ** constants_1.N_COINS * x) / sum) * y) / sum;
    const feeBlend = (feeGamma * constants_1.WAD) / (feeGamma + constants_1.WAD - balanceTerm);
    return (midFee * feeBlend + outFee * (constants_1.WAD - feeBlend)) / constants_1.WAD;
}
function prepareTwoCryptoNgState(params) {
    const amp = buildCryptoAmplification(params.amplification, params.amplificationPrecision);
    const gamma = params.gamma ?? constants_1.GAMMA_PRECISION / 2n;
    const effectivePriceScales = buildEffectivePriceScales(params.balances, params.coinDecimals, params.precisions, params.priceScale, params.priceOracle, params.lastPrices);
    const xp = params.balances.map((balance, index) => normalizeCoinToXp(balance, index, params.coinDecimals, params.precisions, effectivePriceScales));
    const shouldRecomputeInvariant = params.futureAGammaTime !== undefined && params.futureAGammaTime > 0n;
    return {
        xp,
        D: !shouldRecomputeInvariant && params.invariant !== undefined && params.invariant > 0n
            ? params.invariant
            : newtonDTwoCryptoNg(xp, amp, gamma),
        amp,
        gamma,
        effectivePriceScales,
    };
}
function analyzeTwoCryptoNgQuote({ amountIn, tokenInIndex, tokenOutIndex, balances, fee, midFee, outFee, feeGamma, amplification, amplificationPrecision, gamma, invariant, currentTimestamp, futureAGammaTime, useLegacyMath, nCoins, coinDecimals, precisions, priceScale, priceOracle, lastPrices, }) {
    if (nCoins !== 2) {
        throw new Error('TwoCrypto quoter expects nCoins === 2');
    }
    if (amountIn <= 0n) {
        throw new Error('amountIn must be > 0');
    }
    if (amplification === undefined || amplification <= 0n) {
        throw new Error('TwoCrypto-NG amplification must be > 0');
    }
    const reserveIn = balances[tokenInIndex];
    const reserveOut = balances[tokenOutIndex];
    if (reserveIn === undefined || reserveOut === undefined) {
        throw new Error('Curve balances missing for requested token indexes');
    }
    if (useLegacyMath) {
        if ((tokenInIndex !== 0 && tokenInIndex !== 1) || (tokenOutIndex !== 0 && tokenOutIndex !== 1)) {
            throw new Error('Legacy TwoCrypto quote expects token indexes 0 or 1');
        }
        const [precision0, precision1] = buildLegacyPrecisionTuple(coinDecimals, precisions);
        const rawPriceScale = priceScale?.[0] ?? priceOracle?.[0] ?? lastPrices?.[0] ?? constants_1.PRECISION;
        const totalPriceScale = rawPriceScale * precision1;
        const xpBeforeRaw = [balances[0] ?? 0n, balances[1] ?? 0n];
        const xpAfterInRaw = [...xpBeforeRaw];
        if (tokenInIndex === 0) {
            xpAfterInRaw[0] += amountIn;
        }
        else {
            xpAfterInRaw[1] += amountIn;
        }
        const normalizedXp = [
            xpAfterInRaw[0] * precision0,
            (xpAfterInRaw[1] * totalPriceScale) / constants_1.PRECISION,
        ];
        const shouldRecomputeInvariant = futureAGammaTime !== undefined && futureAGammaTime > 0n;
        const D = !shouldRecomputeInvariant && invariant !== undefined && invariant > 0n
            ? invariant
            : newtonDTwoCryptoNg([xpBeforeRaw[0] * precision0, (xpBeforeRaw[1] * totalPriceScale) / constants_1.PRECISION], buildCryptoAmplification(amplification, amplificationPrecision), gamma ?? constants_1.GAMMA_PRECISION / 2n);
        const y = getYTwoCryptoLegacy(buildCryptoAmplification(amplification, amplificationPrecision), gamma ?? constants_1.GAMMA_PRECISION / 2n, normalizedXp, D, tokenOutIndex);
        const dyRawNormalized = (tokenOutIndex === 0 ? normalizedXp[0] : normalizedXp[1]) - y - 1n;
        const feeXp = [...normalizedXp];
        if (tokenOutIndex === 0) {
            feeXp[0] = y;
        }
        else {
            feeXp[1] = y;
        }
        const noFeeAmountOut = tokenOutIndex > 0 ? (dyRawNormalized * constants_1.PRECISION) / totalPriceScale : dyRawNormalized / precision0;
        const dynamicFee = computeTwoCryptoNgDynamicFee(feeXp, midFee ?? fee ?? 0n, outFee ?? fee ?? 0n, feeGamma ?? constants_1.GAMMA_PRECISION / 2n);
        const feeAmount = mulDivDown(dynamicFee, noFeeAmountOut, constants_1.FEE_DENOMINATOR);
        const amountOut = noFeeAmountOut - feeAmount;
        const dyNet = tokenOutIndex > 0 ? (amountOut * totalPriceScale) / constants_1.PRECISION : amountOut * precision0;
        const effectivePriceScales = [constants_1.PRECISION, rawPriceScale];
        const dxXp = tokenInIndex > 0 ? (amountIn * totalPriceScale) / constants_1.PRECISION : amountIn * precision0;
        return {
            effectivePriceScales,
            dxXp,
            reserveInXp: tokenInIndex > 0 ? (xpBeforeRaw[1] * totalPriceScale) / constants_1.PRECISION : xpBeforeRaw[0] * precision0,
            reserveOutXp: tokenOutIndex > 0 ? (xpBeforeRaw[1] * totalPriceScale) / constants_1.PRECISION : xpBeforeRaw[0] * precision0,
            xpBefore: [xpBeforeRaw[0] * precision0, (xpBeforeRaw[1] * totalPriceScale) / constants_1.PRECISION],
            xpAfterIn: normalizedXp,
            D,
            y,
            dyRaw: dyRawNormalized,
            dyRawRoundedUp: noFeeAmountOut,
            noFeeAmountOut,
            dynamicFee,
            feeAmount,
            dyNet,
            amountOut,
            amountOutRoundedUp: amountOut,
            denormalizationLoss: 0n,
            amountInRoundTrip: amountIn,
            amountInRoundTripLoss: 0n,
        };
    }
    const prepared = prepareTwoCryptoNgState({
        balances,
        amplification,
        ...(coinDecimals ? { coinDecimals } : {}),
        ...(precisions ? { precisions } : {}),
        ...(priceScale ? { priceScale } : {}),
        ...(priceOracle ? { priceOracle } : {}),
        ...(lastPrices ? { lastPrices } : {}),
        ...(amplificationPrecision !== undefined ? { amplificationPrecision } : {}),
        ...(gamma !== undefined ? { gamma } : {}),
        ...(invariant !== undefined ? { invariant } : {}),
        ...(currentTimestamp !== undefined ? { currentTimestamp } : {}),
        ...(futureAGammaTime !== undefined ? { futureAGammaTime } : {}),
    });
    const dxXp = normalizeCoinToXp(amountIn, tokenInIndex, coinDecimals, precisions, prepared.effectivePriceScales);
    const amountInRoundTrip = denormalizeXpToCoin(dxXp, tokenInIndex, coinDecimals, precisions, prepared.effectivePriceScales);
    const nextXp = [...prepared.xp];
    nextXp[tokenInIndex] = getDefinedAt(nextXp, tokenInIndex, 'twocrypto xp') + dxXp;
    const y = useLegacyMath
        ? getYTwoCryptoLegacy(prepared.amp, prepared.gamma, nextXp, prepared.D, tokenOutIndex)
        : getYTwoCryptoNg(prepared.amp, prepared.gamma, nextXp, prepared.D, tokenOutIndex);
    const dyBeforeRounding = getDefinedAt(nextXp, tokenOutIndex, 'twocrypto xp') - y;
    const dyRaw = dyBeforeRounding - 1n;
    const dyRawRoundedUp = denormalizeXpToCoinUp(dyRaw, tokenOutIndex, coinDecimals, precisions, prepared.effectivePriceScales);
    const feeXp = [...nextXp];
    feeXp[tokenOutIndex] = y;
    const dynamicFee = computeTwoCryptoNgDynamicFee(feeXp, midFee ?? fee ?? 0n, outFee ?? fee ?? 0n, feeGamma ?? constants_1.GAMMA_PRECISION / 2n);
    const noFeeAmountOut = denormalizeXpToCoin(dyRaw, tokenOutIndex, coinDecimals, precisions, prepared.effectivePriceScales);
    const feeAmount = mulDivDown(dynamicFee, noFeeAmountOut, constants_1.FEE_DENOMINATOR);
    const amountOut = noFeeAmountOut - feeAmount;
    const dyNet = normalizeCoinToXp(amountOut, tokenOutIndex, coinDecimals, precisions, prepared.effectivePriceScales);
    const amountOutRoundedUp = amountOut;
    return {
        effectivePriceScales: [...prepared.effectivePriceScales],
        dxXp,
        reserveInXp: prepared.xp[tokenInIndex] ?? 0n,
        reserveOutXp: prepared.xp[tokenOutIndex] ?? 0n,
        xpBefore: [...prepared.xp],
        xpAfterIn: nextXp,
        D: prepared.D,
        y,
        dyRaw,
        dyRawRoundedUp,
        noFeeAmountOut,
        dynamicFee,
        feeAmount,
        dyNet,
        amountOut,
        amountOutRoundedUp,
        denormalizationLoss: amountOutRoundedUp - amountOut,
        amountInRoundTrip,
        amountInRoundTripLoss: amountIn - amountInRoundTrip,
    };
}
function quoteTwoCryptoNg(params) {
    const analysis = analyzeTwoCryptoNgQuote(params);
    const reserveIn = params.balances[params.tokenInIndex];
    const reserveOut = params.balances[params.tokenOutIndex];
    if (reserveIn === undefined || reserveOut === undefined) {
        throw new Error('Curve balances missing for requested token indexes');
    }
    if (analysis.amountOut <= 0n || analysis.amountOut >= reserveOut) {
        throw new Error('amountOut out of bounds');
    }
    const nextBalances = [...params.balances];
    nextBalances[params.tokenInIndex] = reserveIn + params.amountIn;
    nextBalances[params.tokenOutIndex] = reserveOut - analysis.amountOut;
    return {
        amountOut: analysis.amountOut,
        balancesAfter: nextBalances,
        ...(nextBalances[0] !== undefined ? { reserve0: nextBalances[0] } : {}),
        ...(nextBalances[1] !== undefined ? { reserve1: nextBalances[1] } : {}),
    };
}
//# sourceMappingURL=swap-math.js.map