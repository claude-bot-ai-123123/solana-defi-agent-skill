# @openclaw/solana-blinks

Production-ready Solana Blinks CLI and SDK with full [Dialect Standard Blinks Library (SBL)](https://docs.dialect.to/markets/supported-protocols) coverage.

## Features

- 🔗 **Full SBL Coverage** - All 20 Dialect-supported protocols
- 🤖 **AI-Agent Ready** - JSON output, structured errors, minimal dependencies
- ⚡ **Zero Config** - Works with just RPC URL and private key
- 📊 **Unified Markets API** - Browse all DeFi opportunities in one place
- 💰 **Position Tracking** - Monitor your positions across protocols
- 🔧 **Programmatic SDK** - Use as a library in your TypeScript projects

## Supported Protocols

| Protocol | Type | Markets API | Positions API | Blinks |
|----------|------|-------------|---------------|--------|
| Kamino Lend | Yield | ✅ | ✅ | ✅ |
| Kamino Borrow | Lending | ✅ | ✅ | ✅ |
| Kamino Multiply | Loop | ✅ | ✅ | ✅ |
| Kamino Leverage | Loop | ✅ | 🔨 | ✅ |
| MarginFi | Lending | ✅ | 🔨 | ✅ |
| Jupiter Lend Earn | Yield | ✅ | ✅ | ✅ |
| Jupiter Lend Borrow | Lending | ✅ | ✅ | ✅ |
| Raydium AMM | AMM | 🔨 | 🔨 | ✅ |
| Raydium CLMM | AMM | 🔨 | 🔨 | ✅ |
| Orca Whirlpools | AMM | 🔨 | 🔨 | ✅ |
| Meteora DLMM | AMM | 🔨 | 🔨 | ✅ |
| Drift Vaults | Perps | 🔨 | 🔨 | ✅ |
| Lulo Protected | Yield | ✅ | ✅ | ✅ |
| Lulo Boosted | Yield | ✅ | ✅ | ✅ |
| Save Protocol | Yield | 🔨 | 🔨 | ✅ |
| DeFiTuna | Yield | ✅ | 🔨 | ✅ |
| DeFiCarrot | Yield | ✅ | 🔨 | ✅ |
| DFlow | Prediction | ✅ | ✅ | 🔨 |

✅ Available | 🔨 Coming Soon

## Installation

```bash
npm install -g @openclaw/solana-blinks
# or
npx @openclaw/solana-blinks
```

## Configuration

Create a `.env` file or set environment variables:

```bash
# Required
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your-base58-private-key

# Optional
DIALECT_API_KEY=your-api-key  # For higher rate limits
```

### Private Key Formats

The CLI accepts private keys in two formats:

1. **Base58** (recommended): `5abc123...`
2. **JSON Array**: `[1,2,3,4,...]` (Solana CLI format)

## Quick Start

```bash
# Check configuration
blinks status

# View wallet
blinks wallet address
blinks wallet balance

# Browse markets
blinks markets list --type=yield
blinks markets best-yield --limit=5

# View positions
blinks positions

# Execute a deposit
blinks kamino deposit --vault=usdc-prime --amount=100 --dry-run
```

## CLI Commands

### Markets

```bash
# List by type
blinks markets list --type=lending|yield|loop|perp|prediction

# Filter by provider
blinks markets list --provider=kamino|marginfi|jupiter|lulo

# Combined filters
blinks markets list --type=yield --provider=kamino --min-apy=0.05

# Best opportunities
blinks markets best-yield --limit=10
blinks markets best-borrow --limit=10

# Search by token
blinks markets search USDC
```

### Protocol-Specific

```bash
# Kamino
blinks kamino markets --type=lend
blinks kamino deposit --vault=<slug> --amount=100
blinks kamino withdraw --vault=<slug> --amount=50
blinks kamino borrow --market=<addr> --reserve=<addr> --amount=100
blinks kamino repay --market=<addr> --reserve=<addr> --amount=50
blinks kamino multiply --market=<addr> --coll-token=<mint> --debt-token=<mint> --amount=1

# MarginFi
blinks marginfi markets
blinks marginfi deposit --market=<id> --amount=100

# Jupiter
blinks jupiter-lend markets --type=earn
blinks jupiter-lend deposit --market=<id> --amount=100

# Lulo
blinks lulo markets --type=protected
blinks lulo deposit --market=<id> --amount=100

# Drift
blinks drift vaults
blinks drift vault-deposit --vault=<id> --amount=100
```

### Blinks Execution

```bash
# Inspect any blink URL
blinks inspect "blink:https://..."

# Execute with parameters
blinks execute "blink:https://..." --amount=100

# Dry run
blinks execute "blink:https://..." --amount=100 --dry-run
```

### Output Formats

```bash
blinks markets list -f json     # JSON (default)
blinks markets list -f table    # ASCII table
blinks markets list -f minimal  # Key=value
blinks markets list -q          # Quiet mode
```

## SDK Usage

```typescript
import {
  DialectClient,
  BlinksExecutor,
  Wallet,
  getConnection,
} from '@openclaw/solana-blinks';

// Initialize
const dialect = new DialectClient();
const connection = getConnection();
const wallet = Wallet.fromEnv();
const blinks = new BlinksExecutor(connection);

// Get markets
const yieldMarkets = await dialect.getMarkets({ type: 'yield' });
const bestYield = await dialect.getBestYieldMarkets(10);

// Get positions
const positions = await dialect.getPositions(wallet.address);

// Execute blink
const market = yieldMarkets[0];
const blinkUrl = market.actions.deposit?.blinkUrl;

if (blinkUrl) {
  const tx = await blinks.getTransaction(blinkUrl, wallet.address, {
    amount: '100',
  });
  
  // Simulate first
  const sim = await blinks.simulate(tx);
  console.log('Simulation:', sim);
  
  // Execute
  const signature = await blinks.signAndSend(tx, wallet.getSigner());
  console.log('Confirmed:', signature);
}
```

### TypeScript Types

```typescript
import type {
  Market,
  Position,
  YieldMarket,
  LendingMarket,
  LoopMarket,
  ProtocolId,
  MarketType,
  MarketFilter,
} from '@openclaw/solana-blinks';
```

## API Reference

### DialectClient

```typescript
const client = new DialectClient({ apiKey?: string, baseUrl?: string });

// Markets
client.getMarkets(filter?: MarketFilter): Promise<Market[]>
client.getMarketsGrouped(): Promise<MarketsGroupedResponse>
client.getMarketsByProtocol(protocol: ProtocolId): Promise<Market[]>
client.getMarketsByType(type: MarketType): Promise<Market[]>
client.getBestYieldMarkets(limit?: number): Promise<Market[]>
client.getBestBorrowRates(limit?: number): Promise<Market[]>
client.searchMarketsByToken(symbol: string): Promise<Market[]>

// Positions
client.getPositions(wallet: string, filter?: PositionFilter): Promise<Position[]>
client.getHistoricalPositions(wallet: string, start?: Date, end?: Date): Promise<...>
```

### BlinksExecutor

```typescript
const executor = new BlinksExecutor(connection: Connection);

executor.getMetadata(blinkUrl: string): Promise<BlinkMetadata>
executor.getTransaction(blinkUrl: string, wallet: string, params?: Record<string, any>): Promise<BlinkTransaction>
executor.simulate(tx: BlinkTransaction): Promise<SimulationResult>
executor.signAndSend(tx: BlinkTransaction, signer: Signer): Promise<string>
executor.inspect(blinkUrl: string): Promise<InspectResult>
```

### Wallet

```typescript
const wallet = Wallet.fromEnv();
const wallet = Wallet.fromPrivateKey(key: string);
const wallet = Wallet.fromFile(path: string);

wallet.address: string
wallet.publicKey: PublicKey
wallet.sign(tx: Transaction): Transaction
wallet.getSigner(): Signer
wallet.getBalance(connection: Connection): Promise<number>
wallet.getAllBalances(connection: Connection): Promise<WalletBalance[]>
```

## Error Handling

```typescript
try {
  await client.getMarkets();
} catch (error) {
  if (error.message.includes('Dialect API error')) {
    // API error
  }
}
```

CLI errors return JSON:
```json
{
  "error": "Market not found",
  "code": "NOT_FOUND"
}
```

## Development

```bash
git clone https://github.com/openclaw/solana-blinks-skill
cd solana-blinks-skill
npm install
npm run build
npm run dev -- markets list
```

## License

MIT

## Links

- [Dialect Documentation](https://docs.dialect.to/markets)
- [Solana Actions Spec](https://docs.dialect.to/documentation/actions/actions-and-blinks)
- [OpenClaw](https://openclaw.io)
