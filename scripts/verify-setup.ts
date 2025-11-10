#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { logger } from '../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, test: () => boolean, message: string): void {
  try {
    const passed = test();
    results.push({
      name,
      status: passed ? 'pass' : 'fail',
      message,
    });
  } catch (error) {
    results.push({
      name,
      status: 'fail',
      message: `Error: ${error}`,
    });
  }
}

function checkCommand(name: string, command: string, minVersion?: string): void {
  try {
    const output = execSync(command, { encoding: 'utf-8' }).trim();
    const version = output.split('\n')[0];

    results.push({
      name,
      status: 'pass',
      message: `✓ Installed: ${version}`,
    });
  } catch (error) {
    results.push({
      name,
      status: 'fail',
      message: '✗ Not found - Please install',
    });
  }
}

async function main() {
  logger.header('Setup Verification');

  // Check Node.js
  checkCommand('Node.js', 'node --version');

  // Check npm
  checkCommand('npm', 'npm --version');

  // Check Solana CLI
  checkCommand('Solana CLI', 'solana --version');

  // Check SPL Token CLI (optional)
  try {
    execSync('spl-token --version', { encoding: 'utf-8' });
    results.push({
      name: 'SPL Token CLI',
      status: 'pass',
      message: '✓ Installed',
    });
  } catch {
    results.push({
      name: 'SPL Token CLI',
      status: 'warn',
      message: '⚠ Optional - can install with: cargo install spl-token-cli',
    });
  }

  // Check Solana wallet
  const defaultWalletPath = path.join(
    process.env.HOME || '',
    '.config',
    'solana',
    'id.json'
  );

  check(
    'Solana Wallet',
    () => fs.existsSync(defaultWalletPath),
    fs.existsSync(defaultWalletPath)
      ? `✓ Found at ${defaultWalletPath}`
      : '✗ Not found - Create with: solana-keygen new'
  );

  // Check .env file
  check(
    '.env Configuration',
    () => fs.existsSync('.env'),
    fs.existsSync('.env')
      ? '✓ Found - Review configuration'
      : '✗ Not found - Copy from .env.example'
  );

  // Check node_modules
  check(
    'Dependencies',
    () => fs.existsSync('node_modules'),
    fs.existsSync('node_modules')
      ? '✓ Installed'
      : '✗ Run: npm install'
  );

  // Check deployments directory
  check(
    'Deployments Directory',
    () => fs.existsSync('deployments'),
    fs.existsSync('deployments')
      ? '✓ Ready'
      : '⚠ Will be created on first deployment'
  );

  // Check assets directory
  check(
    'Assets Directory',
    () => fs.existsSync('assets'),
    fs.existsSync('assets')
      ? '✓ Ready'
      : '⚠ Will be created - Place logo.png here'
  );

  // Check token logo
  const logoPath = 'assets/logo.png';
  check(
    'Token Logo',
    () => fs.existsSync(logoPath),
    fs.existsSync(logoPath)
      ? '✓ Found'
      : '⚠ Optional - Add logo at assets/logo.png'
  );

  // Check admin dependencies
  check(
    'Admin Interface',
    () => fs.existsSync('admin/node_modules'),
    fs.existsSync('admin/node_modules')
      ? '✓ Dependencies installed'
      : '⚠ Run: cd admin && npm install'
  );

  // Display results
  logger.section('Verification Results');

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  for (const result of results) {
    if (result.status === 'pass') {
      logger.success(`${result.name}: ${result.message}`);
      passCount++;
    } else if (result.status === 'fail') {
      logger.error(`${result.name}: ${result.message}`);
      failCount++;
    } else {
      logger.warn(`${result.name}: ${result.message}`);
      warnCount++;
    }
  }

  logger.newline();
  logger.section('Summary');
  logger.table({
    'Passed': `${passCount}/${results.length}`,
    'Failed': failCount,
    'Warnings': warnCount,
  });

  logger.newline();

  if (failCount === 0) {
    logger.success('✓ Setup verification passed!');
    logger.info('You are ready to deploy your token.');
    logger.newline();
    logger.info('Next steps:');
    logger.info('1. Review and update .env configuration');
    logger.info('2. Get devnet SOL: solana airdrop 2');
    logger.info('3. Run tests: npm run test:devnet');
    logger.info('4. Deploy: npm run deploy:devnet');
  } else {
    logger.error('✗ Setup verification failed');
    logger.info('Please fix the issues above before deploying.');
    logger.newline();
    logger.info('For help, see:');
    logger.info('- QUICKSTART.md');
    logger.info('- DEPLOYMENT_GUIDE.md');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Verification failed:', error);
  process.exit(1);
});
