#!/usr/bin/env ts-node

import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '../src/config';
import { MetadataManager, TokenMetadata } from '../src/token/metadata';
import { loadWallet } from '../src/utils/wallet';
import { logger } from '../src/utils/logger';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  logger.header('Create Token Metadata');

  try {
    // Get token mint address
    const { mintAddress } = await inquirer.prompt([
      {
        type: 'input',
        name: 'mintAddress',
        message: 'Enter token mint address:',
        validate: (input: string) => {
          try {
            new PublicKey(input);
            return true;
          } catch {
            return 'Invalid Solana address';
          }
        },
      },
    ]);

    const mint = new PublicKey(mintAddress);

    // Check for logo
    const logoPath = path.join(__dirname, '../assets/logo.png');
    const hasLogo = fs.existsSync(logoPath);

    if (!hasLogo) {
      logger.warn('No logo found at ./assets/logo.png');
      const { provideLogo } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'provideLogo',
          message: 'Do you want to provide a logo path?',
          default: false,
        },
      ]);

      if (!provideLogo) {
        logger.info('Proceeding without logo upload (will use URL from config)');
      }
    }

    // Confirm metadata
    const metadata: TokenMetadata = {
      name: config.token.name,
      symbol: config.token.symbol,
      description: config.token.description,
      image: config.token.logoUrl,
      externalUrl: config.token.website,
      twitter: config.token.twitter,
      discord: config.token.discord,
      telegram: config.token.telegram,
    };

    logger.section('Metadata Preview');
    logger.table({
      'Name': metadata.name,
      'Symbol': metadata.symbol,
      'Description': metadata.description.substring(0, 50) + '...',
      'Website': metadata.externalUrl || 'Not set',
      'Twitter': metadata.twitter || 'Not set',
      'Discord': metadata.discord || 'Not set',
    });

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Create metadata with these details?',
        default: true,
      },
    ]);

    if (!confirm) {
      logger.warn('Metadata creation cancelled');
      return;
    }

    // Initialize
    const connection = new Connection(config.network.rpcUrl, config.network.commitment);
    const deployer = await loadWallet();
    const metadataManager = new MetadataManager(connection, deployer, true);

    // Create metadata
    logger.section('Creating Metadata');

    const { metadataUri, metadataAddress } =
      await metadataManager.createCompleteMetadata(
        mint,
        metadata,
        hasLogo ? logoPath : undefined,
        deployer
      );

    // Save metadata info
    const metadataInfo = {
      mintAddress: mint.toBase58(),
      metadataAddress: metadataAddress.toBase58(),
      metadataUri,
      createdAt: new Date().toISOString(),
    };

    const outputDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `metadata-${mint.toBase58()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(metadataInfo, null, 2));

    logger.success('Metadata created successfully!');
    logger.table({
      'Metadata URI': metadataUri,
      'Metadata Account': metadataAddress.toBase58(),
      'Saved to': outputFile,
    });

    logger.newline();
    logger.info('View token on explorer:');
    logger.link(config.getTokenExplorerUrl(mint.toBase58()));

  } catch (error) {
    logger.error('Failed to create metadata:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unexpected error:', error);
  process.exit(1);
});
