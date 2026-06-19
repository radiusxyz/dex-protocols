# Dex Protocols

Pure TypeScript implementations for DEX protocol reducers, quoters, pricers,
and protocol math.

This package was extracted from `cyclic-bot` so protocol behavior can be tested
with deterministic fixtures instead of live RPC, database, or app-context IO.

## Current scope

- CPMM core
- CLMM core
- StableSwap core
- CryptoSwap core
- Aerodrome Slipstream and Volatile
- Curve
- Ekubo v2 and v3
- PancakeSwap v2 and v3
- SushiSwap v2 and v3
- Uniswap v2 and v3

The first extraction keeps the original internal source layout under
`src/domain/dex-protocols` to minimize churn. Public consumers should prefer the
root module exports or explicit subpath imports.

## Checks

```sh
pnpm run check
pnpm run build
```

## Fixture direction

Live parity checks should be converted into committed fixtures under
`tests/fixtures`. Test runs should replay those fixtures and must not call RPC
providers, databases, indexers, or bot app contexts.
