#!/usr/bin/env ts-node

import { Command } from 'commander';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { config } from '../src/config';
import { TokenOperations } from '../src/token/operations';
import { MetadataManager } from '../src/token/metadata';
import { loadWallet, WalletManager } from '../src/utils/wallet';
import { logger } from '../src/utils/logger';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

// Load deployment info
function loadDeployment(network: string = config.network.cluster): any {
  const deploymentFile = path.join(
    __dirname,
    '../deployments',
    `${network}-latest.json`
  );

  if (!fs.existsSync(deploymentFile)) {
    logger.error(`No deployment found for ${network}`);
    logger.info(`Deploy first with: npm run deploy:${network}`);
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
}

// Initialize connection and token operations
async function initializeOps(): Promise<{
  connection: Connection;
  deployer: Keypair;
  tokenOps: TokenOperations;
  mint: PublicKey;
}> {
  const connection = new Connection(config.network.rpcUrl, config.network.commitment);
  const deployer = await loadWallet();
  const tokenOps = new TokenOperations(connection, deployer);
  const deployment = loadDeployment();
  const mint = new PublicKey(deployment.mintAddress);

  return { connection, deployer, tokenOps, mint };
}

// Command: Info - Display token information
program
  .command('info')
  .description('Display token information')
  .action(async () => {
    try {
      logger.header('Token Information');

      const deployment = loadDeployment();
      const { connection, tokenOps, mint } = await initializeOps();

      const tokenInfo = await tokenOps.getTokenInfo(mint);
      const supply = await tokenOps.getTotalSupply(mint, tokenInfo.decimals);

      logger.table({
        'Token Mint': mint.toBase58(),
        'Name': config.token.name,
        'Symbol': config.token.symbol,
        'Decimals': tokenInfo.decimals,
        'Total Supply': `${supply.toLocaleString()} ${config.token.symbol}`,
        'Mint Authority': tokenInfo.mintAuthority?.toBase58() || 'Revoked',
        'Freeze Authority': tokenInfo.freezeAuthority?.toBase58() || 'Revoked',
        'Network': config.network.cluster,
        'Deployed': new Date(deployment.timestamp).toLocaleString(),
      });

      logger.newline();
      logger.info('Explorer:');
      logger.link(config.getTokenExplorerUrl(mint.toBase58()));
    } catch (error) {
      logger.error('Failed to get token info:', error);
      process.exit(1);
    }
  });

// Command: Balance - Check token balance
program
  .command('balance <wallet>')
  .description('Check token balance for a wallet')
  .action(async (wallet: string) => {
    try {
      const { connection, tokenOps, mint } = await initializeOps();

      const walletPubkey = new PublicKey(wallet);
      const tokenInfo = await tokenOps.getTokenInfo(mint);

      const tokenAccount = await tokenOps.getOrCreateTokenAccount(
        mint,
        walletPubkey
      );

      const balance = await tokenOps.getBalance(tokenAccount, tokenInfo.decimals);

      logger.success(`Balance: ${balance.toLocaleString()} ${config.token.symbol}`);
      logger.info(`Wallet: ${wallet}`);
      logger.info(`Token Account: ${tokenAccount.toBase58()}`);
    } catch (error) {
      logger.error('Failed to get balance:', error);
      process.exit(1);
    }
  });

// Command: Mint - Mint new tokens
program
  .command('mint <amount> <recipient>')
  .description('Mint tokens to a recipient (requires mint authority)')
  .action(async (amount: string, recipient: string) => {
    try {
      const { deployer, tokenOps, mint } = await initializeOps();

      const recipientPubkey = new PublicKey(recipient);
      const tokenInfo = await tokenOps.getTokenInfo(mint);

      if (!tokenInfo.mintAuthority) {
        logger.error('Mint authority has been revoked - cannot mint more tokens');
        process.exit(1);
      }

      const recipientAccount = await tokenOps.getOrCreateTokenAccount(
        mint,
        recipientPubkey
      );

      const signature = await tokenOps.mintTokens(
        mint,
        recipientAccount,
        parseFloat(amount),
        tokenInfo.decimals,
        deployer
      );

      logger.success(`Minted ${amount} ${config.token.symbol}`);
      logger.info(`Recipient: ${recipient}`);
      logger.link(config.getExplorerUrl(signature), 'View transaction');
    } catch (error) {
      logger.error('Failed to mint tokens:', error);
      process.exit(1);
    }
  });

// Command: Burn - Burn tokens
program
  .command('burn <amount>')
  .description('Burn tokens from your wallet')
  .action(async (amount: string) => {
    try {
      const { deployer, tokenOps, mint } = await initializeOps();

      const tokenInfo = await tokenOps.getTokenInfo(mint);
      const tokenAccount = await tokenOps.getOrCreateTokenAccount(
        mint,
        deployer.publicKey
      );

      const currentBalance = await tokenOps.getBalance(
        tokenAccount,
        tokenInfo.decimals
      );

      if (parseFloat(amount) > currentBalance) {
        logger.error('Insufficient balance');
        logger.info(`Current balance: ${currentBalance} ${config.token.symbol}`);
        process.exit(1);
      }

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Burn ${amount} ${config.token.symbol}? This cannot be undone.`,
          default: false,
        },
      ]);

      if (!confirm) {
        logger.warn('Burn cancelled');
        return;
      }

      const signature = await tokenOps.burnTokens(
        mint,
        tokenAccount,
        parseFloat(amount),
        tokenInfo.decimals,
        deployer
      );

      logger.success(`Burned ${amount} ${config.token.symbol}`);
      logger.link(config.getExplorerUrl(signature), 'View transaction');
    } catch (error) {
      logger.error('Failed to burn tokens:', error);
      process.exit(1);
    }
  });

// Command: Transfer - Transfer tokens
program
  .command('transfer <amount> <recipient>')
  .description('Transfer tokens to another wallet')
  .action(async (amount: string, recipient: string) => {
    try {
      const { deployer, tokenOps, mint } = await initializeOps();

      const recipientPubkey = new PublicKey(recipient);
      const tokenInfo = await tokenOps.getTokenInfo(mint);

      const fromAccount = await tokenOps.getOrCreateTokenAccount(
        mint,
        deployer.publicKey
      );

      const toAccount = await tokenOps.getOrCreateTokenAccount(
        mint,
        recipientPubkey
      );

      const signature = await tokenOps.transferTokens(
        mint,
        fromAccount,
        toAccount,
        parseFloat(amount),
        tokenInfo.decimals,
        deployer
      );

      logger.success(`Transferred ${amount} ${config.token.symbol}`);
      logger.info(`To: ${recipient}`);
      logger.link(config.getExplorerUrl(signature), 'View transaction');
    } catch (error) {
      logger.error('Failed to transfer tokens:', error);
      process.exit(1);
    }
  });

// Command: Freeze - Freeze an account
program
  .command('freeze <wallet>')
  .description('Freeze a token account (requires freeze authority)')
  .action(async (wallet: string) => {
    try {
      const { deployer, tokenOps, mint } = await initializeOps();

      const walletPubkey = new PublicKey(wallet);
      const tokenInfo = await tokenOps.getTokenInfo(mint);

      if (!tokenInfo.freezeAuthority) {
        logger.error('Freeze authority has been revoked');
        process.exit(1);
      }

      const tokenAccount = await tokenOps.getOrCreateTokenAccount(
        mint,
        walletPubkey
      );

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Freeze account for ${wallet}?`,
          default: false,
        },
      ]);

      if (!confirm) {
        logger.warn('Freeze cancelled');
        return;
      }

      const signature = await tokenOps.freezeAccount(mint, tokenAccount, deployer);

      logger.success('Account frozen');
      logger.link(config.getExplorerUrl(signature), 'View transaction');
    } catch (error) {
      logger.error('Failed to freeze account:', error);
      process.exit(1);
    }
  });

