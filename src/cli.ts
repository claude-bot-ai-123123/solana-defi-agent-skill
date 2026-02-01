#!/usr/bin/env node
/**
 * Solana Blinks CLI
 * AI-agent ready CLI for Dialect Standard Blinks Library (SBL)
 * 
 * Full coverage of 20 protocols:
 * - Kamino: Lend, Borrow, Multiply, Leverage, LP, Farms
 * - MarginFi: Lending
 * - Jupiter: Lend Earn, Lend Borrow, SWAP
 * - Raydium: AMM, CLMM
 * - Orca: Whirlpools
 * - Meteora: DLMM
 * - Drift: Strategy Vaults
 * - Lulo: Protected, Boosted Deposits
 * - Save: Protected Deposits
 * - DeFiTuna: Lend
 * - DeFiCarrot: Yield
 * - DFlow: Prediction Markets
 */

import { Command } from 'commander';
import { config } from 'dotenv';

config();

import { DialectClient } from './lib/dialect.js';
import { BlinksExecutor } from './lib/blinks.js';
import { Wallet, getWalletBalance, getWalletTokenBalances } from './lib/wallet.js';
import { getConnection, checkConnection } from './lib/connection.js';
import { PROTOCOLS, createProtocolHandlers } from './lib/protocols.js';
import {
  formatOutput,
  formatPercent,
  formatUsd,
  success,
  error,
  info,
} from './lib/output.js';
import type { OutputFormat, MarketType, ProtocolId, Market } from './types/index.js';

const program = new Command();

// ============================================
// Global Options
// ============================================

program
  .name('blinks')
  .description('Solana Blinks CLI - Full Dialect SBL Coverage')
  .version('1.0.0')
  .option('-f, --format <format>', 'Output format: json, table, minimal', 'json')
  .option('-r, --rpc <url>', 'Solana RPC URL')
  .option('-q, --quiet', 'Minimal output')
  .hook('preAction', () => {
    const opts = program.opts();
    if (opts.rpc) {
      process.env.SOLANA_RPC_URL = opts.rpc;
    }
  });

function getFormat(): OutputFormat {
  const opts = program.opts();
  if (opts.quiet) return 'minimal';
  return (opts.format as OutputFormat) || 'json';
}

// ============================================
// Wallet Commands
// ============================================

const walletCmd = program.command('wallet').description('Wallet operations');

