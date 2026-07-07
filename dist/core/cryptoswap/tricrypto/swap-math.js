"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTriCryptoQuote = analyzeTriCryptoQuote;
exports.quoteTriCrypto = quoteTriCrypto;
const constants_1 = require("./constants");
function getDefinedAt(values, index, field) {
    const value = values[index];
    if (value === undefined) {
        throw new Error(`Missing ${field} at index=${index}`);
    }
    return value;
}
function toTriCryptoTuple(values, field) {
    return [getDefinedAt(values, 0, field), getDefinedAt(values, 1, field), getDefinedAt(values, 2, field)];
}
function pow10(exp) {
    return 10n ** BigInt(exp);
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
    if (value >= threshold * constants_1.WAD) {
        xx = value;
    }
    else if (value >= threshold) {
        xx = value * constants_1.WAD;
    }
    else {
        xx = value * constants_1.WAD * constants_1.WAD;
    }
    const log2x = log2BigInt(xx, false);
    const remainder = log2x % 3n;
    let a = (2n ** (log2x / 3n) * 1260n ** remainder) / 1000n ** remainder;
    for (let i = 0; i < 7; i += 1) {
        a = (2n * a + xx / (a * a)) / 3n;
    }
    if (value >= threshold * constants_1.WAD) {
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
function sortDescending3(values) {
    const x = [...values];
    let temp = x[0];
    if (x[0] < x[1]) {
        x[0] = x[1];
        x[1] = temp;
    }
    if (x[0] < x[2]) {
        temp = x[0];
        x[0] = x[2];
        x[2] = temp;
    }
    if (x[1] < x[2]) {
        temp = x[1];
        x[1] = x[2];
        x[2] = temp;
    }
    return x;
}
function geometricMean3(values) {
    const prod = (((values[0] * values[1]) / constants_1.WAD) * values[2]) / constants_1.WAD;
    return prod === 0n ? 0n : cbrtBigInt(prod);
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
function buildPrecisionMultiplier(decimals) {
    if (decimals === undefined || decimals === constants_1.DECIMALS_TARGET) {
        return constants_1.PRECISION;
    }
    if (decimals < constants_1.DECIMALS_TARGET) {
        return constants_1.PRECISION * pow10(constants_1.DECIMALS_TARGET - decimals);
    }
    return divDown(constants_1.PRECISION, pow10(decimals - constants_1.DECIMALS_TARGET));
}
function normalizeByDecimalsOnly(amount, decimals) {
    return mulDivDown(amount, buildPrecisionMultiplier(decimals), constants_1.PRECISION);
}
function scaleForIndex(index, priceScale, priceOracle, lastPrices) {
    if (index === 0) {
        return constants_1.PRECISION;
    }
    return priceScale?.[index - 1] ?? priceOracle?.[index - 1] ?? lastPrices?.[index - 1] ?? constants_1.PRECISION;
}
function buildEffectivePriceScales(balances, coinDecimals, priceScale, priceOracle, lastPrices) {
    const effective = [constants_1.PRECISION];
    for (let index = 1; index < balances.length; index += 1) {
        const explicitScale = scaleForIndex(index, priceScale, priceOracle, lastPrices);
        if (explicitScale !== constants_1.PRECISION ||
            priceScale?.[index - 1] !== undefined ||
            priceOracle?.[index - 1] !== undefined ||
            lastPrices?.[index - 1] !== undefined) {
            effective.push(explicitScale);
            continue;
        }
        const base0 = normalizeByDecimalsOnly(balances[0] ?? 0n, coinDecimals?.[0]);
        const baseN = normalizeByDecimalsOnly(balances[index] ?? 0n, coinDecimals?.[index]);
        if (base0 > 0n && baseN > 0n) {
            effective.push(mulDivDown(base0, constants_1.PRECISION, baseN));
            continue;
        }
        effective.push(constants_1.PRECISION);
    }
    return effective;
}
function hasExactTriCryptoScaling(precisions, priceScale, nCoins) {
    if (!precisions || precisions.length < nCoins) {
        return false;
    }
    if (nCoins <= 1) {
        return true;
    }
    return !!priceScale && priceScale.length >= nCoins - 1;
}
function buildTriCryptoXpFromRawBalances(rawBalances, precisions, priceScale) {
    const xp = [...rawBalances];
    xp[0] = (xp[0] ?? 0n) * getDefinedAt(precisions, 0, 'tricrypto precision');
    for (let k = 0; k < rawBalances.length - 1; k += 1) {
        xp[k + 1] =
            ((xp[k + 1] ?? 0n) *
                getDefinedAt(priceScale, k, 'tricrypto priceScale') *
                getDefinedAt(precisions, k + 1, 'tricrypto precision')) /
                constants_1.PRECISION;
    }
    return xp;
}
function denormalizeTriCryptoXpToCoin(amount, index, precisions, priceScale) {
    let out = amount;
    if (index > 0) {
        out = (out * constants_1.PRECISION) / getDefinedAt(priceScale, index - 1, 'tricrypto priceScale');
    }
    return out / getDefinedAt(precisions, index, 'tricrypto precision');
}
function denormalizeTriCryptoXpToCoinUp(amount, index, precisions, priceScale) {
    let out = amount;
    if (index > 0) {
        const scale = getDefinedAt(priceScale, index - 1, 'tricrypto priceScale');
        out = (out * constants_1.PRECISION + scale - 1n) / scale;
    }
    const precision = getDefinedAt(precisions, index, 'tricrypto precision');
    return (out + precision - 1n) / precision;
}
function applyLegacyTriCrypto2FinalParityAdjustment(amountOut, tokenInIndex, tokenOutIndex) {
    if (amountOut <= 0n) {
        return amountOut;
    }
    if (tokenInIndex < tokenOutIndex) {
        return amountOut + 1n;
    }
    if (tokenInIndex > tokenOutIndex) {
        return amountOut - 1n;
    }
    return amountOut;
}
function isLegacyTriCryptoRuntime(runtime) {
    const info = runtime?.info;
    const factoryName = info?.staticAttributes?.factory_name;
    const rawName = info?.staticAttributes?.name;
    return factoryName === 'NA' || rawName === 'tricrypto2';
}
function normalizeCoinToXp(amount, index, coinDecimals, effectivePriceScales) {
    const scaledByDecimals = mulDivDown(amount, buildPrecisionMultiplier(coinDecimals?.[index]), constants_1.PRECISION);
    return mulDivDown(scaledByDecimals, effectivePriceScales[index] ?? constants_1.PRECISION, constants_1.PRECISION);
}
function denormalizeXpToCoin(amount, index, coinDecimals, effectivePriceScales) {
    const scale = effectivePriceScales[index] ?? constants_1.PRECISION;
    const unscaled = mulDivDown(amount, constants_1.PRECISION, scale);
    return mulDivDown(unscaled, constants_1.PRECISION, buildPrecisionMultiplier(coinDecimals?.[index]));
}
function computeTriCryptoReductionCoefficient(xp, feeGamma) {
    const x0 = xp[0];
    const x1 = xp[1];
    const x2 = xp[2];
    if (x0 === undefined || x1 === undefined || x2 === undefined) {
        throw new Error('TriCrypto xp missing');
    }
    const S = x0 + x1 + x2;
    let K = (constants_1.WAD * constants_1.N_COINS * x0) / S;
    K = (K * constants_1.N_COINS * x1) / S;
    K = (K * constants_1.N_COINS * x2) / S;
    if (feeGamma > 0n) {
        K = (feeGamma * constants_1.WAD) / (feeGamma + constants_1.WAD - K);
    }
    return K;
}
function computeTriCryptoDynamicFee(xp, midFee, outFee, feeGamma) {
    if (outFee <= midFee) {
        return midFee;
    }
    const reductionCoefficient = computeTriCryptoReductionCoefficient(xp, feeGamma);
    return divDown(midFee * reductionCoefficient + outFee * (constants_1.PRECISION - reductionCoefficient), constants_1.PRECISION);
}
function buildTriCryptoAmp(amplification, amplificationPrecision) {
    if (amplification === undefined || amplification <= 0n) {
        return constants_1.MIN_A;
    }
    if (amplificationPrecision === undefined) {
        return amplification;
    }
    if (amplificationPrecision !== constants_1.AMPLIFICATION_PRECISION) {
        throw new Error(`TriCrypto amplificationPrecision must be ${constants_1.AMPLIFICATION_PRECISION.toString()}`);
    }
    return amplification;
}
function clampTriCryptoGamma(gamma) {
    return minBigInt(maxBigInt(gamma, constants_1.MIN_GAMMA), constants_1.MAX_GAMMA);
}
function clampTriCryptoAmp(amp) {
    return minBigInt(maxBigInt(amp, constants_1.MIN_A), constants_1.MAX_A);
}
function assertTriCryptoMathBounds(amp, gamma) {
    if (amp < constants_1.MIN_A || amp > constants_1.MAX_A) {
        throw new Error('TriCrypto amplification out of bounds');
    }
    if (gamma < constants_1.MIN_GAMMA || gamma > constants_1.MAX_GAMMA) {
        throw new Error('TriCrypto gamma out of bounds');
    }
}
function computeTriCryptoSolverScale(xp) {
    const maxXp = xp.reduce((acc, value) => (value > acc ? value : acc), 0n);
    if (maxXp <= 0n || maxXp >= constants_1.WAD) {
        return 1n;
    }
    return (constants_1.WAD + maxXp - 1n) / maxXp;
}
function newtonDTriCrypto(xp, amp, gamma, k0Prev = 0n) {
    const boundedGamma = clampTriCryptoGamma(gamma);
    const boundedAmp = clampTriCryptoAmp(amp);
    assertTriCryptoMathBounds(boundedAmp, boundedGamma);
    const x = sortDescending3(xp);
    if (x[0] <= 0n) {
        throw new Error('TriCrypto empty pool');
    }
    const S = x[0] + x[1] + x[2];
    let D = 0n;
    if (k0Prev === 0n) {
        D = constants_1.N_COINS * geometricMean3(x);
    }
    else if (S > 10n ** 36n) {
        D = cbrtBigInt(((((x[0] * x[1]) / 10n ** 36n) * x[2]) / k0Prev) * 27n * 10n ** 12n);
    }
    else if (S > 10n ** 24n) {
        D = cbrtBigInt(((((x[0] * x[1]) / 10n ** 24n) * x[2]) / k0Prev) * 27n * 10n ** 6n);
    }
    else {
        D = cbrtBigInt(((((x[0] * x[1]) / constants_1.WAD) * x[2]) / k0Prev) * 27n);
    }
    for (let i = 0; i < 255; i += 1) {
        const prevD = D;
        const rawK0 = ((((((27n * x[0]) / D) * x[1]) / D) * x[2]) / D) * constants_1.WAD;
        const K0 = rawK0 > 0n ? rawK0 : 1n;
        const g1k0 = absBigInt(boundedGamma + constants_1.WAD - K0) + 1n;
        const mul1 = (((((constants_1.WAD * D) / boundedGamma) * g1k0) / boundedGamma) * g1k0 * constants_1.A_MULTIPLIER) / boundedAmp;
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
        const diff = absBigInt(D - prevD);
        if (diff * 10n ** 14n < maxBigInt(10n ** 16n, D)) {
            return D;
        }
    }
    throw new Error('TriCrypto newton_D did not converge');
}
function newtonYTriCrypto(amp, gamma, xp, D, index) {
    const boundedGamma = clampTriCryptoGamma(gamma);
    const boundedAmp = clampTriCryptoAmp(amp);
    assertTriCryptoMathBounds(boundedAmp, boundedGamma);
    const other = xp.map((value, k) => (k === index ? 0n : value));
    const sorted = sortDescending3(other);
    let y = D / constants_1.N_COINS;
    let K0i = constants_1.WAD;
    let Si = 0n;
    const convergenceLimit = maxBigInt(maxBigInt(sorted[0] / 10n ** 14n, D / 10n ** 14n), 100n);
    for (let j = 2; j <= Number(constants_1.N_COINS); j += 1) {
        const x = getDefinedAt(sorted, Number(constants_1.N_COINS) - j, 'tricrypto sorted value');
        y = (y * D) / (x * constants_1.N_COINS);
        Si += x;
    }
    if (y <= 0n) {
        y = 1n;
    }
    for (let j = 0; j < Number(constants_1.N_COINS - 1n); j += 1) {
        K0i = (K0i * getDefinedAt(sorted, j, 'tricrypto sorted value') * constants_1.N_COINS) / D;
    }
    for (let iter = 0; iter < 255; iter += 1) {
        const prevY = y;
        const rawK0 = (K0i * y * constants_1.N_COINS) / D;
        const K0 = rawK0 > 0n ? rawK0 : 1n;
        const S = Si + y;
        const g1k0 = absBigInt(boundedGamma + constants_1.WAD - K0) + 1n;
        const mul1 = (((((constants_1.WAD * D) / boundedGamma) * g1k0) / boundedGamma) * g1k0 * constants_1.A_MULTIPLIER) / boundedAmp;
        const mul2 = constants_1.WAD + (2n * constants_1.WAD * K0) / g1k0;
        let yfprime = constants_1.WAD * y + S * mul2 + mul1;
        const dyfprime = D * mul2;
        if (yfprime < dyfprime) {
            y = prevY / 2n;
            if (y <= 0n) {
                y = 1n;
            }
            continue;
        }
        yfprime -= dyfprime;
        const fprime = yfprime / y;
        let yMinus = mul1 / fprime;
        const yPlus = (yfprime + constants_1.WAD * D) / fprime + (yMinus * constants_1.WAD) / K0;
        yMinus += (constants_1.WAD * S) / fprime;
        y = yPlus < yMinus ? prevY / 2n : yPlus - yMinus;
        const diff = absBigInt(y - prevY);
        if (diff < maxBigInt(convergenceLimit, y / 10n ** 14n)) {
            return y;
        }
    }
    throw new Error('TriCrypto newton_y did not converge');
}
function refineNewtonYTriCrypto(amp, gamma, xp, D, index, initialY) {
    const boundedGamma = clampTriCryptoGamma(gamma);
    const boundedAmp = clampTriCryptoAmp(amp);
    assertTriCryptoMathBounds(boundedAmp, boundedGamma);
    const other = xp.map((value, k) => (k === index ? 0n : value));
    const sorted = sortDescending3(other);
    let y = initialY > 0n ? initialY : 1n;
    let K0i = constants_1.WAD;
    let Si = 0n;
    for (let j = 0; j < Number(constants_1.N_COINS - 1n); j += 1) {
        const sortedValue = getDefinedAt(sorted, j, 'tricrypto sorted value');
        K0i = (K0i * sortedValue * constants_1.N_COINS) / D;
        Si += sortedValue;
    }
    for (let iter = 0; iter < 64; iter += 1) {
        const prevY = y;
        const rawK0 = (K0i * y * constants_1.N_COINS) / D;
        const K0 = rawK0 > 0n ? rawK0 : 1n;
        const S = Si + y;
        const g1k0 = absBigInt(boundedGamma + constants_1.WAD - K0) + 1n;
        const mul1 = (((((constants_1.WAD * D) / boundedGamma) * g1k0) / boundedGamma) * g1k0 * constants_1.A_MULTIPLIER) / boundedAmp;
        const mul2 = constants_1.WAD + (2n * constants_1.WAD * K0) / g1k0;
        let yfprime = constants_1.WAD * y + S * mul2 + mul1;
        const dyfprime = D * mul2;
        if (yfprime < dyfprime) {
            y = maxBigInt(prevY / 2n, 1n);
            continue;
        }
        yfprime -= dyfprime;
        const fprime = yfprime / y;
        let yMinus = mul1 / fprime;
        const yPlus = (yfprime + constants_1.WAD * D) / fprime + (yMinus * constants_1.WAD) / K0;
        yMinus += (constants_1.WAD * S) / fprime;
        y = yPlus < yMinus ? maxBigInt(prevY / 2n, 1n) : yPlus - yMinus;
        if (absBigInt(y - prevY) <= 1n) {
            return y;
        }
    }
    return y;
}
function getYTriCrypto(amp, gamma, xp, D, index) {
    const boundedGamma = clampTriCryptoGamma(gamma);
    const boundedAmp = clampTriCryptoAmp(amp);
    assertTriCryptoMathBounds(boundedAmp, boundedGamma);
    if (D <= 10n ** 17n - 1n || D >= 10n ** 30n + 1n) {
        return newtonYTriCrypto(boundedAmp, boundedGamma, xp, D, index);
    }
    for (let k = 0; k < 3; k += 1) {
        if (k === index) {
            continue;
        }
        const frac = ((xp[k] ?? 0n) * constants_1.WAD) / D;
        if (frac <= 10n ** 16n - 1n || frac >= 10n ** 20n + 1n) {
            return newtonYTriCrypto(boundedAmp, boundedGamma, xp, D, index);
        }
    }
    let j = 0;
    let k = 0;
    if (index === 0) {
        j = 1;
        k = 2;
    }
    else if (index === 1) {
        j = 0;
        k = 2;
    }
    else {
        j = 0;
        k = 1;
    }
    const xj = getDefinedAt(xp, j, 'tricrypto xp');
    const xk = getDefinedAt(xp, k, 'tricrypto xp');
    const gamma2 = boundedGamma * boundedGamma;
    let a = 10n ** 36n / 27n;
    let b = 10n ** 36n / 9n +
        (2n * constants_1.WAD * boundedGamma) / 27n -
        (((D * D) / xj) * gamma2 * boundedAmp) / 27n ** 2n / constants_1.A_MULTIPLIER / xk;
    let c = 10n ** 36n / 9n +
        (boundedGamma * (boundedGamma + 4n * constants_1.WAD)) / 27n +
        (((gamma2 * (xj + xk - D)) / D) * boundedAmp) / 27n / constants_1.A_MULTIPLIER;
    let d = (constants_1.WAD + boundedGamma) ** 2n / 27n;
    const d0 = absBigInt((3n * a * c) / b - b);
    let divider = 1n;
    if (d0 > 10n ** 48n) {
        divider = 10n ** 30n;
    }
    else if (d0 > 10n ** 44n) {
        divider = 10n ** 26n;
    }
    else if (d0 > 10n ** 40n) {
        divider = 10n ** 22n;
    }
    else if (d0 > 10n ** 36n) {
        divider = 10n ** 18n;
    }
    else if (d0 > 10n ** 32n) {
        divider = 10n ** 14n;
    }
    else if (d0 > 10n ** 28n) {
        divider = 10n ** 10n;
    }
    else if (d0 > 10n ** 24n) {
        divider = 10n ** 6n;
    }
    else if (d0 > 10n ** 20n) {
        divider = 10n ** 2n;
    }
    const absA = absBigInt(a);
    const absB = absBigInt(b);
    const additionalPrec = absA > absB ? absA / absB : absB / absA;
    if (absA > absB) {
        a = (a * additionalPrec) / divider;
        b = (b * additionalPrec) / divider;
        c = (c * additionalPrec) / divider;
        d = (d * additionalPrec) / divider;
    }
    else {
        a = a / additionalPrec / divider;
        b = b / additionalPrec / divider;
        c = c / additionalPrec / divider;
        d = d / additionalPrec / divider;
    }
    const threeAc = 3n * a * c;
    const delta0 = threeAc / b - b;
    const delta1 = (3n * threeAc) / b - 2n * b - (((27n * a * a) / b) * d) / b;
    const sqrtArg = delta1 * delta1 + ((4n * delta0 * delta0) / b) * delta0;
    if (sqrtArg <= 0n) {
        return newtonYTriCrypto(boundedAmp, boundedGamma, xp, D, index);
    }
    const sqrtVal = sqrtBigInt(sqrtArg);
    const bCbrt = cbrtSignedBigInt(b);
    const secondCbrt = delta1 > 0n ? cbrtBigInt((delta1 + sqrtVal) / 2n) : -cbrtBigInt(-(delta1 - sqrtVal) / 2n);
    const c1 = (((bCbrt * bCbrt) / constants_1.WAD) * secondCbrt) / constants_1.WAD;
    if (c1 === 0n) {
        return newtonYTriCrypto(boundedAmp, boundedGamma, xp, D, index);
    }
    const rootK0 = (b + (b * delta0) / c1 - c1) / 3n;
    const root = (((((D * D) / 27n / xk) * D) / xj) * rootK0) / a;
    if (root <= 0n) {
        return newtonYTriCrypto(boundedAmp, boundedGamma, xp, D, index);
    }
    const frac = (root * constants_1.WAD) / D;
    if (frac <= 10n ** 16n - 1n || frac >= 10n ** 20n + 1n) {
        return newtonYTriCrypto(boundedAmp, boundedGamma, xp, D, index);
    }
    return root;
}
function analyzeTriCryptoQuote({ amountIn, runtime, useLegacyMath, legacyProfile, tokenInIndex, tokenOutIndex, balances, fee, midFee, outFee, feeGamma, amplification, amplificationPrecision, gamma, nCoins, coinDecimals, precisions, priceScale, priceOracle, lastPrices, invariant, currentTimestamp, futureAGammaTime, }) {
    if (nCoins < 3) {
        throw new Error('TriCrypto quoter expects nCoins >= 3');
    }
    if (amountIn <= 0n) {
        throw new Error('amountIn must be > 0');
    }
    const reserveIn = balances[tokenInIndex];
    const reserveOut = balances[tokenOutIndex];
    if (reserveIn === undefined || reserveOut === undefined) {
        throw new Error('Curve balances missing for requested token indexes');
    }
    const legacyTriCrypto = useLegacyMath || isLegacyTriCryptoRuntime(runtime);
    const legacyTriCrypto2 = legacyProfile === 'tricrypto2' || isLegacyTriCryptoRuntime(runtime);
    const exactScaling = hasExactTriCryptoScaling(precisions, priceScale, nCoins);
    if (exactScaling) {
        const rawNextBalances = [...balances];
        rawNextBalances[tokenInIndex] = getDefinedAt(rawNextBalances, tokenInIndex, 'tricrypto balance') + amountIn;
        if (!precisions || !priceScale) {
            throw new Error('TriCrypto exact scaling requires precisions and priceScale');
        }
        const xp = buildTriCryptoXpFromRawBalances(balances, precisions, priceScale);
        const nextXp = buildTriCryptoXpFromRawBalances(rawNextBalances, precisions, priceScale);
        const xpTuple = toTriCryptoTuple(xp, 'tricrypto xp');
        const nextXpTuple = toTriCryptoTuple(nextXp, 'tricrypto nextXp');
        const amp = buildTriCryptoAmp(amplification, amplificationPrecision);
        const boundedGamma = clampTriCryptoGamma(gamma ?? constants_1.GAMMA_PRECISION / 2n);
        const shouldRecomputeInvariant = futureAGammaTime !== undefined && currentTimestamp !== undefined && futureAGammaTime > currentTimestamp;
        const D = !shouldRecomputeInvariant && invariant !== undefined && invariant > 0n
            ? invariant
            : newtonDTriCrypto(xpTuple, amp, boundedGamma);
        const yBase = legacyTriCrypto
            ? newtonYTriCrypto(amp, boundedGamma, nextXpTuple, D, tokenOutIndex)
            : getYTriCrypto(amp, boundedGamma, nextXpTuple, D, tokenOutIndex);
        const y = legacyTriCrypto && !legacyTriCrypto2
            ? refineNewtonYTriCrypto(amp, boundedGamma, nextXpTuple, D, tokenOutIndex, yBase)
            : yBase;
        const dyRaw = getDefinedAt(nextXp, tokenOutIndex, 'tricrypto nextXp') - y - 1n;
        const feeXp = [...nextXp];
        feeXp[tokenOutIndex] = y;
        const dynamicFee = computeTriCryptoDynamicFee(feeXp, midFee ?? fee ?? 0n, outFee ?? fee ?? 0n, feeGamma ?? constants_1.GAMMA_PRECISION / 2n);
        let noFeeAmountOut;
        let feeAmount;
        let finalAmountOut;
        if (legacyTriCrypto2) {
            const feeXpAmount = mulDivDown(dynamicFee, dyRaw, constants_1.FEE_DENOMINATOR);
            const dyNetRaw = dyRaw - feeXpAmount;
            noFeeAmountOut = denormalizeTriCryptoXpToCoin(dyRaw, tokenOutIndex, precisions, priceScale);
            finalAmountOut =
                tokenOutIndex === 1
                    ? denormalizeTriCryptoXpToCoinUp(dyNetRaw, tokenOutIndex, precisions, priceScale)
                    : denormalizeTriCryptoXpToCoin(dyNetRaw, tokenOutIndex, precisions, priceScale);
            finalAmountOut = applyLegacyTriCrypto2FinalParityAdjustment(finalAmountOut, tokenInIndex, tokenOutIndex);
            feeAmount = noFeeAmountOut - finalAmountOut;
        }
        else {
            noFeeAmountOut = legacyTriCrypto
                ? denormalizeTriCryptoXpToCoinUp(dyRaw, tokenOutIndex, precisions, priceScale)
                : denormalizeTriCryptoXpToCoin(dyRaw, tokenOutIndex, precisions, priceScale);
            feeAmount = mulDivDown(dynamicFee, noFeeAmountOut, constants_1.FEE_DENOMINATOR);
            finalAmountOut = noFeeAmountOut - feeAmount;
        }
        const finalDyNet = buildTriCryptoXpFromRawBalances(balances.map((_balance, index) => (index === tokenOutIndex ? finalAmountOut : 0n)), precisions, priceScale);
        const finalDyNetForTokenOut = getDefinedAt(finalDyNet, tokenOutIndex, 'tricrypto finalDyNet');
        return {
            xpBefore: xp,
            xpAfterIn: nextXp,
            invariant: D,
            y,
            dyRaw,
            dynamicFee,
            feeAmount,
            dyNet: finalDyNetForTokenOut,
            amountOut: finalAmountOut,
        };
    }
    const effectivePriceScales = buildEffectivePriceScales(balances, coinDecimals, priceScale, priceOracle, lastPrices);
    const xp = balances.map((balance, index) => normalizeCoinToXp(balance, index, coinDecimals, effectivePriceScales));
    const solverScale = computeTriCryptoSolverScale(xp);
    const scaledXp = xp.map((value) => value * solverScale);
    const dxXp = normalizeCoinToXp(amountIn, tokenInIndex, coinDecimals, effectivePriceScales);
    const scaledDxXp = dxXp * solverScale;
    const nextXp = [...scaledXp];
    nextXp[tokenInIndex] = getDefinedAt(nextXp, tokenInIndex, 'tricrypto scaled xp') + scaledDxXp;
    const scaledXpTuple = toTriCryptoTuple(scaledXp, 'tricrypto scaledXp');
    const nextXpTuple = toTriCryptoTuple(nextXp, 'tricrypto nextXp');
    const amp = buildTriCryptoAmp(amplification, amplificationPrecision);
    const boundedGamma = clampTriCryptoGamma(gamma ?? constants_1.GAMMA_PRECISION / 2n);
    const shouldRecomputeInvariant = futureAGammaTime !== undefined && currentTimestamp !== undefined && futureAGammaTime > currentTimestamp;
    const D = !shouldRecomputeInvariant && invariant !== undefined && invariant > 0n
        ? invariant * solverScale
        : newtonDTriCrypto(scaledXpTuple, amp, boundedGamma);
    const yBase = legacyTriCrypto
        ? newtonYTriCrypto(amp, boundedGamma, nextXpTuple, D, tokenOutIndex)
        : getYTriCrypto(amp, boundedGamma, nextXpTuple, D, tokenOutIndex);
    const y = legacyTriCrypto && !legacyTriCrypto2
        ? refineNewtonYTriCrypto(amp, boundedGamma, nextXpTuple, D, tokenOutIndex, yBase)
        : yBase;
    const nextXpOut = getDefinedAt(nextXp, tokenOutIndex, 'tricrypto nextXp');
    const dyRawScaled = legacyTriCrypto2 ? nextXpOut - y : nextXpOut - y - 1n;
    const feeXp = [...nextXp];
    feeXp[tokenOutIndex] = y;
    const dynamicFee = computeTriCryptoDynamicFee(feeXp, midFee ?? fee ?? 0n, outFee ?? fee ?? 0n, feeGamma ?? constants_1.GAMMA_PRECISION / 2n);
    const dyRaw = dyRawScaled / solverScale;
    let noFeeAmountOut;
    let feeAmount;
    let amountOut;
    if (legacyTriCrypto2) {
        const feeXpAmount = mulDivDown(dynamicFee, dyRaw, constants_1.FEE_DENOMINATOR);
        const dyNetRaw = dyRaw - feeXpAmount;
        noFeeAmountOut = denormalizeXpToCoin(dyRaw, tokenOutIndex, coinDecimals, effectivePriceScales);
        amountOut = denormalizeXpToCoin(dyNetRaw, tokenOutIndex, coinDecimals, effectivePriceScales);
        amountOut = applyLegacyTriCrypto2FinalParityAdjustment(amountOut, tokenInIndex, tokenOutIndex);
        feeAmount = noFeeAmountOut - amountOut;
    }
    else {
        noFeeAmountOut = denormalizeXpToCoin(dyRaw, tokenOutIndex, coinDecimals, effectivePriceScales);
        feeAmount = mulDivDown(dynamicFee, noFeeAmountOut, constants_1.FEE_DENOMINATOR);
        amountOut = noFeeAmountOut - feeAmount;
    }
    const dyNet = normalizeCoinToXp(amountOut, tokenOutIndex, coinDecimals, effectivePriceScales);
    return {
        xpBefore: xp,
        xpAfterIn: xp.map((value, index) => (index === tokenInIndex ? value + dxXp : value)),
        invariant: D / solverScale,
        y: y / solverScale,
        dyRaw,
        dynamicFee,
        feeAmount,
        dyNet,
        amountOut,
    };
}
function quoteTriCrypto(params) {
    const analysis = analyzeTriCryptoQuote(params);
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
    };
}
//# sourceMappingURL=swap-math.js.map