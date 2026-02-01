/**
 * Protocol-Specific Handlers
 * Covers all 20 Dialect Standard Blinks Library (SBL) protocols
 */

import type { Market, Position, ProtocolId, MarketType } from '../types/index.js';
import { DialectClient } from './dialect.js';
import { BlinksExecutor } from './blinks.js';
import type { Connection } from '@solana/web3.js';

/**
 * Protocol metadata for all SBL protocols
 */
export const PROTOCOLS: Record<ProtocolId, {
  name: string;
  displayName: string;
  category: string;
  website: string;
  marketTypes: MarketType[];
  actions: string[];
  blinksSupported: boolean;
  marketsApiSupported: boolean;
  positionsApiSupported: boolean;
}> = {
  kamino: {
    name: 'kamino',
    displayName: 'Kamino Finance',
    category: 'lending-yield',
    website: 'https://kamino.finance',
    marketTypes: ['yield', 'lending', 'loop'],
    actions: ['deposit', 'withdraw', 'borrow', 'repay', 'multiply', 'leverage'],
    blinksSupported: true,
    marketsApiSupported: true,
    positionsApiSupported: true,
  },
  marginfi: {
    name: 'marginfi',
    displayName: 'MarginFi',
    category: 'lending',
    website: 'https://marginfi.com',
    marketTypes: ['lending'],
    actions: ['deposit', 'withdraw', 'borrow', 'repay'],
    blinksSupported: true,
    marketsApiSupported: true,
    positionsApiSupported: false, // Coming soon
  },
  jupiter: {
    name: 'jupiter',
    displayName: 'Jupiter',
    category: 'swap-lending',
    website: 'https://jup.ag',
    marketTypes: ['yield', 'lending'],
    actions: ['deposit', 'withdraw', 'borrow', 'repay', 'swap'],
    blinksSupported: true,
    marketsApiSupported: true,
    positionsApiSupported: true,
  },
  raydium: {
    name: 'raydium',
    displayName: 'Raydium',
    category: 'amm',
    website: 'https://raydium.io',
    marketTypes: [],
    actions: ['add-liquidity', 'remove-liquidity'],
    blinksSupported: true,
    marketsApiSupported: false, // Coming soon
    positionsApiSupported: false,
  },
  orca: {
    name: 'orca',
    displayName: 'Orca',
    category: 'amm',
    website: 'https://orca.so',
    marketTypes: [],
    actions: ['add-liquidity', 'remove-liquidity'],
    blinksSupported: true,
    marketsApiSupported: false, // Coming soon
    positionsApiSupported: false,
  },
  meteora: {
    name: 'meteora',
    displayName: 'Meteora',
    category: 'amm',
    website: 'https://meteora.ag',
    marketTypes: [],
    actions: ['add-liquidity', 'remove-liquidity'],
    blinksSupported: true,
    marketsApiSupported: false, // Coming soon
    positionsApiSupported: false,
  },
  drift: {
    name: 'drift',
    displayName: 'Drift Protocol',
    category: 'perps',
    website: 'https://drift.trade',
    marketTypes: ['perpetual'],
    actions: ['vault-deposit', 'vault-withdraw'],
    blinksSupported: true,
    marketsApiSupported: false, // Coming soon
    positionsApiSupported: false,
  },
  lulo: {
    name: 'lulo',
    displayName: 'Lulo',
    category: 'yield',
    website: 'https://lulo.fi',
    marketTypes: ['yield'],
    actions: ['deposit', 'withdraw'],
    blinksSupported: true,
    marketsApiSupported: true,
    positionsApiSupported: true,
  },
  save: {
    name: 'save',
    displayName: 'Save Protocol',
    category: 'yield',
    website: 'https://save.finance',
    marketTypes: ['yield'],
    actions: ['deposit', 'withdraw'],
    blinksSupported: true,
    marketsApiSupported: false, // Coming soon
    positionsApiSupported: false,
  },
  defituna: {
    name: 'defituna',
    displayName: 'DeFiTuna',
    category: 'lending',
    website: 'https://defituna.com',
    marketTypes: ['yield'],
    actions: ['deposit', 'withdraw'],
    blinksSupported: true,
    marketsApiSupported: true,
    positionsApiSupported: false, // Coming soon
  },
  deficarrot: {
    name: 'deficarrot',
    displayName: 'DeFiCarrot',
    category: 'yield',
    website: 'https://deficarrot.com',
    marketTypes: ['yield'],
    actions: ['deposit', 'withdraw'],
    blinksSupported: true,
    marketsApiSupported: true,
    positionsApiSupported: false, // Coming soon
  },
  dflow: {
    name: 'dflow',
    displayName: 'DFlow',
    category: 'prediction',
    website: 'https://dflow.net',
    marketTypes: ['prediction'],
    actions: ['bet', 'claim'],
    blinksSupported: false, // Coming soon
    marketsApiSupported: true,
    positionsApiSupported: true,
  },
};

