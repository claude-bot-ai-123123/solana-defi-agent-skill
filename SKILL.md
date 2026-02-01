# Solana Blinks Skill

> Production-ready CLI for Dialect Standard Blinks Library (SBL) with full protocol coverage

## Overview

Execute Solana DeFi operations through Dialect's unified Blinks API. Supports 20 protocols across lending, yield, looping, AMMs, perpetuals, and prediction markets.

## Quick Reference

```bash
# Markets
blinks markets list --type=yield              # All yield opportunities
blinks markets best-yield                      # Top APY markets
blinks markets search USDC                     # Find USDC markets

# Positions
blinks positions                               # Your positions across protocols
blinks positions --provider=kamino             # Kamino positions only

# Execute any blink
blinks inspect <url>                           # Preview blink metadata
blinks execute <url> --amount=100              # Execute with amount
```

## Environment Setup

```bash
# Required
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export SOLANA_PRIVATE_KEY="your-base58-key"  # Or JSON array

# Optional
export DIALECT_API_KEY="your-api-key"  # For higher rate limits
```

---

## Protocol Coverage (20 Protocols)

### Kamino Finance ✅
**Markets API:** ✅ | **Positions API:** ✅ | **Blinks:** ✅

Products: Lend (yield vaults), Borrow (lending), Multiply/Leverage (looping)

```bash
# List markets
blinks kamino markets                          # All Kamino markets
blinks kamino markets --type=lend              # Yield vaults only
blinks kamino markets --type=borrow            # Lending markets
blinks kamino markets --type=multiply          # Loop strategies

# Yield vaults (Kamino Lend)
blinks kamino deposit --vault=usdc-prime --amount=100
blinks kamino withdraw --vault=usdc-prime --amount=50

# Lending (Kamino Borrow)
blinks kamino borrow --market=<addr> --reserve=<addr> --amount=100
blinks kamino repay --market=<addr> --reserve=<addr> --amount=50

# Multiply positions
blinks kamino multiply --market=<addr> --coll-token=<mint> --debt-token=<mint> --amount=1 --leverage=3
```

### MarginFi ✅
**Markets API:** ✅ | **Positions API:** 🔨 | **Blinks:** ✅

```bash
blinks marginfi markets
blinks marginfi deposit --market=<id> --amount=100
blinks marginfi withdraw --market=<id> --amount=50
blinks marginfi borrow --market=<id> --amount=100
blinks marginfi repay --market=<id> --amount=50
```

### Jupiter ✅
**Markets API:** ✅ | **Positions API:** ✅ | **Blinks:** ✅

Products: Lend Earn (yield), Lend Borrow (lending)

```bash
blinks jupiter-lend markets                    # All Jupiter lending
blinks jupiter-lend markets --type=earn        # Yield only
blinks jupiter-lend markets --type=borrow      # Lending only

blinks jupiter-lend deposit --market=<id> --amount=100
blinks jupiter-lend withdraw --market=<id> --amount=50
```

### Raydium ✅
**Markets API:** 🔨 | **Positions API:** 🔨 | **Blinks:** ✅

Products: AMM pools, CLMM concentrated liquidity

```bash
blinks raydium pools                           # List pools (coming soon)
blinks execute <raydium-blink-url> --amount=100
```

### Orca ✅
**Markets API:** 🔨 | **Positions API:** 🔨 | **Blinks:** ✅

Products: Whirlpool concentrated liquidity

```bash
blinks orca pools                              # List pools (coming soon)
blinks execute <orca-blink-url> --amount=100
```

### Meteora ✅
**Markets API:** 🔨 | **Positions API:** 🔨 | **Blinks:** ✅

Products: DLMM dynamic liquidity

```bash
blinks meteora pools                           # List pools (coming soon)
blinks execute <meteora-blink-url> --amount=100
```

### Drift Protocol ✅
**Markets API:** 🔨 | **Positions API:** 🔨 | **Blinks:** ✅

Products: Strategy Vaults (perpetual strategies)

```bash
blinks drift vaults
blinks drift vault-deposit --vault=<id> --amount=100
blinks drift vault-withdraw --vault=<id> --amount=50
```

### Lulo ✅
**Markets API:** ✅ | **Positions API:** ✅ | **Blinks:** ✅

Products: Protected deposits (instant), Boosted deposits (cooldown)

```bash
blinks lulo markets                            # All Lulo markets
blinks lulo markets --type=protected           # No cooldown
blinks lulo markets --type=boosted             # Higher yield, has cooldown

blinks lulo deposit --market=<id> --amount=100
blinks lulo withdraw --market=<id> --amount=50
```

### Save Protocol ✅
**Markets API:** 🔨 | **Positions API:** 🔨 | **Blinks:** ✅

```bash
blinks execute <save-blink-url> --amount=100
```

### DeFiTuna ✅
**Markets API:** ✅ | **Positions API:** 🔨 | **Blinks:** ✅

