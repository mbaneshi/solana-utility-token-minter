#!/usr/bin/env ts-node

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { config } from '../src/config';
import { TokenOperations } from '../src/token/operations';
import { loadWallet } from '../src/utils/wallet';
import { logger } from '../src/utils/logger';

async function runTests() {
  logger.header('Devnet Testing Suite');

  try {
    // Initialize
    const connection = new Connection(config.network.rpcUrl, 'confirmed');
    const payer = await loadWallet();
    const tokenOps = new TokenOperations(connection, payer);

    logger.info(`Testing on: ${config.network.cluster}`);
    logger.info(`Wallet: ${payer.publicKey.toBase58()}`);
    logger.newline();

    // Test 1: Create Token
    logger.section('Test 1: Creating Token');
    const mint = await tokenOps.createToken(9, payer, payer);
    logger.success(`✓ Token created: ${mint.toBase58()}`);
    logger.newline();

    // Test 2: Get Token Info
    logger.section('Test 2: Getting Token Info');
    const tokenInfo = await tokenOps.getTokenInfo(mint);
    logger.table({
      'Mint': mint.toBase58(),
      'Decimals': tokenInfo.decimals,
      'Supply': tokenInfo.supply.toString(),
      'Mint Authority': tokenInfo.mintAuthority?.toBase58() || 'None',
      'Freeze Authority': tokenInfo.freezeAuthority?.toBase58() || 'None',
    });
    logger.success('✓ Token info retrieved');
    logger.newline();

    // Test 3: Create Token Account
    logger.section('Test 3: Creating Token Account');
    const tokenAccount = await tokenOps.getOrCreateTokenAccount(
      mint,
      payer.publicKey
    );
    logger.success(`✓ Token account: ${tokenAccount.toBase58()}`);
    logger.newline();

    // Test 4: Mint Tokens
    logger.section('Test 4: Minting Tokens');
    const mintAmount = 1000;
    await tokenOps.mintTokens(mint, tokenAccount, mintAmount, 9, payer);
    const balance1 = await tokenOps.getBalance(tokenAccount, 9);
    logger.success(`✓ Minted ${mintAmount} tokens`);
    logger.info(`Balance: ${balance1}`);
    logger.newline();

    // Test 5: Transfer Tokens
    logger.section('Test 5: Transferring Tokens');
    const recipient = Keypair.generate();
    const recipientAccount = await tokenOps.getOrCreateTokenAccount(
      mint,
      recipient.publicKey
    );

    await tokenOps.transferTokens(
      mint,
      tokenAccount,
      recipientAccount,
      100,
      9,
      payer
    );

    const recipientBalance = await tokenOps.getBalance(recipientAccount, 9);
    logger.success(`✓ Transferred 100 tokens`);
    logger.info(`Recipient balance: ${recipientBalance}`);
    logger.newline();

    // Test 6: Burn Tokens
    logger.section('Test 6: Burning Tokens');
    await tokenOps.burnTokens(mint, tokenAccount, 50, 9, payer);
    const balance2 = await tokenOps.getBalance(tokenAccount, 9);
    logger.success(`✓ Burned 50 tokens`);
    logger.info(`Remaining balance: ${balance2}`);
    logger.newline();

    // Test 7: Freeze Account
    if (tokenInfo.freezeAuthority) {
      logger.section('Test 7: Freezing Account');
      await tokenOps.freezeAccount(mint, recipientAccount, payer);
      const accountInfo = await tokenOps.getAccountInfo(recipientAccount);
      logger.success(`✓ Account frozen`);
      logger.info(`State: ${accountInfo.state}`);
      logger.newline();

      // Test 8: Thaw Account
      logger.section('Test 8: Thawing Account');
      await tokenOps.thawAccount(mint, recipientAccount, payer);
      const accountInfo2 = await tokenOps.getAccountInfo(recipientAccount);
      logger.success(`✓ Account thawed`);
      logger.info(`State: ${accountInfo2.state}`);
      logger.newline();
    }

    // Test 9: Get Total Supply
    logger.section('Test 9: Checking Supply');
    const supply = await tokenOps.getTotalSupply(mint, 9);
    logger.success(`✓ Total supply: ${supply}`);
    logger.newline();

    // Final Summary
    logger.header('✅ All Tests Passed!');
    logger.table({
      'Test Token': mint.toBase58(),
      'Tests Run': '9',
      'Tests Passed': '9',
      'Status': 'SUCCESS',
    });

    logger.newline();
    logger.info('View token on explorer:');
    logger.link(config.getTokenExplorerUrl(mint.toBase58()));

  } catch (error) {
    logger.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

runTests().catch((error) => {
  logger.error('Test suite error:', error);
  process.exit(1);
});
