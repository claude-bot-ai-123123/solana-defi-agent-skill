/**
 * Blinks Executor
 * Fetch, parse, and execute Solana Actions (Blinks)
 */

import { Connection, Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';
import type { BlinkMetadata, BlinkTransaction, BlinkParameter } from '../types/index.js';

/**
 * Parse a blink URL to extract the action URL
 * Format: blink:https://... or https://...
 */
export function parseBlinkUrl(blinkUrl: string): string {
  if (blinkUrl.startsWith('blink:')) {
    return blinkUrl.slice(6);
  }
  return blinkUrl;
}

/**
 * Blinks Executor for Solana Actions
 */
export class BlinksExecutor {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Fetch blink metadata (GET request)
   */
  async getMetadata(blinkUrl: string): Promise<BlinkMetadata> {
    const url = parseBlinkUrl(blinkUrl);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blink metadata: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<BlinkMetadata>;
  }

  /**
   * Execute a blink action (POST request)
   * Returns the serialized transaction
   */
  async getTransaction(
    blinkUrl: string,
    walletAddress: string,
    params?: Record<string, string | number>
  ): Promise<BlinkTransaction> {
    let url = parseBlinkUrl(blinkUrl);
    
    // Add parameters to URL
    if (params && Object.keys(params).length > 0) {
      const urlObj = new URL(url);
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, String(value));
      });
      url = urlObj.toString();
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: walletAddress,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to get blink transaction: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<BlinkTransaction>;
  }

  /**
   * Decode a transaction from base64
   */
  decodeTransaction(base64Tx: string): Transaction | VersionedTransaction {
    const buffer = Buffer.from(base64Tx, 'base64');
    
    // Try to decode as versioned transaction first
    try {
      return VersionedTransaction.deserialize(buffer);
    } catch {
      // Fall back to legacy transaction
      return Transaction.from(buffer);
    }
  }

  /**
   * Sign and send a blink transaction
   */
  async signAndSend(
    blinkTx: BlinkTransaction,
    signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
  ): Promise<string> {
    const tx = this.decodeTransaction(blinkTx.transaction);
    const signedTx = await signTransaction(tx);
    
    let signature: string;
    
    if (signedTx instanceof VersionedTransaction) {
      signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
    } else {
      signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
    }

    // Wait for confirmation
    const latestBlockhash = await this.connection.getLatestBlockhash();
    await this.connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    return signature;
  }

  /**
   * Simulate a blink transaction
   */
  async simulate(blinkTx: BlinkTransaction): Promise<{
    success: boolean;
    logs?: string[];
    error?: string;
    unitsConsumed?: number;
  }> {
    const tx = this.decodeTransaction(blinkTx.transaction);
    
    let result;
    if (tx instanceof VersionedTransaction) {
      result = await this.connection.simulateTransaction(tx);
    } else {
      result = await this.connection.simulateTransaction(tx);
    }

    return {
      success: result.value.err === null,
      logs: result.value.logs ?? undefined,
      error: result.value.err ? JSON.stringify(result.value.err) : undefined,
      unitsConsumed: result.value.unitsConsumed ?? undefined,
    };
  }

  /**
   * Inspect a blink URL - fetch metadata and display info
   */
  async inspect(blinkUrl: string): Promise<{
    url: string;
    metadata: BlinkMetadata;
    actions: Array<{
      label: string;
      href: string;
      parameters?: BlinkParameter[];
    }>;
  }> {
    const url = parseBlinkUrl(blinkUrl);
    const metadata = await this.getMetadata(blinkUrl);
    
    const actions: Array<{
      label: string;
      href: string;
      parameters?: BlinkParameter[];
    }> = [];

    // Add main action if present
    if (metadata.label && !metadata.links?.actions?.length) {
      actions.push({
        label: metadata.label,
        href: url,
      });
    }

    // Add linked actions
    if (metadata.links?.actions) {
      for (const action of metadata.links.actions) {
        actions.push({
          label: action.label,
          href: action.href.startsWith('http') ? action.href : `${new URL(url).origin}${action.href}`,
          parameters: action.parameters,
        });
      }
    }

    return {
      url,
      metadata,
      actions,
    };
  }

  /**
   * Build action URL with parameters
   */
  buildActionUrl(baseUrl: string, params: Record<string, string | number>): string {
    const url = new URL(parseBlinkUrl(baseUrl));
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
    return url.toString();
  }
}

/**
 * Create a BlinksExecutor instance
 */
export function createBlinksExecutor(connection: Connection): BlinksExecutor {
  return new BlinksExecutor(connection);
}

export default BlinksExecutor;
