#!/usr/bin/env ts-node

import { Connection, Keypair } from '@solana/web3.js';
import { config } from '../src/config';
import { TokenOperations } from '../src/token/operations';
import { MetadataManager, TokenMetadata } from '../src/token/metadata';
import { loadWallet } from '../src/utils/wallet';
import { logger } from '../src/utils/logger';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';

interface DeploymentResult {
  network: string;
  mintAddress: string;
  deployer: string;
  decimals: number;
  initialSupply: number;
  metadataUri?: string;
  metadataAccount?: string;
  timestamp: string;
  transactions: Record<string, string>;
}

async function confirmDeployment(): Promise<boolean> {
  logger.header('Mainnet Deployment Confirmation');
  logger.warn('You are about to deploy to Solana MAINNET!');
  logger.warn('This will use real SOL and create a permanent token.');
  logger.newline();

  logger.table({
    'Network': 'mainnet-beta',
    'Token Name': config.token.name,
    'Token Symbol': config.token.symbol,
    'Total Supply': config.token.totalSupply.toLocaleString(),
    'Initial Mint': config.token.initialMintAmount.toLocaleString(),
    'Decimals': config.token.decimals,
  });

  logger.newline();
  logger.section('Pre-Deployment Checklist');
  logger.info('☐ Token specifications reviewed and finalized');
  logger.info('☐ Logo uploaded to permanent storage (Arweave/IPFS)');
  logger.info('☐ Metadata JSON prepared and hosted');
  logger.info('☐ Sufficient SOL balance (~0.1 SOL minimum)');
  logger.info('☐ Deployer wallet securely backed up');
  logger.info('☐ Team members notified of deployment');
  logger.info('☐ Documentation prepared for announcement');
  logger.newline();

  const { proceed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Have you completed all checklist items and wish to proceed?',
      default: false,
    },
  ]);

  if (!proceed) {
    return false;
  }

  const { confirmNetwork } = await inquirer.prompt([
    {
      type: 'input',
      name: 'confirmNetwork',
      message: 'Type "MAINNET" to confirm deployment:',
    },
  ]);

  return confirmNetwork === 'MAINNET';
}

