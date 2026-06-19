# Dex protocol fixtures

Fixtures in this directory should be committed data captured outside the test run.
Protocol tests should read these files as deterministic inputs and should not call
RPC providers, databases, app contexts, or indexers.

Recommended fixture shape:

```json
{
  "protocolId": "UniswapV3",
  "chainId": 1,
  "blockNumber": "0",
  "pool": "0x...",
  "info": {},
  "state": {},
  "quotes": [
    {
      "zeroForOne": true,
      "amountIn": "1000000000000000000",
      "sqrtPriceLimitX96": "0",
      "expected": {
        "amountOut": "0",
        "sqrtPriceAfterX96": "0"
      }
    }
  ]
}
```

Use decimal strings for all bigint values. Test loaders should revive those fields
to `bigint` and rebuild any `Map` fields required by protocol runtimes.
