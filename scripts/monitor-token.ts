#!/usr/bin/env ts-node

import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '../src/config';
import { TokenOperations } from '../src/token/operations';
import { loadWallet } from '../src/utils/wallet';
import { logger } from '../src/utils/logger';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface MonitoringState {
  lastSupply: number;
  lastCheck: string;
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

async function sendAlert(message: string) {
  if (config.alertWebhookUrl) {
    try {
      await axios.post(config.alertWebhookUrl, {
        content: `🚨 Token Alert: ${message}`,
      });
    } catch (error) {
      logger.error('Failed to send alert:', error);
    }
  }
}

async function loadState(mint: string): Promise<MonitoringState> {
  const stateFile = path.join(__dirname, '../deployments', `monitor-${mint}.json`);

  if (fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  }

  return {
    lastSupply: 0,
    lastCheck: new Date().toISOString(),
    alerts: [],
  };
}

async function saveState(mint: string, state: MonitoringState) {
  const stateFile = path.join(__dirname, '../deployments', `monitor-${mint}.json`);
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

async function monitor() {
  try {
    // Load deployment
    const deploymentFile = path.join(
      __dirname,
      '../deployments',
      `${config.network.cluster}-latest.json`
    );

    if (!fs.existsSync(deploymentFile)) {
      logger.error('No deployment found. Deploy first.');
      process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
    const mint = new PublicKey(deployment.mintAddress);

    // Initialize
    const connection = new Connection(config.network.rpcUrl, config.network.commitment);
    const deployer = await loadWallet();
    const tokenOps = new TokenOperations(connection, deployer);

    // Load previous state
    const state = await loadState(mint.toBase58());

    logger.header('Token Monitoring');
    logger.info(`Token: ${config.token.name} (${config.token.symbol})`);
    logger.info(`Mint: ${mint.toBase58()}`);
    logger.info(`Network: ${config.network.cluster}`);
    logger.newline();

    // Get current token info
    const tokenInfo = await tokenOps.getTokenInfo(mint);
    const supply = await tokenOps.getTotalSupply(mint, tokenInfo.decimals);

    // Check for supply changes
    if (state.lastSupply > 0 && supply !== state.lastSupply) {
      const change = supply - state.lastSupply;
      const message = change > 0
        ? `Supply increased by ${change.toLocaleString()} ${config.token.symbol}`
        : `Supply decreased by ${Math.abs(change).toLocaleString()} ${config.token.symbol}`;

      logger.warn(message);
      state.alerts.push({
        type: 'supply_change',
        message,
        timestamp: new Date().toISOString(),
      });

      await sendAlert(message);
    }

    // Check authority changes
    if (state.lastSupply > 0) {
      // Check if mint authority was revoked
      if (!tokenInfo.mintAuthority && state.lastSupply > 0) {
        const message = 'Mint authority was revoked';
        logger.info(message);
        state.alerts.push({
          type: 'authority_change',
          message,
          timestamp: new Date().toISOString(),
        });
        await sendAlert(message);
      }

      // Check if freeze authority was revoked
      if (!tokenInfo.freezeAuthority) {
        const message = 'Freeze authority was revoked';
        logger.info(message);
        state.alerts.push({
          type: 'authority_change',
          message,
          timestamp: new Date().toISOString(),
        });
        await sendAlert(message);
      }
    }

    // Display current status
    logger.section('Current Status');
    logger.table({
      'Total Supply': `${supply.toLocaleString()} ${config.token.symbol}`,
      'Mint Authority': tokenInfo.mintAuthority?.toBase58() || '❌ Revoked',
      'Freeze Authority': tokenInfo.freezeAuthority?.toBase58() || '❌ Revoked',
      'Last Check': new Date(state.lastCheck).toLocaleString(),
      'Current Time': new Date().toLocaleString(),
    });

    // Display recent alerts
    if (state.alerts.length > 0) {
      logger.section('Recent Alerts (Last 10)');
      const recentAlerts = state.alerts.slice(-10);
      recentAlerts.forEach((alert) => {
        logger.info(`[${new Date(alert.timestamp).toLocaleString()}] ${alert.message}`);
      });
    }

    // Update state
    state.lastSupply = supply;
    state.lastCheck = new Date().toISOString();
    await saveState(mint.toBase58(), state);

    logger.newline();
    logger.success('Monitoring check completed');
    logger.info('Run this script periodically to monitor your token');

  } catch (error) {
    logger.error('Monitoring failed:', error);
    process.exit(1);
  }
}

monitor().catch((error) => {
  logger.error('Unexpected error:', error);
  process.exit(1);
});
