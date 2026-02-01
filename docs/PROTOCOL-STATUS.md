# Protocol Endpoint Status

Last tested: 2026-02-01

## Summary

| Status | Count |
|--------|-------|
| ✅ Working | 6 |
| ⚠️ Partial | 2 |
| ❌ Unknown Paths | 5 |

## Detailed Status

### ✅ Fully Working

#### Kamino (`kamino.dial.to`)
- **GET** `/api/v0/lend/{vault}/deposit` → Returns action metadata
- **GET** `/api/v0/lend/{vault}/withdraw` → Returns action metadata
- **POST** with `{ account, type: "transaction" }` → Returns transaction
- **Vaults**: `usdg-prime`, `usdc-main`, `sol-main`, etc.
- **Status**: Production ready

#### Jupiter (`jupiter.dial.to`) ✅ NEW
- **Pattern**: `/swap/{inputMint}-{outputMint}` or `/swap/{inputMint}-{outputMint}/{amount}`
- **GET** `/swap/SOL-USDC` → Returns action metadata with 4 actions (0.1, 0.5, 1 SOL, custom)
- **GET** `/swap/SOL-USDC/1` → Returns direct transaction action
- **Example**: `https://jupiter.dial.to/swap/So111...112-EPjFWdd...t1v`
- **Status**: Production ready

#### Tensor (`tensor.trade`, `tensor.dial.to`)
- **actions.json** routes `/trade/**` → `tensor.dial.to/buy-floor/**`
- **actions.json** routes `/item/**` → `tensor.dial.to/bid/**`
- **Status**: Working (NFT-specific, needs collection/item params)

#### Jito (`jito.dial.to`) ✅ FIXED
- **Pattern**: `/stake` or `/stake/percentage/{pct}` or `/stake/amount/{amount}`
- **GET** `/stake` → Returns 4 actions (25%, 50%, 100%, custom)
- **Example**: `https://jito.dial.to/stake`
- **Note**: Was blocked by Cloudflare TLS fingerprinting. Fixed by using curl.
- **Status**: Production ready

#### Helius (`helius.dial.to`) ✅ DISCOVERED
- **Pattern**: `/stake` or `/stake/{amount}`
- **GET** `/stake` → Returns 4 actions (1, 5, 10 SOL, custom)
- **Example**: `https://helius.dial.to/stake`
- **Status**: Production ready

---

### ⚠️ Partial / Needs Discovery

#### Meteora (`meteora.dial.to`)
- **actions.json** exists with 4 rules:
  - `/*` → `/api/*`
  - `/api/**` → `/api/**`
  - `/bonding-curve/**` → `/api/bonding-curve/**`
  - `/dlmm/**` → `/api/dlmm/**`
- **Issue**: Paths return 404. Likely need specific pool IDs.
- **Next**: Try `/api/dlmm/{poolAddress}/add-liquidity`

#### Drift (`app.drift.trade`)
- **actions.json** exists with 2 rules:
  - `/deposit` → `/api/blinks/deposit`
  - `/elections` → `/api/blinks/elections`
- **Issue**: `/api/blinks/deposit` returns 500 Internal Server Error
- **Status**: Endpoint exists but broken

#### Raydium (`share.raydium.io`)
- **No actions.json** found (404)
- **Issue**: Need to discover correct endpoints
- **Next**: Check if specific swap URL patterns work

---

### ❌ Unknown Paths (return 404)

#### Sanctum (`sanctum.dial.to`)
- All tested paths return 404
- **Issue**: Endpoint structure unknown (not Cloudflare block)

#### Orca (`orca.dial.to`)
- All tested paths return 404
- **Issue**: Endpoint structure unknown

#### MarginFi (`marginfi.dial.to`)
- All tested paths return 404
- **Issue**: Endpoint structure unknown

#### Lulo (`lulo.dial.to`, `blink.lulo.fi`)
- `lulo.dial.to`: 404 on all paths
- `blink.lulo.fi`: SSL certificate error (526)
- **Issue**: Both endpoints broken

#### Magic Eden (`api-mainnet.magiceden.dev`)
- Returns 400 Bad Request
- **Issue**: Needs specific item/collection parameters

---

## Test Commands

```bash
# Run all protocol tests
npx vitest run tests/protocols.test.ts

# Run endpoint discovery
npx vitest run tests/discover-paths.test.ts

# Test specific protocol
npx vitest run tests/protocols.test.ts -t "kamino"
```

## Registry Stats

- **Trusted hosts**: 964
- **Malicious hosts**: 10
- **Registry URL**: https://actions-registry.dial.to/all

## Notes

1. **TLS Fingerprinting**: Node.js fetch was blocked by Cloudflare due to TLS fingerprinting. Fixed by using curl subprocess.

2. **Path discovery needed**: Most protocols don't have documented API paths. Kamino and Jupiter patterns discovered through testing.

3. **Parameter requirements**: Many endpoints need specific parameters:
   - Jupiter: `/swap/{inputMint}-{outputMint}`
   - Jito: `/stake/amount/{amount}`
   - Helius: `/stake/{amount}`

4. **Still unknown**: Orca, MarginFi, Raydium, Lulo, Sanctum return 404 for all tested paths.
