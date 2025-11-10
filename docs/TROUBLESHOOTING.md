# Troubleshooting Guide

Common issues and solutions for Solana SPL Token operations.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Deployment Issues](#deployment-issues)
- [Transaction Failures](#transaction-failures)
- [CLI Issues](#cli-issues)
- [Network Issues](#network-issues)
- [Wallet Issues](#wallet-issues)
- [Testing Issues](#testing-issues)
- [Performance Issues](#performance-issues)

## Setup Issues

### Issue: Missing Dependencies

**Symptoms**:
```
Error: Cannot find module '@solana/web3.js'
```

**Solution**:
```bash
# Install all dependencies
npm install

# Verify installation
npm list @solana/web3.js
```

### Issue: TypeScript Errors

**Symptoms**:
```
Error: Cannot find name 'PublicKey'
```

**Solution**:
```bash
# Reinstall TypeScript
npm install --save-dev typescript

# Check tsconfig.json exists
cat tsconfig.json

# Rebuild
npm run build
```

### Issue: Environment Variables Not Loaded

**Symptoms**:
```
Error: Environment variable DEPLOYER_PRIVATE_KEY is not set
```

**Solution**:
```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env

# Verify loading
node -e "require('dotenv').config(); console.log(process.env.DEPLOYER_PRIVATE_KEY ? 'OK' : 'NOT SET')"
```

## Deployment Issues

### Issue: Insufficient SOL for Deployment

**Symptoms**:
```
Error: Transaction simulation failed
Account has insufficient funds
```

**Solution**:
```bash
# Check balance
solana balance

# Get airdrop (devnet only)
solana airdrop 2

# For mainnet, transfer SOL from another wallet
solana transfer <your-address> 0.5 --from <funded-wallet>
```

**Required SOL**:
- Devnet deployment: ~0.01 SOL
- Mainnet deployment: ~0.1 SOL (for safety)

### Issue: Deployment Fails at Metadata Creation

**Symptoms**:
```
Error: Failed to create metadata
```

**Solutions**:

1. **Check image file**:
```bash
# Verify image exists
ls -lh assets/token-icon.png

# Check file size (<10MB recommended)
du -h assets/token-icon.png
```

2. **Verify Arweave/IPFS availability**:
```bash
# Test network connectivity
curl -I https://arweave.net
```

3. **Use local metadata**:
```bash
# Generate metadata file first
npm run create-metadata

# Then deploy with existing metadata
# (Modify deployment script to skip upload)
```

### Issue: Token Created But Metadata Missing

**Symptoms**:
- Token appears on explorer without name/symbol
- Image not displaying

**Solution**:
```bash
# Create metadata separately
npm run create-metadata

# Check metadata on explorer
# Visit: https://explorer.solana.com/address/<mint-address>
```

## Transaction Failures

### Issue: Transaction Timeout

**Symptoms**:
```
Error: Transaction was not confirmed in 60 seconds
```

**Solutions**:

1. **Check transaction status**:
```bash
# Get recent signature from output
solana confirm -v <signature>
```

2. **Increase confirmation timeout**:
```typescript
// In code, increase timeout
connection.confirmTransaction(signature, 'confirmed', {
  maxRetries: 5,
  timeout: 120000, // 2 minutes
});
```

3. **Use different commitment level**:
```typescript
// Try 'processed' instead of 'confirmed'
connection = new Connection(rpcUrl, 'processed');
```

### Issue: Slippage Error

**Symptoms**:
```
Error: custom program error: 0x1771
```

**Solution**:
This usually means insufficient balance or invalid amount.

```bash
# Check token balance
npm run cli balance <wallet>

# Try smaller amount
# If transferring 100, try 50 first
```

### Issue: Account Already in Use

**Symptoms**:
```
Error: failed to send transaction: Account already in use
```

**Solution**:
```bash
# Wait a few seconds and retry
sleep 5
npm run cli <command> <args>

# Or use a different account
```

### Issue: Blockhash Expired

**Symptoms**:
```
Error: Blockhash not found
```

**Solution**:
```bash
# Retry the transaction
# The script will get a fresh blockhash

# If persistent, check network status
solana cluster-version
```

## CLI Issues

### Issue: CLI Command Not Found

**Symptoms**:
```
command not found: token-cli
```

**Solution**:
```bash
# Use npm script instead
npm run cli -- <command> <args>

# Or run directly with ts-node
ts-node cli/token-cli.ts <command> <args>

# Or install globally (not recommended)
npm link
token-cli <command> <args>
```

### Issue: Invalid Public Key

**Symptoms**:
```
Error: Invalid public key input
```

**Solutions**:

1. **Verify address format**:
   - Must be base58 encoded
   - Usually 44 characters
   - No spaces or special characters

2. **Test validation**:
```bash
# Valid example
npm run cli balance 7EqQdEUx...  (44 chars)

# Invalid examples
npm run cli balance "my wallet"
npm run cli balance 0x1234...
```

3. **Copy from explorer**:
   - Go to Solana Explorer
   - Find your wallet
   - Copy address exactly

### Issue: Permission Denied

**Symptoms**:
```
Error: EACCES: permission denied
```

**Solution**:
```bash
# Fix file permissions
chmod 600 ~/.config/solana/id.json

# For project files
chmod +x cli/token-cli.ts

# If using npm scripts, no need for +x
```

## Network Issues

### Issue: RPC Connection Failed

**Symptoms**:
```
Error: failed to get recent blockhash: FetchError
```

**Solutions**:

1. **Check RPC endpoint**:
```bash
# Test connectivity
curl -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

2. **Try different endpoint**:
```bash
# In .env file, try:
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Or
SOLANA_RPC_URL=https://solana-api.projectserum.com
```

3. **Use premium RPC** (for production):
   - QuickNode
   - Helius
   - Triton

### Issue: Rate Limited

**Symptoms**:
```
Error: 429 Too Many Requests
```

**Solutions**:

1. **Add delays between requests**:
```bash
# Wait between operations
npm run cli mint <args>
sleep 2
npm run cli transfer <args>
```

2. **Use paid RPC provider**

3. **Implement retry logic**:
```typescript
// Use built-in retry utility
import { withRetry } from './utils/retry';

await withRetry(() => operation(), {
  maxAttempts: 3,
  delayMs: 1000,
});
```

### Issue: Network Congestion

**Symptoms**:
- Slow transaction confirmations
- High priority fees required

**Solutions**:

1. **Check network status**:
   - https://status.solana.com
   - https://solanabeach.io

2. **Increase compute budget**:
```typescript
// Add compute budget instruction
const computeBudget = ComputeBudgetProgram.setComputeUnitLimit({
  units: 400000,
});
transaction.add(computeBudget);
```

3. **Wait for off-peak hours**

## Wallet Issues

### Issue: Cannot Load Wallet

**Symptoms**:
```
Error: Failed to load keypair from file
```

**Solutions**:

1. **Check file exists**:
```bash
ls -la ~/.config/solana/id.json
```

2. **Verify file format**:
```bash
# Should be array of numbers
cat ~/.config/solana/id.json
# [123,45,67,...]
```

3. **Generate new wallet**:
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

4. **Use environment variable**:
```bash
# Export private key to env
export DEPLOYER_PRIVATE_KEY="your-base58-key"
```

### Issue: Wrong Wallet Loaded

**Symptoms**:
- Operations execute but show wrong address
- Unexpected balance

**Solution**:
```bash
# Verify current wallet
solana address

# Check which wallet is loaded
solana-keygen pubkey ~/.config/solana/id.json

# Verify in code
npm run cli info
# Check deployer address matches expected
```

### Issue: Private Key Format Error

**Symptoms**:
```
Error: Invalid base58 string
```

**Solutions**:

1. **Check format**:
   - Base58 encoded
   - No spaces
   - No line breaks

2. **Convert from array**:
```bash
# If you have JSON array format
node -e "
const fs = require('fs');
const bs58 = require('bs58');
const key = JSON.parse(fs.readFileSync('wallet.json'));
console.log(bs58.encode(Buffer.from(key)));
"
```

## Testing Issues

### Issue: Tests Failing

**Symptoms**:
```
FAIL src/__tests__/operations/mint.test.ts
```

**Solutions**:

1. **Run specific test**:
```bash
npm test -- mint.test.ts
```

2. **Check mocks**:
```typescript
// Ensure mocks are before imports
jest.mock('@solana/spl-token');
import { createMint } from '@solana/spl-token';
```

3. **Clear cache**:
```bash
jest --clearCache
npm test
```

### Issue: Coverage Below Threshold

**Symptoms**:
```
FAIL: Coverage for lines (83%) does not meet threshold (85%)
```

**Solution**:
```bash
# View coverage report
npm run test:coverage
open coverage/lcov-report/index.html

# Add tests for uncovered lines
```

### Issue: Integration Tests Fail

**Symptoms**:
```
FAIL: Devnet integration test failed
```

**Solutions**:

1. **Check devnet is running**:
```bash
solana cluster-version --url devnet
```

2. **Verify wallet has SOL**:
```bash
solana balance --url devnet
solana airdrop 2 --url devnet
```

3. **Check deployment exists**:
```bash
ls deployments/devnet-latest.json
```

## Performance Issues

### Issue: Slow Transaction Processing

**Symptoms**:
- Transactions take >30 seconds
- CLI hangs

**Solutions**:

1. **Use faster RPC**:
```bash
# Premium RPC providers offer better performance
SOLANA_RPC_URL=https://your-premium-rpc.com
```

2. **Check commitment level**:
```typescript
// Use 'confirmed' instead of 'finalized'
connection = new Connection(rpcUrl, 'confirmed');
```

3. **Optimize batch operations**:
```typescript
// Process in smaller batches
const batchSize = 10; // Instead of 100
```

### Issue: High Memory Usage

**Symptoms**:
```
JavaScript heap out of memory
```

**Solution**:
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run <command>
```

### Issue: Airdrop Too Slow

**Symptoms**:
- Airdrop taking hours
- Memory growing

**Solutions**:

1. **Use smaller batches**:
```typescript
// In airdrop code, reduce batch size
const BATCH_SIZE = 5; // Instead of 10
```

2. **Add delays**:
```typescript
// Between batches
await sleep(1000);
```

3. **Use progress tracking**:
```bash
# Shows progress and estimated time
npm run cli airdrop recipients.csv
```

## Common Error Codes

| Error | Meaning | Solution |
|-------|---------|----------|
| 0x0 | Success | No action needed |
| 0x1 | Insufficient funds | Add SOL to wallet |
| 0x3 | Account not found | Check address |
| 0x6 | Already in use | Wait and retry |
| 0x11 | Invalid account data | Verify account type |
| 0x1771 | Custom program error | Check transaction details |

## Getting Help

### Before Asking for Help

1. **Check this guide**
2. **Review error message carefully**
3. **Try on devnet first**
4. **Verify network status**
5. **Check Solana documentation**

### What to Include

When reporting issues:
- **Error message** (full text)
- **Command executed**
- **Network** (devnet/mainnet)
- **RPC endpoint**
- **Node/npm versions**
- **Steps to reproduce**

### Resources

- **Solana Docs**: https://docs.solana.com
- **Solana Discord**: https://discord.gg/solana
- **Solana Stack Exchange**: https://solana.stackexchange.com
- **Project Issues**: GitHub Issues (if applicable)

### Debug Mode

Enable verbose logging:
```bash
# Set log level
export LOG_LEVEL=debug

# Run command
npm run cli <command>

# Or in code
logger.setLevel(LogLevel.DEBUG);
```

### Log Analysis

```bash
# Check recent errors
grep ERROR /var/log/token-ops.log

# Monitor in real-time
tail -f /var/log/token-ops.log

# Export for analysis
grep "$(date +%Y-%m-%d)" /var/log/token-ops.log > today.log
```

---

**Need More Help?**

If your issue isn't covered here:
1. Check GitHub Issues
2. Ask in Solana Discord
3. Review Solana documentation
4. Contact technical support
