"use strict";
// src/aerodrome-finance/slipstream/observation-math.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.observeTickCumulativesSlipstream = observeTickCumulativesSlipstream;
const constants_1 = require("./constants");
function getObs(vec, idx) {
    const observation = vec[idx];
    if (!observation) {
        throw new Error(`Missing observation at idx=${idx}`);
    }
    return observation;
}
function u32(x) {
    // force into [0, 2^32)
    return ((x % constants_1.U32) + constants_1.U32) % constants_1.U32;
}
function u32Sub(a, b) {
    // (a - b) mod 2^32, result in [0, 2^32)
    return u32(a - b);
}
// --- Helpers (match Rust semantics) ---
function lte(time, a, b) {
    // Rust:
    // if a <= time && b <= time: a <= b
    // else adjust by adding 2^32 to values <= time
    if (a <= time && b <= time) {
        return a <= b;
    }
    const TWO_32 = 2 ** 32; // safe in JS number
    const aAdj = a > time ? a : a + TWO_32;
    const bAdj = b > time ? b : b + TWO_32;
    return aAdj <= bAdj;
}
function safeU256Add(a, b) {
    const r = a + b;
    if (r < 0n) {
        throw new Error('U256 underflow');
    }
    return r;
}
function safeU256Sub(a, b) {
    const r = a - b;
    if (r < 0n) {
        throw new Error('U256 underflow');
    }
    return r;
}
function safeU256Mul(a, b) {
    const r = a * b;
    if (r < 0n) {
        throw new Error('U256 underflow');
    }
    return r;
}
function safeU256Div(a, b) {
    if (b === 0n) {
        throw new Error('divide by zero');
    }
    const r = a / b;
    if (r < 0n) {
        throw new Error('U256 underflow');
    }
    return r;
}
function transform(before, target, tick, liquidity) {
    const delta = u32Sub(target, before.blockTimestamp); // u32 wrap not handled here; Rust uses plain sub
    if (delta < 0) {
        throw new Error('transform: target < before.blockTimestamp');
    }
    const tickCumulative = before.tickCumulative + BigInt(tick) * BigInt(delta);
    // secondsPerLiquidityCumulativeX128 += (delta << 128) / liquidity (if liquidity > 0)
    let secondsPerLiquidityCumulativeX128 = before.secondsPerLiquidityCumulativeX128;
    if (liquidity > 0n) {
        const add = (BigInt(delta) << 128n) / liquidity;
        secondsPerLiquidityCumulativeX128 = safeU256Add(secondsPerLiquidityCumulativeX128, add);
    }
    return {
        blockTimestamp: target,
        tickCumulative,
        secondsPerLiquidityCumulativeX128,
        initialized: true,
    };
}
// Build a dense vec like Rust's Vec<Observation> where missing indices become default Observation
function buildDenseObservationVec(state) {
    // Rust allows indices up to whatever was upserted, but observe assumes indices exist (< len)
    // We'll size to max(maxKey+1, cardinality) so ring indexing works.
    let maxKey = -1;
    for (const k of state.observations.keys()) {
        if (k > maxKey) {
            maxKey = k;
        }
    }
    const needed = Math.max(maxKey + 1, state.observationCardinality);
    const out = new Array(needed);
    // Rust default Observation has initialized=false, timestamps=0, cumulatives=0.
    for (let i = 0; i < needed; i++) {
        out[i] = {
            blockTimestamp: 0,
            tickCumulative: 0n,
            secondsPerLiquidityCumulativeX128: 0n,
            initialized: false,
        };
    }
    for (const [idx, observation] of state.observations.entries()) {
        if (idx >= 0 && idx < needed) {
            out[idx] = observation;
        }
    }
    return out;
}
function observationIndexErr(idx, index, cardinality, len) {
    throw new Error(`Observation index ${idx} out of bounds (len=${len}), index=${index} cardinality=${cardinality}`);
}
// --- Core functions (mirror Rust) ---
function binarySearch(observationsVec, time, target, index, cardinality) {
    if (observationsVec.length === 0) {
        throw new Error('No observations available');
    }
    let l = (index + 1) % cardinality;
    let r = l + cardinality - 1;
    while (true) {
        const i = Math.floor((l + r) / 2);
        const beforeIdx = i % cardinality;
        if (beforeIdx >= observationsVec.length) {
            observationIndexErr(beforeIdx, index, cardinality, observationsVec.length);
        }
        const beforeOrAt = getObs(observationsVec, beforeIdx);
        if (!beforeOrAt.initialized) {
            l = i + 1;
            continue;
        }
        const afterIdx = (i + 1) % cardinality;
        if (afterIdx >= observationsVec.length) {
            observationIndexErr(afterIdx, index, cardinality, observationsVec.length);
        }
        const atOrAfter = getObs(observationsVec, afterIdx);
        const targetAtOrAfter = lte(time, beforeOrAt.blockTimestamp, target);
        if (targetAtOrAfter && lte(time, target, atOrAfter.blockTimestamp)) {
            return [beforeOrAt, atOrAfter];
        }
        if (!targetAtOrAfter) {
            if (i === 0) {
                break;
            }
            r = i - 1;
        }
        else {
            l = i + 1;
        }
    }
    throw new Error('Binary search failed — inconsistent data');
}
function getSurroundingObservations(observationsVec, time, target, tick, index, liquidity, cardinality) {
    const idx = index;
    if (idx >= observationsVec.length) {
        observationIndexErr(idx, index, cardinality, observationsVec.length);
    }
    let beforeOrAt = getObs(observationsVec, idx);
    // if newest is <= target, we can either return it or transform forward to target
    if (lte(time, beforeOrAt.blockTimestamp, target)) {
        if (beforeOrAt.blockTimestamp === target) {
            return [beforeOrAt, beforeOrAt];
        }
        return [beforeOrAt, transform(beforeOrAt, target, tick, liquidity)];
    }
    // otherwise try the oldest observation at (index+1) % cardinality
    const nextIdx = (index + 1) % cardinality;
    if (nextIdx >= observationsVec.length) {
        observationIndexErr(nextIdx, index, cardinality, observationsVec.length);
    }
    beforeOrAt = getObs(observationsVec, nextIdx);
    if (!beforeOrAt.initialized) {
        if (observationsVec.length === 0) {
            throw new Error('No observations available');
        }
        beforeOrAt = getObs(observationsVec, nextIdx);
    }
    if (!lte(time, beforeOrAt.blockTimestamp, target)) {
        throw new Error('Target too old (after oldest observation)');
    }
    return binarySearch(observationsVec, time, target, index, cardinality);
}
function observeSingle(observationsVec, time, secondsAgo, tick, index, liquidity, cardinality) {
    if (cardinality === 0) {
        throw new Error('Cardinality must be > 0');
    }
    if (secondsAgo === 0) {
        if (index >= observationsVec.length) {
            observationIndexErr(index, index, cardinality, observationsVec.length);
        }
        let last = getObs(observationsVec, index);
        if (last.blockTimestamp !== time) {
            last = transform(last, time, tick, liquidity);
        }
        return {
            tickCumulative: last.tickCumulative,
            secondsPerLiquidityCumulativeX128: last.secondsPerLiquidityCumulativeX128,
        };
    }
    const target = u32Sub(time, secondsAgo);
    const [beforeOrAt, atOrAfter] = getSurroundingObservations(observationsVec, time, target, tick, index, liquidity, cardinality);
    if (target === beforeOrAt.blockTimestamp) {
        return {
            tickCumulative: beforeOrAt.tickCumulative,
            secondsPerLiquidityCumulativeX128: beforeOrAt.secondsPerLiquidityCumulativeX128,
        };
    }
    if (target === atOrAfter.blockTimestamp) {
        return {
            tickCumulative: atOrAfter.tickCumulative,
            secondsPerLiquidityCumulativeX128: atOrAfter.secondsPerLiquidityCumulativeX128,
        };
    }
    const observationTimeDelta = u32Sub(atOrAfter.blockTimestamp, beforeOrAt.blockTimestamp);
    const targetDelta = u32Sub(target, beforeOrAt.blockTimestamp);
    const tickCumulative = beforeOrAt.tickCumulative +
        ((atOrAfter.tickCumulative - beforeOrAt.tickCumulative) * BigInt(targetDelta)) / BigInt(observationTimeDelta);
    // secondsPerLiquidity interpolation (match Rust safe math)
    const delta = safeU256Sub(atOrAfter.secondsPerLiquidityCumulativeX128, beforeOrAt.secondsPerLiquidityCumulativeX128);
    const scaled = safeU256Div(safeU256Mul(delta, BigInt(targetDelta)), BigInt(observationTimeDelta));
    const secLiq = safeU256Add(beforeOrAt.secondsPerLiquidityCumulativeX128, scaled);
    return { tickCumulative, secondsPerLiquidityCumulativeX128: secLiq };
}
// --- The function you asked for ---
function observeTickCumulativesSlipstream(args) {
    const { time, secondsAgos, tick, observationState, liquidity } = args;
    const cardinality = observationState.observationCardinality;
    const index = observationState.observationIndex;
    if (index < 0 || index >= cardinality) {
        throw new Error(`Invalid observationIndex=${index} for cardinality=${cardinality}`);
    }
    if (cardinality === 0) {
        throw new Error('Cardinality must be > 0');
    }
    const observationsVec = buildDenseObservationVec(observationState);
    const out = [];
    for (const secondsAgo of secondsAgos) {
        const { tickCumulative } = observeSingle(observationsVec, time, secondsAgo, tick, index, liquidity, cardinality);
        out.push(tickCumulative);
    }
    return out;
}
//# sourceMappingURL=observation-math.js.map