```bash
blinks markets list --provider=defituna
blinks execute <defituna-blink-url> --amount=100
```

### DeFiCarrot ✅
**Markets API:** ✅ | **Positions API:** 🔨 | **Blinks:** ✅

```bash
blinks markets list --provider=deficarrot
blinks execute <deficarrot-blink-url> --amount=100
```

### DFlow ✅
**Markets API:** ✅ | **Positions API:** ✅ | **Blinks:** 🔨

Products: Prediction Markets

```bash
blinks markets list --provider=dflow --type=prediction
```

---

## Market Commands

### List Markets

```bash
# By type
blinks markets list --type=lending             # Deposit/borrow markets
blinks markets list --type=yield               # Yield vaults
blinks markets list --type=loop                # Leveraged looping
blinks markets list --type=perp                # Perpetual strategies
blinks markets list --type=prediction          # Prediction markets

# By provider
blinks markets list --provider=kamino
blinks markets list --provider=marginfi
blinks markets list --provider=jupiter
blinks markets list --provider=lulo

# Combined filters
blinks markets list --type=lending --provider=kamino --token=USDC

# With APY/TVL filters
blinks markets list --min-apy=0.05 --min-tvl=1000000
```

### Best Opportunities

```bash
blinks markets best-yield --limit=10           # Highest APY yield
blinks markets best-borrow --limit=10          # Lowest borrow rates
blinks markets search SOL                      # All SOL markets
```

### Output Formats

```bash
blinks markets list -f json                    # JSON (default, AI-friendly)
blinks markets list -f table                   # ASCII table
blinks markets list -f minimal                 # Key=value pairs
blinks markets list -q                         # Quiet/minimal
```

---

## Wallet Commands

```bash
blinks wallet address                          # Show configured address
blinks wallet balance                          # All token balances
blinks wallet balance -w <address>             # External wallet balance
```

---

## Position Tracking

```bash
blinks positions                               # All your positions
blinks positions --provider=kamino             # Kamino only
blinks positions --type=lending                # Lending positions
blinks positions -w <address>                  # Other wallet
```

---

## Blink Execution

### Inspect

Preview any blink URL before execution:

```bash
blinks inspect "blink:https://kamino.dial.to/api/v0/lend/usdc-prime/deposit"
```

Returns: metadata, available actions, required parameters

### Execute

Execute any blink with parameters:

```bash
# Basic execution
blinks execute <url> --amount=100

# With custom params
blinks execute <url> -p '{"amount":"100","leverage":"3"}'

# Dry run (simulation)
blinks execute <url> --amount=100 --dry-run
```

---

## API Response Structure

### Market Object
```json
{
  "id": "kamino.lend.usdc-prime",
  "type": "yield",
  "provider": { "id": "kamino", "name": "Kamino" },
  "token": { "symbol": "USDC", "address": "...", "decimals": 6 },
  "depositApy": 0.0534,
  "totalDepositUsd": 174588566.75,
  "actions": {
    "deposit": { "blinkUrl": "blink:https://..." },
    "withdraw": { "blinkUrl": "blink:https://..." }
  }
}
```

### Position Object
```json
{
  "id": "position-id",
  "type": "lending",
  "marketId": "kamino.lending.usdc",
  "side": "deposit",
  "amount": 1000.5,
  "amountUsd": 1000.50,
  "ltv": 0.65,
  "actions": {
    "withdraw": { "blinkUrl": "blink:https://..." },
    "borrow": { "blinkUrl": "blink:https://..." }
  }
}
```

---

## Usage Examples for AI Agents

### Find Best USDC Yield

```bash
blinks markets search USDC | jq '.[] | select(.type=="yield") | {provider: .provider, apy: .apy}'
```

### Deposit to Highest Yield

```bash
# Get best yield market
MARKET=$(blinks markets best-yield -f json | jq -r '.[0]')

# Execute deposit
blinks execute $(echo $MARKET | jq -r '.blinkUrl') --amount=100
```

### Monitor Portfolio

```bash
# Get all positions value
blinks positions -f json | jq '[.[].amountUsd] | add'
```

### Health Check

```bash
blinks status
```

---

## Error Handling

All commands return JSON errors:
```json
{
  "error": "Market not found or deposit not supported",
  "code": "MARKET_NOT_FOUND"
}
```

Exit codes:
- `0`: Success
- `1`: Error (check stderr)

---

## Rate Limits

- Dialect public API: ~100 req/min
- With API key: Higher limits available

---

## Protocol Status Legend

- ✅ Available
- 🔨 Coming Soon

---

## Links

- [Dialect Docs](https://docs.dialect.to/markets)
- [Supported Protocols](https://docs.dialect.to/markets/supported-protocols)
- [Solana Actions Spec](https://docs.dialect.to/documentation/actions/actions-and-blinks)
