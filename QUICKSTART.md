# Quick Start Guide

Get your Solana utility token deployed in 15 minutes.

## Prerequisites Check

```bash
# Check Node.js (need v18+)
node --version

# Check Solana CLI (need v1.18.0+)
solana --version

# If not installed, see DEPLOYMENT_GUIDE.md
```

## 5-Step Deployment

### Step 1: Install (2 minutes)

```bash
cd /Users/nerd/freelancer/12-mint-solana-utility-token

# Install dependencies
npm install

# Verify installation
npm run cli -- --version
```

### Step 2: Configure (3 minutes)

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env  # or use your preferred editor
```

**Minimum required settings:**
```env
SOLANA_NETWORK=devnet
TOKEN_NAME=My Utility Token
TOKEN_SYMBOL=MUT
TOKEN_DECIMALS=9
TOTAL_SUPPLY=1000000000
INITIAL_MINT_AMOUNT=400000000
```

### Step 3: Setup Wallet (2 minutes)

```bash
# Create new wallet (or use existing)
solana-keygen new --outfile ~/.config/solana/id.json

# Get devnet SOL
solana config set --url https://api.devnet.solana.com
solana airdrop 2

# Check balance
solana balance
```

### Step 4: Deploy (5 minutes)

```bash
# Run comprehensive tests
npm run test:devnet

# Deploy to devnet
npm run deploy:devnet
```

**Expected output:**
```
✅ Token created: [MINT_ADDRESS]
✅ Metadata uploaded
✅ Initial supply minted: 400,000,000 tokens

🔗 View on Solscan:
https://solscan.io/token/[MINT_ADDRESS]?cluster=devnet
```

### Step 5: Verify (3 minutes)

```bash
# Check token info
npm run cli -- info

# Check your balance
npm run cli -- balance $(solana address)

# Start admin interface
npm run admin
# Open browser: http://localhost:3000
```

## Next Steps

### Test Operations

```bash
# Create a test wallet
solana-keygen new --outfile test-wallet.json
TEST_WALLET=$(solana-keygen pubkey test-wallet.json)

# Mint tokens to test wallet
npm run cli -- mint 1000 $TEST_WALLET

# Check test wallet balance
npm run cli -- balance $TEST_WALLET

# Transfer tokens
npm run cli -- transfer 100 $TEST_WALLET

# Burn tokens
npm run cli -- burn 50
```

### Mainnet Deployment

When ready for production:

```bash
# 1. Update .env
SOLANA_NETWORK=mainnet-beta

# 2. Fund wallet with SOL (0.1+ recommended)

# 3. Review checklist in DEPLOYMENT_GUIDE.md

# 4. Deploy to mainnet
npm run deploy:mainnet
```

## Common Commands

```bash
# Token information
npm run cli -- info

# Check balance
npm run cli -- balance <ADDRESS>

# Mint tokens
npm run cli -- mint <AMOUNT> <RECIPIENT>

# Burn tokens
npm run cli -- burn <AMOUNT>

# Transfer tokens
npm run cli -- transfer <AMOUNT> <RECIPIENT>

# Monitor token
npm run monitor

# Start admin UI
npm run admin
```

## Troubleshooting

### Issue: "Insufficient SOL"
```bash
# Devnet: Get free SOL
solana airdrop 2

# Mainnet: Buy SOL from exchange
```

### Issue: "Command not found: solana"
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### Issue: "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: "Network error"
```bash
# Check network configuration
solana config get

# Try different RPC
solana config set --url https://api.devnet.solana.com
```

## Getting Help

- **Documentation**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Security**: See [SECURITY.md](./SECURITY.md)
- **Requirements**: See [REQUIREMENTS.md](./REQUIREMENTS.md)

- **Solana Discord**: https://discord.com/invite/solana
- **Stack Exchange**: https://solana.stackexchange.com

## Checklist

- [ ] Node.js v18+ installed
- [ ] Solana CLI installed
- [ ] Wallet created and backed up
- [ ] `.env` file configured
- [ ] Dependencies installed (`npm install`)
- [ ] Devnet SOL obtained
- [ ] Tests passing (`npm run test:devnet`)
- [ ] Token deployed (`npm run deploy:devnet`)
- [ ] Admin interface running (`npm run admin`)

**All checked?** You're ready to deploy to mainnet!

---

**Need more details?** See the complete [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
