/**
 * @openclaw/solana-blinks
 * Production-ready Solana Blinks SDK with full Dialect SBL coverage
 */

// Types
export * from './types/index.js';

// Core Libraries
export { DialectClient, getDialectClient } from './lib/dialect.js';
export { BlinksExecutor, createBlinksExecutor, parseBlinkUrl } from './lib/blinks.js';
export { Wallet, getWalletBalance, getWalletTokenBalances } from './lib/wallet.js';
export {
  getConnection,
  createConnection,
  getNetworkConnection,
  checkConnection,
  getCurrentSlot,
  getRecentBlockhash,
} from './lib/connection.js';

// Protocol Handlers
export {
  PROTOCOLS,
  ProtocolHandler,
  KaminoHandler,
  MarginFiHandler,
  JupiterHandler,
  LuloHandler,
  DeFiTunaHandler,
  DeFiCarrotHandler,
  DriftHandler,
  DFlowHandler,
  createProtocolHandlers,
} from './lib/protocols.js';

// Output Utilities
export {
  formatOutput,
  formatPercent,
  formatNumber,
  formatUsd,
  formatTokenAmount,
  formatSignature,
  formatAddress,
  success,
  error,
  info,
  warn,
} from './lib/output.js';

// Convenience re-exports
export { Connection, PublicKey, Keypair } from '@solana/web3.js';