async function main() {
  // Force mainnet configuration
  if (config.network.cluster !== 'mainnet-beta') {
    logger.error('Please set SOLANA_NETWORK=mainnet-beta in .env file');
    process.exit(1);
  }

  // Validate configuration
  const validation = config.validate();
  if (!validation.valid) {
    logger.error('Configuration validation failed:');
    validation.errors.forEach((error) => logger.error(`  - ${error}`));
    process.exit(1);
  }

  // Confirm deployment
  const confirmed = await confirmDeployment();
  if (!confirmed) {
    logger.warn('Deployment cancelled by user');
    process.exit(0);
  }

  logger.header('Deploying Token to Mainnet');

  // Initialize connection
  const connection = new Connection(config.network.rpcUrl, config.network.commitment);
  logger.info(`Connected to: ${config.network.cluster}`);

  // Load deployer wallet
  let deployer: Keypair;
  try {
    deployer = await loadWallet();
    logger.success(`Deployer wallet: ${deployer.publicKey.toBase58()}`);
  } catch (error) {
    logger.error('Failed to load wallet');
    process.exit(1);
  }

  // Check SOL balance
  const balance = await connection.getBalance(deployer.publicKey);
  const solBalance = balance / 1e9;
  logger.info(`SOL Balance: ${solBalance} SOL`);

  if (solBalance < 0.1) {
    logger.error('Insufficient SOL balance for deployment');
    logger.info('You need at least 0.1 SOL for safe deployment');
    process.exit(1);
  }

  // Final confirmation
  const { finalConfirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'finalConfirm',
      message: `Deploy with wallet ${deployer.publicKey.toBase58()}?`,
      default: false,
    },
  ]);

  if (!finalConfirm) {
    logger.warn('Deployment cancelled');
    process.exit(0);
  }

  // Initialize operations
  const tokenOps = new TokenOperations(connection, deployer);
  const result: DeploymentResult = {
    network: config.network.cluster,
    deployer: deployer.publicKey.toBase58(),
    decimals: config.token.decimals,
    initialSupply: config.token.initialMintAmount,
    timestamp: new Date().toISOString(),
    transactions: {},
  };

  try {
    // Step 1: Create Token
    logger.section('Step 1: Creating Token on Mainnet');
    const stopSpinner = logger.spinner('Creating token mint');
    const mint = await tokenOps.createToken(
      config.token.decimals,
      config.authority.mintAuthorityEnabled ? deployer : undefined,
      config.authority.freezeAuthorityEnabled ? deployer : undefined
    );
    stopSpinner();
    result.mintAddress = mint.toBase58();

    logger.success('Token created on mainnet!');
    logger.table({
      'Token Mint': mint.toBase58(),
      'Decimals': config.token.decimals,
      'Explorer': config.getTokenExplorerUrl(mint.toBase58()),
    });

    // Create backup of deployment info immediately
    const backupDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupFile = path.join(backupDir, `mainnet-${mint.toBase58()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(result, null, 2));

    // Step 2: Create Token Account
    logger.section('Step 2: Creating Token Account');
    const tokenAccount = await tokenOps.getOrCreateTokenAccount(
      mint,
      deployer.publicKey
    );
    logger.success(`Token Account: ${tokenAccount.toBase58()}`);

    // Step 3: Mint Initial Supply
    if (config.token.initialMintAmount > 0) {
      logger.section('Step 3: Minting Initial Supply');
      const mintSignature = await tokenOps.mintTokens(
        mint,
        tokenAccount,
        config.token.initialMintAmount,
        config.token.decimals,
        deployer
      );
      result.transactions.mintTokens = mintSignature;

      logger.link(config.getExplorerUrl(mintSignature), 'View transaction');
    }

    // Step 4: Create Metadata
    if (config.token.logoUrl) {
      logger.section('Step 4: Creating Token Metadata');

      const metadataManager = new MetadataManager(connection, deployer, true);

      const metadata: TokenMetadata = {
        name: config.token.name,
        symbol: config.token.symbol,
        description: config.token.description,
        image: config.token.logoUrl,
        externalUrl: config.token.website,
        ...(config.token.twitter && { twitter: config.token.twitter }),
        ...(config.token.discord && { discord: config.token.discord }),
        ...(config.token.telegram && { telegram: config.token.telegram }),
      };

      const logoPath = fs.existsSync('./assets/logo.png')
        ? './assets/logo.png'
        : undefined;

      const { metadataUri, metadataAddress } =
        await metadataManager.createCompleteMetadata(mint, metadata, logoPath, deployer);

      result.metadataUri = metadataUri;
      result.metadataAccount = metadataAddress.toBase58();
    }

    // Step 5: Authority Management
    if (!config.authority.mintAuthorityEnabled) {
      logger.section('Step 5: Finalizing Token (Revoking Mint Authority)');
      logger.warn('This will permanently lock the token supply!');

      const { confirmRevoke } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmRevoke',
          message: 'Permanently revoke mint authority (cannot be undone)?',
          default: false,
        },
      ]);

      if (confirmRevoke) {
        const revokeSignature = await tokenOps.setAuthority(
          mint,
          0, // AuthorityType.MintTokens
          deployer,
          null
        );
        result.transactions.revokeAuthority = revokeSignature;
        logger.success('Mint authority permanently revoked - supply is now fixed!');
      }
    }

    // Save final deployment info
    fs.writeFileSync(backupFile, JSON.stringify(result, null, 2));
    const latestFile = path.join(backupDir, 'mainnet-latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(result, null, 2));

    // Display final summary
    logger.header('🎉 Mainnet Deployment Successful! 🎉');
    logger.table({
      'Token Mint': result.mintAddress,
      'Token Name': config.token.name,
      'Token Symbol': config.token.symbol,
      'Total Supply': `${config.token.totalSupply.toLocaleString()} ${config.token.symbol}`,
      'Network': 'Mainnet',
      'Deployment Time': result.timestamp,
    });

    logger.newline();
    logger.section('Important: Next Steps');
    logger.info('1. Verify token on Solscan:');
    logger.link(config.getTokenExplorerUrl(result.mintAddress));
    logger.newline();

    logger.info('2. Update production .env:');
    logger.info(`   TOKEN_MINT_ADDRESS=${result.mintAddress}`);
    logger.newline();

    logger.info('3. Announce deployment:');
    logger.info('   - Post on Twitter/X');
    logger.info('   - Announce in Discord/Telegram');
    logger.info('   - Update website');
    logger.newline();

    logger.info('4. Submit for listing:');
    logger.info('   - Solana Token List: https://github.com/solana-labs/token-list');
    logger.info('   - Jupiter: https://station.jup.ag');
    logger.info('   - CoinGecko: https://www.coingecko.com');
    logger.newline();

    logger.info('5. Set up monitoring:');
    logger.info('   npm run monitor');
    logger.newline();

  } catch (error) {
    logger.error('Mainnet deployment failed:', error);
    logger.warn('If token was created, check deployments folder for mint address');
    process.exit(1);
  }
}

// Run mainnet deployment
main().catch((error) => {
  logger.error('Unexpected error:', error);
  process.exit(1);
});
