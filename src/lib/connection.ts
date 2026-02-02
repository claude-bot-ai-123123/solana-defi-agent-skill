/**
 * Solana Connection Management with Round-Robin RPC Support
 */

import { Connection, Commitment } from '@solana/web3.js';

// Default RPC endpoints
const RPC_ENDPOINTS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

export type NetworkType = keyof typeof RPC_ENDPOINTS;

// Round-robin state
let rpcUrls: string[] = [];
let currentRpcIndex = 0;
let defaultConnection: Connection | null = null;

/**
 * Initialize RPC URLs from environment
 * Supports: SOLANA_RPC_URL (single) or SOLANA_RPC_URLS (comma-separated)
 */
function initRpcUrls(): string[] {
  if (rpcUrls.length > 0) return rpcUrls;
  
  // Check for multiple RPCs first
  const multipleRpcs = process.env.SOLANA_RPC_URLS;
  if (multipleRpcs) {
    rpcUrls = multipleRpcs.split(',').map(url => url.trim()).filter(Boolean);
  }
  
  // Fall back to single RPC
  if (rpcUrls.length === 0) {
    const singleRpc = process.env.SOLANA_RPC_URL;
    if (singleRpc) {
      rpcUrls = [singleRpc];
    }
  }
  
  // Fall back to public RPC
  if (rpcUrls.length === 0) {
    rpcUrls = [RPC_ENDPOINTS.mainnet];
  }
  
  return rpcUrls;
}

/**
 * Get next RPC URL (round-robin)
 */
export function getNextRpcUrl(): string {
  const urls = initRpcUrls();
  const url = urls[currentRpcIndex];
  currentRpcIndex = (currentRpcIndex + 1) % urls.length;
  return url;
}

/**
 * Get all configured RPC URLs
 */
export function getRpcUrls(): string[] {
  return initRpcUrls();
}

/**
 * Get or create a Solana connection (uses round-robin if multiple RPCs configured)
 */
export function getConnection(
  rpcUrl?: string,
  commitment: Commitment = 'confirmed'
): Connection {
  const url = rpcUrl || getNextRpcUrl();
  
  if (!defaultConnection || (rpcUrl && rpcUrl !== defaultConnection.rpcEndpoint)) {
    defaultConnection = new Connection(url, {
      commitment,
      confirmTransactionInitialTimeout: 60000,
    });
  }
  
  return defaultConnection;
}

/**
 * Get a fresh connection (always creates new, uses round-robin)
 */
export function getFreshConnection(
  commitment: Commitment = 'confirmed'
): Connection {
  const url = getNextRpcUrl();
  return new Connection(url, {
    commitment,
    confirmTransactionInitialTimeout: 60000,
  });
}

/**
 * Create a new connection (doesn't affect default)
 */
export function createConnection(
  rpcUrl: string,
  commitment: Commitment = 'confirmed'
): Connection {
  return new Connection(rpcUrl, {
    commitment,
    confirmTransactionInitialTimeout: 60000,
  });
}

/**
 * Get connection for a specific network
 */
export function getNetworkConnection(
  network: NetworkType,
  commitment: Commitment = 'confirmed'
): Connection {
  return createConnection(RPC_ENDPOINTS[network], commitment);
}

/**
 * Check if connection is healthy
 */
export async function checkConnection(connection: Connection): Promise<{
  healthy: boolean;
  slot?: number;
  version?: string;
  error?: string;
}> {
  try {
    const [slot, version] = await Promise.all([
      connection.getSlot(),
      connection.getVersion(),
    ]);
    
    return {
      healthy: true,
      slot,
      version: version['solana-core'],
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check health of all configured RPCs
 */
export async function checkAllRpcs(): Promise<Array<{
  url: string;
  healthy: boolean;
  slot?: number;
  latencyMs?: number;
  error?: string;
}>> {
  const urls = initRpcUrls();
  const results = await Promise.all(
    urls.map(async (url) => {
      const start = Date.now();
      const conn = createConnection(url);
      const health = await checkConnection(conn);
      return {
        url,
        ...health,
        latencyMs: Date.now() - start,
      };
    })
  );
  return results;
}

/**
 * Get current slot
 */
export async function getCurrentSlot(connection?: Connection): Promise<number> {
  const conn = connection || getConnection();
  return conn.getSlot();
}

/**
 * Get recent blockhash
 */
export async function getRecentBlockhash(connection?: Connection): Promise<string> {
  const conn = connection || getConnection();
  const { blockhash } = await conn.getLatestBlockhash();
  return blockhash;
}

export default getConnection;
