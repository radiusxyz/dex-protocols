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
`src/dex-protocols` to minimize churn. Public consumers should prefer the
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

If you want to regenerate fixtures end-to-end from `cyclic-bot`, the flow is:

```bash
cd /Users/abcdefgh/Desktop/work/cyclic-bot
```

1. Build Tycho pool infos:

```bash
pnpm run build:tycho-pool-infos
```

2. Capture Tycho state/update fixtures:

```bash
TYCHO_CAPTURE_POOL_INFOS="scripts/26-build-tycho-pool-infos/out/<timestamp>/pool-infos.generated.json" \
TYCHO_CAPTURE_MAX_BLOCKS=10 \
pnpm run capture:tycho-state-regression
```

3. Export Tycho fixtures into `dex-protocols`:

```bash
pnpm run export:dex-protocol-fixtures
```

4. Capture onchain quote fixtures:

```bash
pnpm run capture:dex-protocol-quote-fixtures -- --protocol UniswapV2
pnpm run capture:dex-protocol-quote-fixtures -- --protocol UniswapV3
pnpm run capture:dex-protocol-quote-fixtures -- --protocol PancakeSwapV3
pnpm run capture:dex-protocol-quote-fixtures -- --protocol AerodromeSlipstream
```

For Aerodrome, use a real Base RPC, not public `mainnet.base.org`, or add delay/retry once we implement that:

```bash
pnpm run capture:dex-protocol-quote-fixtures -- --protocol AerodromeSlipstream --http-url "https://your-base-rpc"
```

Then validate in `dex-protocols`:

```bash
cd /Users/abcdefgh/Desktop/work/dex-protocols
pnpm run check
```

Current missing piece: `PancakeSwapV2` onchain quote capture is supported by the script, so also run:

```bash
pnpm run capture:dex-protocol-quote-fixtures -- --protocol PancakeSwapV2
```

```
test
```