/**
 * Protocol handler base class
 */
export class ProtocolHandler {
  protected dialect: DialectClient;
  protected blinks: BlinksExecutor;
  protected protocolId: ProtocolId;

  constructor(
    protocolId: ProtocolId,
    dialect: DialectClient,
    blinks: BlinksExecutor
  ) {
    this.protocolId = protocolId;
    this.dialect = dialect;
    this.blinks = blinks;
  }

  /**
   * Get protocol metadata
   */
  getMetadata() {
    return PROTOCOLS[this.protocolId];
  }

  /**
   * Get all markets for this protocol
   */
  async getMarkets(): Promise<Market[]> {
    return this.dialect.getMarketsByProtocol(this.protocolId);
  }

  /**
   * Get positions for this protocol
   */
  async getPositions(walletAddress: string): Promise<Position[]> {
    return this.dialect.getPositions(walletAddress, { provider: this.protocolId });
  }

  /**
   * Find market by token symbol
   */
  async findMarketByToken(symbol: string): Promise<Market | undefined> {
    const markets = await this.getMarkets();
    const symbolLower = symbol.toLowerCase();
    
    return markets.find((m) => {
      if ('token' in m && m.token?.symbol?.toLowerCase() === symbolLower) {
        return true;
      }
      return false;
    });
  }
}

// ============================================
// Protocol-Specific Handlers
// ============================================

/**
 * Kamino Handler - Lend, Borrow, Multiply, Leverage
 */
export class KaminoHandler extends ProtocolHandler {
  constructor(dialect: DialectClient, blinks: BlinksExecutor) {
    super('kamino', dialect, blinks);
  }

  async getLendMarkets(): Promise<Market[]> {
    return this.dialect.getKaminoLendMarkets();
  }

  async getBorrowMarkets(): Promise<Market[]> {
    return this.dialect.getKaminoBorrowMarkets();
  }

  async getMultiplyMarkets(): Promise<Market[]> {
    return this.dialect.getKaminoLoopMarkets();
  }

  async getDepositBlink(vaultSlug: string): Promise<string> {
    return `blink:https://kamino.dial.to/api/v0/lend/${vaultSlug}/deposit`;
  }

  async getWithdrawBlink(vaultSlug: string): Promise<string> {
    return `blink:https://kamino.dial.to/api/v0/lend/${vaultSlug}/withdraw`;
  }

  async getLendingDepositBlink(marketAddress: string, reserveAddress: string): Promise<string> {
    return `blink:https://kamino.dial.to/api/v0/lending/reserve/${marketAddress}/${reserveAddress}/deposit`;
  }

  async getLendingBorrowBlink(marketAddress: string, reserveAddress: string): Promise<string> {
    return `blink:https://kamino.dial.to/api/v0/lending/reserve/${marketAddress}/${reserveAddress}/borrow`;
  }
}

/**
 * MarginFi Handler
 */
export class MarginFiHandler extends ProtocolHandler {
  constructor(dialect: DialectClient, blinks: BlinksExecutor) {
    super('marginfi', dialect, blinks);
  }

