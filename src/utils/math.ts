export function mulDiv(a: bigint, b: bigint, den: bigint): bigint {
  // NOTE: bigint * bigint can be huge; JS BigInt is arbitrary precision so OK (but slower).
  return (a * b) / den;
}

export function mulDivRoundingUp(a: bigint, b: bigint, den: bigint): bigint {
  const p = a * b;
  const q = p / den;
  return p % den === 0n ? q : q + 1n;
}

export function divRoundingUp(x: bigint, d: bigint): bigint {
  return x % d === 0n ? x / d : x / d + 1n;
}

export function divFloor(a: number, b: number): number {
  // b > 0
  if (b <= 0) {
    throw new Error('divFloor: b must be > 0');
  }
  return Math.floor(a / b);
}

export function pow10(n: number): bigint {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('pow10 expects non-negative int');
  }
  return 10n ** BigInt(n);
}

type Ratio = { n: bigint; d: bigint };

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

// TODO: stompesi - check to remove
export function applyRatiosFloor(x: bigint, ratios: Ratio[]): bigint {
  if (x === 0n) {
    return 0n;
  }

  // We'll maintain a single fraction N/D, reduced along the way.
  let N = 1n;
  let D = 1n;

  for (const { n, d } of ratios) {
    if (d === 0n) {
      throw new Error('division by zero ratio');
    }

    // Reduce cross terms to keep numbers small:
    // (N * n) / (D * d)
    let nn = n;
    let dd = d;

    // Reduce nn with D
    let g = gcd(nn, D);
    nn /= g;
    D /= g;

    // Reduce dd with N
    g = gcd(dd, N);
    dd /= g;
    N /= g;

    // Now multiply (much smaller risk of blowup)
    N *= nn;
    D *= dd;

    // Optional: keep N/D reduced
    g = gcd(N, D);
    N /= g;
    D /= g;
  }

  // Final integer projection (floor)
  return (x * N) / D;
}