walletCmd
  .command('address')
  .description('Show configured wallet address')
  .action(() => {
    try {
      const wallet = Wallet.fromEnv();
      console.log(formatOutput({ address: wallet.address }, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

walletCmd
  .command('balance')
  .description('Show wallet balances')
  .option('-w, --wallet <address>', 'Wallet address (defaults to configured)')
  .action(async (opts) => {
    try {
      const connection = getConnection();
      
      if (opts.wallet) {
        const balances = await getWalletTokenBalances(connection, opts.wallet);
        console.log(formatOutput(balances, getFormat()));
      } else {
        const wallet = Wallet.fromEnv();
        const balances = await wallet.getAllBalances(connection);
        console.log(formatOutput(balances, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// ============================================
// Markets Commands
// ============================================

const marketsCmd = program.command('markets').description('Browse DeFi markets');

marketsCmd
  .command('list')
  .description('List markets by type')
  .option('-t, --type <type>', 'Market type: lending, yield, loop, perp, prediction')
  .option('-p, --provider <provider>', 'Filter by protocol (kamino, marginfi, jupiter, etc.)')
  .option('--token <symbol>', 'Filter by token symbol')
  .option('--min-apy <apy>', 'Minimum APY (decimal, e.g. 0.05 for 5%)')
  .option('--min-tvl <tvl>', 'Minimum TVL in USD')
  .option('-l, --limit <n>', 'Limit results', '20')
  .action(async (opts) => {
    try {
      const dialect = new DialectClient();
      
      let markets = await dialect.getMarkets({
        type: opts.type as MarketType | undefined,
        provider: opts.provider as ProtocolId | undefined,
        token: opts.token,
        minApy: opts.minApy ? parseFloat(opts.minApy) : undefined,
        minTvl: opts.minTvl ? parseFloat(opts.minTvl) : undefined,
      });

      markets = markets.slice(0, parseInt(opts.limit));

      // Format for output
      const formatted = markets.map((m) => ({
        id: m.id,
        type: m.type,
        provider: m.provider.name,
        token: 'token' in m ? m.token?.symbol : 
               'tokenA' in m ? `${m.tokenA?.symbol}/${m.tokenB?.symbol}` : '-',
        apy: 'depositApy' in m ? formatPercent(m.depositApy) : '-',
        tvl: 'totalDepositUsd' in m ? formatUsd((m as any).totalDepositUsd) : '-',
        actions: Object.keys(m.actions).join(', '),
      }));

      console.log(formatOutput(formatted, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

marketsCmd
  .command('best-yield')
  .description('Show best yield opportunities')
  .option('-l, --limit <n>', 'Limit results', '10')
  .action(async (opts) => {
    try {
      const dialect = new DialectClient();
      const markets = await dialect.getBestYieldMarkets(parseInt(opts.limit));
      
      const formatted = markets.map((m) => ({
        provider: m.provider.name,
        token: 'token' in m ? m.token?.symbol : '-',
        apy: 'depositApy' in m ? formatPercent(m.depositApy) : '-',
        tvl: 'totalDepositUsd' in m ? formatUsd((m as any).totalDepositUsd) : '-',
        blinkUrl: m.actions.deposit?.blinkUrl || '-',
      }));

      console.log(formatOutput(formatted, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

marketsCmd
  .command('best-borrow')
  .description('Show lowest borrow rates')
  .option('-l, --limit <n>', 'Limit results', '10')
  .action(async (opts) => {
    try {
      const dialect = new DialectClient();
      const markets = await dialect.getBestBorrowRates(parseInt(opts.limit));
      
      const formatted = markets.map((m) => ({
        provider: m.provider.name,
        token: 'token' in m ? m.token?.symbol : '-',
        borrowApy: 'borrowApy' in m ? formatPercent((m as any).borrowApy) : '-',
        maxLtv: 'maxLtv' in m ? formatPercent((m as any).maxLtv) : '-',
        blinkUrl: m.actions.borrow?.blinkUrl || '-',
      }));

      console.log(formatOutput(formatted, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

marketsCmd
  .command('search <token>')
  .description('Search markets by token symbol')
  .action(async (token) => {
    try {
      const dialect = new DialectClient();
      const markets = await dialect.searchMarketsByToken(token);
      
      const formatted = markets.map((m) => ({
        id: m.id,
        type: m.type,
        provider: m.provider.name,
        token: 'token' in m ? m.token?.symbol : 
               'tokenA' in m ? `${m.tokenA?.symbol}/${m.tokenB?.symbol}` : '-',
        apy: 'depositApy' in m ? formatPercent(m.depositApy) : '-',
      }));

      console.log(formatOutput(formatted, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// ============================================
// Positions Command
// ============================================

program
  .command('positions')
  .description('View wallet positions across protocols')
  .option('-w, --wallet <address>', 'Wallet address')
  .option('-p, --provider <provider>', 'Filter by protocol')
  .option('-t, --type <type>', 'Filter by market type')
  .action(async (opts) => {
    try {
      const dialect = new DialectClient();
      let walletAddress = opts.wallet;
      
      if (!walletAddress) {
        const wallet = Wallet.fromEnv();
        walletAddress = wallet.address;
      }

      const positions = await dialect.getPositions(walletAddress, {
        provider: opts.provider as ProtocolId | undefined,
        type: opts.type as MarketType | undefined,
      });

      const formatted = positions.map((p) => ({
        marketId: p.marketId,
        type: p.type,
        side: p.side,
        amount: p.amount,
        amountUsd: formatUsd(p.amountUsd),
        ltv: p.ltv ? formatPercent(p.ltv) : '-',
        actions: Object.keys(p.actions).join(', '),
      }));

      console.log(formatOutput(formatted, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// ============================================
// Blinks Commands (Inspect/Execute)
// ============================================

program
  .command('inspect <url>')
  .description('Inspect a blink URL')
  .action(async (url) => {
    try {
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);
      const result = await blinks.inspect(url);
      console.log(formatOutput(result, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

program
  .command('execute <url>')
  .description('Execute a blink action')
  .option('--amount <amount>', 'Amount parameter')
  .option('--dry-run', 'Simulate without executing')
  .option('-p, --params <json>', 'Additional params as JSON')
  .action(async (url, opts) => {
    try {
      const wallet = Wallet.fromEnv();
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);

      // Build params
      const params: Record<string, string | number> = {};
      if (opts.amount) params.amount = opts.amount;
      if (opts.params) {
        Object.assign(params, JSON.parse(opts.params));
      }

      // Get transaction
      info(`Fetching transaction from blink...`);
      const blinkTx = await blinks.getTransaction(url, wallet.address, params);

      if (opts.dryRun) {
        // Simulate
        const simResult = await blinks.simulate(blinkTx);
        console.log(formatOutput({
          success: simResult.success,
          unitsConsumed: simResult.unitsConsumed,
          error: simResult.error,
          message: blinkTx.message,
        }, getFormat()));
      } else {
        // Execute
        info(`Signing and sending transaction...`);
        const signature = await blinks.signAndSend(blinkTx, wallet.getSigner());
        success(`Transaction confirmed!`);
        console.log(formatOutput({
          signature,
          explorer: `https://solscan.io/tx/${signature}`,
          message: blinkTx.message,
        }, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// ============================================
// Protocol Commands
// ============================================

program
  .command('protocols')
  .description('List all supported protocols')
  .action(() => {
    const formatted = Object.values(PROTOCOLS).map((p) => ({
      name: p.name,
      displayName: p.displayName,
      category: p.category,
      marketTypes: p.marketTypes.join(', ') || '-',
      actions: p.actions.join(', '),
      marketsApi: p.marketsApiSupported ? '✓' : 'soon',
      positionsApi: p.positionsApiSupported ? '✓' : 'soon',
      blinks: p.blinksSupported ? '✓' : 'soon',
    }));
    console.log(formatOutput(formatted, getFormat()));
  });

// ============================================
// Kamino Commands
// ============================================

const kaminoCmd = program.command('kamino').description('Kamino Finance operations');

kaminoCmd
  .command('markets')
  .description('List Kamino markets')
  .option('-t, --type <type>', 'Type: lend, borrow, multiply')
  .action(async (opts) => {
    try {
      const dialect = new DialectClient();
      let markets: Market[];
      
      if (opts.type === 'lend') {
        markets = await dialect.getKaminoLendMarkets();
      } else if (opts.type === 'borrow') {
        markets = await dialect.getKaminoBorrowMarkets();
      } else if (opts.type === 'multiply') {
        markets = await dialect.getKaminoLoopMarkets();
      } else {
        markets = await dialect.getMarketsByProtocol('kamino');
      }

      const formatted = markets.map((m) => ({
        id: m.id,
        type: m.type,
        token: 'token' in m ? m.token?.symbol : 
               'tokenA' in m ? `${m.tokenA?.symbol}/${m.tokenB?.symbol}` : '-',
        apy: 'depositApy' in m ? formatPercent(m.depositApy) : '-',
        tvl: 'totalDepositUsd' in m ? formatUsd((m as any).totalDepositUsd) : '-',
      }));

      console.log(formatOutput(formatted, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

kaminoCmd
  .command('deposit')
  .description('Deposit to Kamino Lend vault')
  .requiredOption('--vault <slug>', 'Vault slug (e.g., usdc-prime)')
  .requiredOption('--amount <amount>', 'Amount to deposit')
  .option('--dry-run', 'Simulate without executing')
  .action(async (opts) => {
    try {
      const wallet = Wallet.fromEnv();
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);

      const blinkUrl = `blink:https://kamino.dial.to/api/v0/lend/${opts.vault}/deposit`;
      
      info(`Depositing ${opts.amount} to ${opts.vault}...`);
      const blinkTx = await blinks.getTransaction(blinkUrl, wallet.address, {
        amount: opts.amount,
      });

      if (opts.dryRun) {
        const simResult = await blinks.simulate(blinkTx);
        console.log(formatOutput(simResult, getFormat()));
      } else {
        const signature = await blinks.signAndSend(blinkTx, wallet.getSigner());
        success(`Deposit confirmed!`);
        console.log(formatOutput({
          signature,
          explorer: `https://solscan.io/tx/${signature}`,
        }, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

kaminoCmd
  .command('withdraw')
  .description('Withdraw from Kamino Lend vault')
  .requiredOption('--vault <slug>', 'Vault slug')
  .requiredOption('--amount <amount>', 'Amount to withdraw')
  .option('--dry-run', 'Simulate')
  .action(async (opts) => {
    try {
      const wallet = Wallet.fromEnv();
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);

      const blinkUrl = `blink:https://kamino.dial.to/api/v0/lend/${opts.vault}/withdraw`;
      
      info(`Withdrawing ${opts.amount} from ${opts.vault}...`);
      const blinkTx = await blinks.getTransaction(blinkUrl, wallet.address, {
        amount: opts.amount,
      });

      if (opts.dryRun) {
        const simResult = await blinks.simulate(blinkTx);
        console.log(formatOutput(simResult, getFormat()));
      } else {
        const signature = await blinks.signAndSend(blinkTx, wallet.getSigner());
        success(`Withdrawal confirmed!`);
        console.log(formatOutput({
          signature,
          explorer: `https://solscan.io/tx/${signature}`,
        }, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

kaminoCmd
  .command('borrow')
  .description('Borrow from Kamino lending market')
  .requiredOption('--market <address>', 'Market address')
  .requiredOption('--reserve <address>', 'Reserve address')
  .requiredOption('--amount <amount>', 'Amount to borrow')
  .option('--dry-run', 'Simulate')
  .action(async (opts) => {
    try {
      const wallet = Wallet.fromEnv();
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);

      const blinkUrl = `blink:https://kamino.dial.to/api/v0/lending/reserve/${opts.market}/${opts.reserve}/borrow`;
      
      info(`Borrowing ${opts.amount}...`);
      const blinkTx = await blinks.getTransaction(blinkUrl, wallet.address, {
        amount: opts.amount,
      });

      if (opts.dryRun) {
        const simResult = await blinks.simulate(blinkTx);
        console.log(formatOutput(simResult, getFormat()));
      } else {
        const signature = await blinks.signAndSend(blinkTx, wallet.getSigner());
        success(`Borrow confirmed!`);
        console.log(formatOutput({
          signature,
          explorer: `https://solscan.io/tx/${signature}`,
        }, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

kaminoCmd
  .command('repay')
  .description('Repay Kamino loan')
  .requiredOption('--market <address>', 'Market address')
  .requiredOption('--reserve <address>', 'Reserve address')
  .requiredOption('--amount <amount>', 'Amount to repay')
  .option('--dry-run', 'Simulate')
  .action(async (opts) => {
    try {
      const wallet = Wallet.fromEnv();
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);

      const blinkUrl = `blink:https://kamino.dial.to/api/v0/lending/reserve/${opts.market}/${opts.reserve}/repay`;
      
      info(`Repaying ${opts.amount}...`);
      const blinkTx = await blinks.getTransaction(blinkUrl, wallet.address, {
        amount: opts.amount,
      });

      if (opts.dryRun) {
        const simResult = await blinks.simulate(blinkTx);
        console.log(formatOutput(simResult, getFormat()));
      } else {
        const signature = await blinks.signAndSend(blinkTx, wallet.getSigner());
        success(`Repayment confirmed!`);
        console.log(formatOutput({
          signature,
          explorer: `https://solscan.io/tx/${signature}`,
        }, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

kaminoCmd
  .command('multiply')
  .description('Open Kamino multiply position')
  .requiredOption('--market <address>', 'Market address')
  .requiredOption('--coll-token <mint>', 'Collateral token mint')
  .requiredOption('--debt-token <mint>', 'Debt token mint')
  .requiredOption('--amount <amount>', 'Amount')
  .option('--leverage <x>', 'Leverage multiplier')
  .option('--dry-run', 'Simulate')
  .action(async (opts) => {
    try {
      const wallet = Wallet.fromEnv();
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);

      const blinkUrl = `blink:https://kamino.dial.to/api/v0/multiply/${opts.market}/deposit?collTokenMint=${opts.collToken}&debtTokenMint=${opts.debtToken}`;
      
      const params: Record<string, string | number> = { amount: opts.amount };
      if (opts.leverage) params.leverage = opts.leverage;
      
      info(`Opening multiply position...`);
      const blinkTx = await blinks.getTransaction(blinkUrl, wallet.address, params);

      if (opts.dryRun) {
        const simResult = await blinks.simulate(blinkTx);
        console.log(formatOutput(simResult, getFormat()));
      } else {
        const signature = await blinks.signAndSend(blinkTx, wallet.getSigner());
        success(`Position opened!`);
        console.log(formatOutput({
          signature,
          explorer: `https://solscan.io/tx/${signature}`,
        }, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// ============================================
// MarginFi Commands
// ============================================

const marginfiCmd = program.command('marginfi').description('MarginFi operations');

marginfiCmd
  .command('markets')
  .description('List MarginFi lending markets')
  .action(async () => {
    try {
      const dialect = new DialectClient();
      const markets = await dialect.getMarginFiMarkets();

      const formatted = markets.map((m) => ({
        id: m.id,
        token: 'token' in m ? m.token?.symbol : '-',
        depositApy: 'depositApy' in m ? formatPercent(m.depositApy) : '-',
        borrowApy: 'borrowApy' in m ? formatPercent((m as any).borrowApy) : '-',
        maxLtv: 'maxLtv' in m ? formatPercent((m as any).maxLtv) : '-',
      }));

      console.log(formatOutput(formatted, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

marginfiCmd
  .command('deposit')
  .description('Deposit to MarginFi')
  .requiredOption('--market <id>', 'Market ID')
  .requiredOption('--amount <amount>', 'Amount')
  .option('--dry-run', 'Simulate')
  .action(async (opts) => {
    try {
      const wallet = Wallet.fromEnv();
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);
      const dialect = new DialectClient();

      const market = await dialect.getMarket(opts.market);
      if (!market?.actions.deposit?.blinkUrl) {
        throw new Error('Market not found or deposit not supported');
      }

      const blinkTx = await blinks.getTransaction(
        market.actions.deposit.blinkUrl,
        wallet.address,
        { amount: opts.amount }
      );

      if (opts.dryRun) {
        const simResult = await blinks.simulate(blinkTx);
        console.log(formatOutput(simResult, getFormat()));
      } else {
        const signature = await blinks.signAndSend(blinkTx, wallet.getSigner());
        success(`Deposit confirmed!`);
        console.log(formatOutput({ signature }, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// ============================================
// Jupiter Lend Commands
// ============================================

const jupiterLendCmd = program.command('jupiter-lend').description('Jupiter lending operations');

jupiterLendCmd
  .command('markets')
  .description('List Jupiter lending markets')
  .option('-t, --type <type>', 'Type: earn or borrow')
  .action(async (opts) => {
    try {
      const dialect = new DialectClient();
      const markets = await dialect.getJupiterMarkets();

      const filtered = opts.type
        ? markets.filter((m) => 
            opts.type === 'earn' ? m.type === 'yield' : m.type === 'lending'
          )
        : markets;

      const formatted = filtered.map((m) => ({
        id: m.id,
        type: m.type,
        token: 'token' in m ? m.token?.symbol : '-',
        apy: 'depositApy' in m ? formatPercent(m.depositApy) : '-',
      }));

      console.log(formatOutput(formatted, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// ============================================
// Lulo Commands
// ============================================

const luloCmd = program.command('lulo').description('Lulo yield operations');

luloCmd
  .command('markets')
  .description('List Lulo markets')
  .option('-t, --type <type>', 'Type: protected or boosted')
  .action(async (opts) => {
    try {
      const dialect = new DialectClient();
      const markets = await dialect.getLuloMarkets();

      const formatted = markets.map((m) => {
        const additionalData = m.additionalData as Record<string, unknown> | undefined;
        const isBoosted = !!additionalData?.withdrawCooldownHours;
        return {
          id: m.id,
          token: 'token' in m ? m.token?.symbol : '-',
          apy: 'depositApy' in m ? formatPercent(m.depositApy) : '-',
          type: isBoosted ? 'boosted' : 'protected',
          cooldown: additionalData?.withdrawCooldownHours || '-',
        };
      });

      const filtered = opts.type
        ? formatted.filter((m) => m.type === opts.type)
        : formatted;

      console.log(formatOutput(filtered, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

luloCmd
  .command('deposit')
  .description('Deposit to Lulo')
  .requiredOption('--market <id>', 'Market ID')
  .requiredOption('--amount <amount>', 'Amount')
  .option('--dry-run', 'Simulate')
  .action(async (opts) => {
    try {
      const wallet = Wallet.fromEnv();
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);
      const dialect = new DialectClient();

      const market = await dialect.getMarket(opts.market);
      if (!market?.actions.deposit?.blinkUrl) {
        throw new Error('Market not found or deposit not supported');
      }

      const blinkTx = await blinks.getTransaction(
        market.actions.deposit.blinkUrl,
        wallet.address,
        { amount: opts.amount }
      );

      if (opts.dryRun) {
        const simResult = await blinks.simulate(blinkTx);
        console.log(formatOutput(simResult, getFormat()));
      } else {
        const signature = await blinks.signAndSend(blinkTx, wallet.getSigner());
        success(`Deposit confirmed!`);
        console.log(formatOutput({ signature }, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// ============================================
// Drift Commands
// ============================================

const driftCmd = program.command('drift').description('Drift strategy vault operations');

driftCmd
  .command('vaults')
  .description('List Drift strategy vaults')
  .action(async () => {
    try {
      const dialect = new DialectClient();
      const markets = await dialect.getDriftMarkets();

      const formatted = markets.map((m) => ({
        id: m.id,
        token: 'token' in m ? m.token?.symbol : '-',
        apy: 'depositApy' in m ? formatPercent(m.depositApy) : '-',
      }));

      console.log(formatOutput(formatted, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

driftCmd
  .command('vault-deposit')
  .description('Deposit to Drift vault')
  .requiredOption('--vault <id>', 'Vault ID')
  .requiredOption('--amount <amount>', 'Amount')
  .option('--dry-run', 'Simulate')
  .action(async (opts) => {
    try {
      const wallet = Wallet.fromEnv();
      const connection = getConnection();
      const blinks = new BlinksExecutor(connection);
      const dialect = new DialectClient();

      const market = await dialect.getMarket(opts.vault);
      if (!market?.actions.deposit?.blinkUrl) {
        throw new Error('Vault not found or deposit not supported');
      }

      const blinkTx = await blinks.getTransaction(
        market.actions.deposit.blinkUrl,
        wallet.address,
        { amount: opts.amount }
      );

      if (opts.dryRun) {
        const simResult = await blinks.simulate(blinkTx);
        console.log(formatOutput(simResult, getFormat()));
      } else {
        const signature = await blinks.signAndSend(blinkTx, wallet.getSigner());
        success(`Vault deposit confirmed!`);
        console.log(formatOutput({ signature }, getFormat()));
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// ============================================
// AMM Commands (Raydium, Orca, Meteora)
// ============================================

const raydiumCmd = program.command('raydium').description('Raydium AMM operations');

raydiumCmd
  .command('pools')
  .description('List Raydium pools (coming soon)')
  .action(() => {
    info('Raydium pool listing via Dialect API coming soon');
    info('Use: blinks inspect <raydium-blink-url> to inspect specific pools');
  });

const orcaCmd = program.command('orca').description('Orca Whirlpool operations');

orcaCmd
  .command('pools')
  .description('List Orca Whirlpools (coming soon)')
  .action(() => {
    info('Orca pool listing via Dialect API coming soon');
    info('Use: blinks inspect <orca-blink-url> to inspect specific pools');
  });

const meteoraCmd = program.command('meteora').description('Meteora DLMM operations');

meteoraCmd
  .command('pools')
  .description('List Meteora DLMM pools (coming soon)')
  .action(() => {
    info('Meteora pool listing via Dialect API coming soon');
    info('Use: blinks inspect <meteora-blink-url> to inspect specific pools');
  });

// ============================================
// Status Command
// ============================================

program
  .command('status')
  .description('Check connection and configuration status')
  .action(async () => {
    try {
      const connection = getConnection();
      const health = await checkConnection(connection);
      
      let wallet = 'Not configured';
      try {
        const w = Wallet.fromEnv();
        wallet = w.address;
      } catch {
        // Not configured
      }

      console.log(formatOutput({
        rpc: {
          url: connection.rpcEndpoint,
          healthy: health.healthy,
          slot: health.slot,
          version: health.version,
        },
        wallet,
        dialectApi: 'https://api.dialect.to',
      }, getFormat()));
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  });

// Parse and run
program.parse();