  async getLendingMarkets(): Promise<Market[]> {
    return this.dialect.getMarginFiMarkets();
  }
}

/**
 * Jupiter Handler - Earn + Lend Borrow
 */
export class JupiterHandler extends ProtocolHandler {
  constructor(dialect: DialectClient, blinks: BlinksExecutor) {
    super('jupiter', dialect, blinks);
  }

  async getEarnMarkets(): Promise<Market[]> {
    return this.dialect.getMarkets({ provider: 'jupiter', type: 'yield' });
  }

  async getBorrowMarkets(): Promise<Market[]> {
    return this.dialect.getMarkets({ provider: 'jupiter', type: 'lending' });
  }
}

/**
 * Lulo Handler - Protected + Boosted Deposits
 */
export class LuloHandler extends ProtocolHandler {
  constructor(dialect: DialectClient, blinks: BlinksExecutor) {
    super('lulo', dialect, blinks);
  }

  async getProtectedMarkets(): Promise<Market[]> {
    const markets = await this.dialect.getLuloMarkets();
    // Protected markets don't have cooldown
    return markets.filter((m) => {
      const additionalData = m.additionalData as Record<string, unknown> | undefined;
      return !additionalData?.withdrawCooldownHours;
    });
  }

  async getBoostedMarkets(): Promise<Market[]> {
    const markets = await this.dialect.getLuloMarkets();
    // Boosted markets have cooldown
    return markets.filter((m) => {
      const additionalData = m.additionalData as Record<string, unknown> | undefined;
      return additionalData?.withdrawCooldownHours;
    });
  }
}

/**
 * DeFiTuna Handler
 */
export class DeFiTunaHandler extends ProtocolHandler {
  constructor(dialect: DialectClient, blinks: BlinksExecutor) {
    super('defituna', dialect, blinks);
  }

  async getLendMarkets(): Promise<Market[]> {
    return this.dialect.getDeFiTunaMarkets();
  }
}

/**
 * DeFiCarrot Handler
 */
export class DeFiCarrotHandler extends ProtocolHandler {
  constructor(dialect: DialectClient, blinks: BlinksExecutor) {
    super('deficarrot', dialect, blinks);
  }

  async getYieldMarkets(): Promise<Market[]> {
    return this.dialect.getDeFiCarrotMarkets();
  }
}

/**
 * Drift Handler - Strategy Vaults
 */
export class DriftHandler extends ProtocolHandler {
  constructor(dialect: DialectClient, blinks: BlinksExecutor) {
    super('drift', dialect, blinks);
  }

  async getVaults(): Promise<Market[]> {
    return this.dialect.getDriftMarkets();
  }
}

/**
 * DFlow Handler - Prediction Markets
 */
export class DFlowHandler extends ProtocolHandler {
  constructor(dialect: DialectClient, blinks: BlinksExecutor) {
    super('dflow', dialect, blinks);
  }

  async getPredictionMarkets(): Promise<Market[]> {
    return this.dialect.getDFlowMarkets();
  }
}

/**
 * Create all protocol handlers
 */
export function createProtocolHandlers(
  dialect: DialectClient,
  connection: Connection
): Record<ProtocolId, ProtocolHandler> {
  const blinks = new BlinksExecutor(connection);
  
  return {
    kamino: new KaminoHandler(dialect, blinks),
    marginfi: new MarginFiHandler(dialect, blinks),
    jupiter: new JupiterHandler(dialect, blinks),
    raydium: new ProtocolHandler('raydium', dialect, blinks),
    orca: new ProtocolHandler('orca', dialect, blinks),
    meteora: new ProtocolHandler('meteora', dialect, blinks),
    drift: new DriftHandler(dialect, blinks),
    lulo: new LuloHandler(dialect, blinks),
    save: new ProtocolHandler('save', dialect, blinks),
    defituna: new DeFiTunaHandler(dialect, blinks),
    deficarrot: new DeFiCarrotHandler(dialect, blinks),
    dflow: new DFlowHandler(dialect, blinks),
  };
}

export default PROTOCOLS;
