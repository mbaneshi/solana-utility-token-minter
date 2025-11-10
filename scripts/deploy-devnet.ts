#!/usr/bin/env ts-node

import { Connection, Keypair } from '@solana/web3.js';
import { config } from '../src/config';
import { TokenOperations } from '../src/token/operations';
import { MetadataManager, TokenMetadata } from '../src/token/metadata';
import { loadWallet, WalletManager } from '../src/utils/wallet';
import { logger } from '../src/utils/logger';
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
  transactions: {
    createToken?: string;
    mintTokens?: string;
    createMetadata?: string;
    revokeAuthority?: string;
  };
}

async function main() {
  logger.header('Deploying Token to Devnet');

  // Validate configuration
  const validation = config.validate();
  if (!validation.valid) {
    logger.error('Configuration validation failed:');
    validation.errors.forEach((error) => logger.error(`  - ${error}`));
    process.exit(1);
  }

  // Initialize connection
  const connection = new Connection(config.network.rpcUrl, config.network.commitment);
  logger.info(`Connected to: ${config.network.cluster}`);

  // Load deployer wallet
  let deployer: Keypair;
  try {
    deployer = await loadWallet();
    logger.success(`Deployer wallet: ${deployer.publicKey.toBase58()}`);
  } catch (error) {
    logger.error('Failed to load wallet. Please set up your wallet first.');
    logger.info('Run: solana-keygen new --outfile ~/.config/solana/id.json');
    process.exit(1);
  }

  // Check SOL balance
  const balance = await connection.getBalance(deployer.publicKey);
  const solBalance = balance / 1e9;
  logger.info(`SOL Balance: ${solBalance} SOL`);

  if (solBalance < 0.1) {
    logger.warn('Low SOL balance. You may need more SOL for deployment.');
    logger.info('Get devnet SOL: solana airdrop 2');
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
    logger.section('Step 1: Creating Token');
    const mint = await tokenOps.createToken(
      config.token.decimals,
      config.authority.mintAuthorityEnabled ? deployer : undefined,
      config.authority.freezeAuthorityEnabled ? deployer : undefined
    );
    result.mintAddress = mint.toBase58();
    logger.table({
      'Token Mint': mint.toBase58(),
      'Decimals': config.token.decimals,
      'Mint Authority': config.authority.mintAuthorityEnabled ? 'Enabled' : 'Disabled',
      'Freeze Authority': config.authority.freezeAuthorityEnabled ? 'Enabled' : 'Disabled',
    });

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

      const balance = await tokenOps.getBalance(tokenAccount, config.token.decimals);
      logger.success(`Current Balance: ${balance.toLocaleString()} ${config.token.symbol}`);
    }

    // Step 4: Create Metadata (if configured)
    if (config.token.logoUrl || fs.existsSync('./assets/logo.png')) {
      logger.section('Step 4: Creating Metadata');

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
        await metadataManager.createCompleteMetadata(
          mint,
          metadata,
          logoPath,
          deployer
        );

      result.metadataUri = metadataUri;
      result.metadataAccount = metadataAddress.toBase58();
    } else {
      logger.warn('Skipping metadata creation - no logo configured');
      logger.info('Set TOKEN_LOGO_URL in .env or place logo at ./assets/logo.png');
    }

    // Step 5: Authority Management
    if (!config.authority.mintAuthorityEnabled) {
      logger.section('Step 5: Revoking Mint Authority');
      const revokeSignature = await tokenOps.setAuthority(
        mint,
        0, // AuthorityType.MintTokens
        deployer,
        null
      );
      result.transactions.revokeAuthority = revokeSignature;
      logger.success('Mint authority permanently revoked');
      logger.info('Total supply is now fixed at: ' +
        `${config.token.initialMintAmount.toLocaleString()} ${config.token.symbol}`
      );
    }

    // Save deployment info
    logger.section('Saving Deployment Information');
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(
      deploymentsDir,
      `${config.network.cluster}-${Date.now()}.json`
    );
    fs.writeFileSync(deploymentFile, JSON.stringify(result, null, 2));

    // Also save as latest
    const latestFile = path.join(deploymentsDir, `${config.network.cluster}-latest.json`);
    fs.writeFileSync(latestFile, JSON.stringify(result, null, 2));

    logger.success(`Deployment info saved: ${deploymentFile}`);

    // Display summary
    logger.header('Deployment Summary');
    logger.table({
      'Network': result.network,
      'Token Mint': result.mintAddress,
      'Token Name': config.token.name,
      'Token Symbol': config.token.symbol,
      'Decimals': result.decimals,
      'Initial Supply': `${result.initialSupply.toLocaleString()} ${config.token.symbol}`,
      'Deployer': result.deployer,
    });

    logger.newline();
    logger.success('Deployment completed successfully!');
    logger.newline();

    // Display next steps
    logger.section('Next Steps');
    logger.info('1. Verify token on Solscan:');
    logger.link(config.getTokenExplorerUrl(result.mintAddress));
    logger.newline();

    logger.info('2. Update .env file with token address:');
    logger.info(`   TOKEN_MINT_ADDRESS=${result.mintAddress}`);
    logger.newline();

    logger.info('3. Test token operations:');
    logger.info('   npm run cli -- balance <wallet-address>');
    logger.newline();

    logger.info('4. When ready, deploy to mainnet:');
    logger.info('   npm run deploy:mainnet');
    logger.newline();

  } catch (error) {
    logger.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
main().catch((error) => {
  logger.error('Unexpected error:', error);
  process.exit(1);
});
