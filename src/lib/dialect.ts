/**
 * Dialect Markets & Positions API Client
 * Full coverage of the Standard Blinks Library (SBL)
 */

import type {
  Market,
  MarketsResponse,
  MarketsGroupedResponse,
  Position,
  PositionsResponse,
  HistoricalPositionsResponse,
  MarketFilter,
  PositionFilter,
  ProtocolId,
  MarketType,
} from '../types/index.js';

const DIALECT_API_BASE = 'https://api.dialect.to';

export interface DialectClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Dialect API Client for Markets and Positions
 */
export class DialectClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(options: DialectClientOptions = {}) {
    this.baseUrl = options.baseUrl || DIALECT_API_BASE;
    this.apiKey = options.apiKey;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value);
        }
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`Dialect API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // ============================================
  // Markets Endpoints
  // ============================================

  /**
   * Get all markets from the Dialect API
   */
  async getMarkets(filter?: MarketFilter): Promise<Market[]> {
    const params: Record<string, string> = {};
    
    if (filter?.type) {
      params.type = Array.isArray(filter.type) ? filter.type.join(',') : filter.type;
    }
    if (filter?.provider) {
      params.provider = Array.isArray(filter.provider) ? filter.provider.join(',') : filter.provider;
    }
    if (filter?.token) {
      params.token = filter.token;
    }

    const response = await this.fetch<MarketsResponse>('/v1/markets', params);
    let markets = response.markets;

    // Apply local filters
    if (filter?.minApy !== undefined) {
      const minApyThreshold = filter.minApy;
      markets = markets.filter((m) => {
        const apy = 'depositApy' in m ? (m.depositApy ?? 0) : 0;
        return apy >= minApyThreshold;
      });
    }
    if (filter?.maxApy !== undefined) {
      const maxApyThreshold = filter.maxApy;
      markets = markets.filter((m) => {
        const apy = 'depositApy' in m ? (m.depositApy ?? 0) : 0;
        return apy <= maxApyThreshold;
      });
    }
    if (filter?.minTvl !== undefined) {
      markets = markets.filter((m) => {
        const tvl = 'totalDepositUsd' in m ? (m as any).totalDepositUsd : 0;
        return tvl >= (filter.minTvl || 0);
      });
    }

    return markets;
  }

  /**
   * Get markets grouped by type
   */
  async getMarketsGrouped(): Promise<MarketsGroupedResponse> {
    return this.fetch<MarketsGroupedResponse>('/v1/markets/grouped');
  }

  /**
   * Get markets by protocol
   */
  async getMarketsByProtocol(protocol: ProtocolId): Promise<Market[]> {
    return this.getMarkets({ provider: protocol });
  }

  /**
   * Get markets by type
   */
  async getMarketsByType(type: MarketType): Promise<Market[]> {
    return this.getMarkets({ type });
  }

  /**
   * Get a specific market by ID
   */
  async getMarket(marketId: string): Promise<Market | undefined> {
    const markets = await this.getMarkets();
    return markets.find((m) => m.id === marketId);
  }

  // ============================================
  // Positions Endpoints
  // ============================================

  /**
   * Get all positions for a wallet
   */
  async getPositions(walletAddress: string, filter?: PositionFilter): Promise<Position[]> {
    const params: Record<string, string> = {};
    
    if (filter?.type) {
      params.type = Array.isArray(filter.type) ? filter.type.join(',') : filter.type;
    }
    if (filter?.provider) {
      params.provider = Array.isArray(filter.provider) ? filter.provider.join(',') : filter.provider;
    }
    if (filter?.side) {
      params.side = filter.side;
    }

    const response = await this.fetch<PositionsResponse>(`/v1/positions/${walletAddress}`, params);
    return response.positions;
  }

  /**
   * Get historical position snapshots
   */
  async getHistoricalPositions(
    walletAddress: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<HistoricalPositionsResponse> {
    const params: Record<string, string> = {};
    
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    if (endDate) {
      params.endDate = endDate.toISOString();
    }

    return this.fetch<HistoricalPositionsResponse>(
      `/v1/positions/${walletAddress}/history`,
      params
    );
  }

  // ============================================
  // Protocol-Specific Helpers
  // ============================================

  /**
   * Get Kamino Lend (yield) markets
   */
  async getKaminoLendMarkets() {
    const markets = await this.getMarkets({ provider: 'kamino', type: 'yield' });
    return markets;
  }

  /**
   * Get Kamino Borrow (lending) markets
   */
  async getKaminoBorrowMarkets() {
    const markets = await this.getMarkets({ provider: 'kamino', type: 'lending' });
    return markets;
  }

  /**
   * Get Kamino Multiply/Leverage (loop) markets
   */
  async getKaminoLoopMarkets() {
    const markets = await this.getMarkets({ provider: 'kamino', type: 'loop' });
    return markets;
  }

  /**
   * Get MarginFi lending markets
   */
  async getMarginFiMarkets() {
    return this.getMarketsByProtocol('marginfi');
  }

  /**
   * Get Jupiter lending markets (earn + borrow)
   */
  async getJupiterMarkets() {
    return this.getMarketsByProtocol('jupiter');
  }

  /**
   * Get Lulo markets (protected + boosted)
   */
  async getLuloMarkets() {
    return this.getMarketsByProtocol('lulo');
  }

  /**
   * Get DeFiTuna lend markets
   */
  async getDeFiTunaMarkets() {
    return this.getMarketsByProtocol('defituna');
  }

  /**
   * Get DeFiCarrot yield markets
   */
  async getDeFiCarrotMarkets() {
    return this.getMarketsByProtocol('deficarrot');
  }

  /**
   * Get Drift strategy vault markets
   */
  async getDriftMarkets() {
    return this.getMarketsByProtocol('drift');
  }

  /**
   * Get Save protected deposit markets
   */
  async getSaveMarkets() {
    return this.getMarketsByProtocol('save');
  }

  /**
   * Get DFlow prediction markets
   */
  async getDFlowMarkets() {
    return this.getMarketsByProtocol('dflow');
  }

  // ============================================
  // Aggregated Queries
  // ============================================

  /**
   * Get best yield markets by APY
   */
  async getBestYieldMarkets(limit = 10): Promise<Market[]> {
    const markets = await this.getMarkets({ type: 'yield' });
    return markets
      .filter((m): m is Market & { depositApy: number } => 'depositApy' in m)
      .sort((a, b) => b.depositApy - a.depositApy)
      .slice(0, limit);
  }

  /**
   * Get best lending rates (lowest borrow APY)
   */
  async getBestBorrowRates(limit = 10): Promise<Market[]> {
    const markets = await this.getMarkets({ type: 'lending' });
    return markets
      .filter((m): m is Market & { borrowApy: number } => 'borrowApy' in m)
      .sort((a, b) => a.borrowApy - b.borrowApy)
      .slice(0, limit);
  }

  /**
   * Get top TVL markets
   */
  async getTopTVLMarkets(limit = 10): Promise<Market[]> {
    const markets = await this.getMarkets();
    return markets
      .filter((m): m is Market & { totalDepositUsd: number } => 'totalDepositUsd' in m)
      .sort((a, b) => b.totalDepositUsd - a.totalDepositUsd)
      .slice(0, limit);
  }

  /**
   * Search markets by token symbol
   */
  async searchMarketsByToken(symbol: string): Promise<Market[]> {
    const markets = await this.getMarkets();
    const symbolLower = symbol.toLowerCase();
    
    return markets.filter((m) => {
      if ('token' in m && m.token?.symbol?.toLowerCase().includes(symbolLower)) {
        return true;
      }
      if ('tokenA' in m && m.tokenA?.symbol?.toLowerCase().includes(symbolLower)) {
        return true;
      }
      if ('tokenB' in m && m.tokenB?.symbol?.toLowerCase().includes(symbolLower)) {
        return true;
      }
      return false;
    });
  }
}

// Default singleton instance
let defaultClient: DialectClient | null = null;

export function getDialectClient(options?: DialectClientOptions): DialectClient {
  if (!defaultClient || options) {
    defaultClient = new DialectClient(options);
  }
  return defaultClient;
}

export default DialectClient;