// Command: Thaw - Unfreeze an account
program
  .command('thaw <wallet>')
  .description('Unfreeze a token account (requires freeze authority)')
  .action(async (wallet: string) => {
    try {
      const { deployer, tokenOps, mint } = await initializeOps();

      const walletPubkey = new PublicKey(wallet);
      const tokenInfo = await tokenOps.getTokenInfo(mint);

      if (!tokenInfo.freezeAuthority) {
        logger.error('Freeze authority has been revoked');
        process.exit(1);
      }

      const tokenAccount = await tokenOps.getOrCreateTokenAccount(
        mint,
        walletPubkey
      );

      const signature = await tokenOps.thawAccount(mint, tokenAccount, deployer);

      logger.success('Account unfrozen');
      logger.link(config.getExplorerUrl(signature), 'View transaction');
    } catch (error) {
      logger.error('Failed to thaw account:', error);
      process.exit(1);
    }
  });

// Command: Revoke - Revoke authority
program
  .command('revoke <authority>')
  .description('Revoke mint or freeze authority (permanent)')
  .action(async (authority: string) => {
    try {
      if (authority !== 'mint' && authority !== 'freeze') {
        logger.error('Authority must be "mint" or "freeze"');
        process.exit(1);
      }

      const { deployer, tokenOps, mint } = await initializeOps();

      logger.warn(`You are about to PERMANENTLY revoke ${authority} authority!`);
      logger.warn('This action CANNOT be undone!');

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Type "REVOKE" to confirm:`,
          default: false,
        },
      ]);

      if (!confirm) {
        logger.warn('Revocation cancelled');
        return;
      }

      const authorityType = authority === 'mint' ? 0 : 1; // MintTokens or FreezeAccount

      const signature = await tokenOps.setAuthority(
        mint,
        authorityType,
        deployer,
        null
      );

      logger.success(`${authority} authority permanently revoked`);
      logger.link(config.getExplorerUrl(signature), 'View transaction');
    } catch (error) {
      logger.error('Failed to revoke authority:', error);
      process.exit(1);
    }
  });

// Command: Airdrop - Distribute tokens to multiple wallets
program
  .command('airdrop <file>')
  .description('Airdrop tokens to multiple wallets from CSV file')
  .action(async (file: string) => {
    try {
      if (!fs.existsSync(file)) {
        logger.error(`File not found: ${file}`);
        process.exit(1);
      }

      const { deployer, tokenOps, mint } = await initializeOps();
      const tokenInfo = await tokenOps.getTokenInfo(mint);

      // Parse CSV file (format: wallet,amount)
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());
      const recipients: Array<{ wallet: string; amount: number }> = [];

      for (const line of lines) {
        const [wallet, amount] = line.split(',').map((s) => s.trim());
        if (wallet && amount) {
          recipients.push({ wallet, amount: parseFloat(amount) });
        }
      }

      if (recipients.length === 0) {
        logger.error('No valid recipients found in file');
        process.exit(1);
      }

      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

      logger.info(`Found ${recipients.length} recipients`);
      logger.info(`Total amount: ${totalAmount.toLocaleString()} ${config.token.symbol}`);

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Proceed with airdrop?',
          default: false,
        },
      ]);

      if (!confirm) {
        logger.warn('Airdrop cancelled');
        return;
      }

      logger.section('Processing Airdrop');

      const fromAccount = await tokenOps.getOrCreateTokenAccount(
        mint,
        deployer.publicKey
      );

      for (let i = 0; i < recipients.length; i++) {
        const { wallet, amount } = recipients[i];
        logger.progress(i + 1, recipients.length, `${wallet.slice(0, 8)}...`);

        try {
          const recipientPubkey = new PublicKey(wallet);
          const toAccount = await tokenOps.getOrCreateTokenAccount(
            mint,
            recipientPubkey
          );

          await tokenOps.transferTokens(
            mint,
            fromAccount,
            toAccount,
            amount,
            tokenInfo.decimals,
            deployer
          );
        } catch (error) {
          logger.error(`Failed for ${wallet}:`, error);
        }
      }

      logger.success('Airdrop completed!');
    } catch (error) {
      logger.error('Airdrop failed:', error);
      process.exit(1);
    }
  });

// Parse and execute
program
  .name('token-cli')
  .description('Solana SPL Token Management CLI')
  .version('1.0.0');

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
