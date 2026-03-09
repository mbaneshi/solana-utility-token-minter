# Deployment Guide

Complete guide for deploying your Solana SPL utility token from development to mainnet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Devnet Deployment](#devnet-deployment)
4. [Testing](#testing)
5. [Mainnet Deployment](#mainnet-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: v18+ required
- **Solana CLI**: v1.18.0+
- **Anchor CLI**: v0.29.0+ (only if using custom programs)
- **Rust**: Latest stable (only if developing custom programs)

### Installation

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Verify installation
solana --version

# Install SPL Token CLI
cargo install spl-token-cli

# Verify installation
spl-token --version
```

### Wallet Setup

```bash
# Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json

# View your public key
solana-keygen pubkey ~/.config/solana/id.json

# IMPORTANT: Backup your wallet!
# Store the generated seed phrase in a secure location
```

## Environment Setup

### 1. Clone and Install

```bash
cd solana-utility-token-minter

# Install dependencies
npm install

# Install admin interface dependencies
cd admin && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Configuration:**

```env
# Network (start with devnet)
SOLANA_NETWORK=devnet

# Token Specifications
TOKEN_NAME=Your Token Name
TOKEN_SYMBOL=YTN
TOKEN_DECIMALS=9
TOTAL_SUPPLY=1000000000
INITIAL_MINT_AMOUNT=400000000

# Token Description
TOKEN_DESCRIPTION=Your token description here

# Authorities
MINT_AUTHORITY_ENABLED=true
FREEZE_AUTHORITY_ENABLED=false
```

### 3. Prepare Assets

```bash
# Create assets directory
mkdir -p assets

# Add your token logo (500x500px PNG recommended)
# Place at: ./assets/logo.png
```

## Devnet Deployment

### Step 1: Get Devnet SOL

```bash
# Configure Solana CLI for devnet
solana config set --url https://api.devnet.solana.com

# Airdrop SOL (free on devnet)
solana airdrop 2

# Check balance
solana balance
```

### Step 2: Run Tests

```bash
# Run comprehensive test suite
npm run test:devnet
```

Expected output:
```
✅ All Tests Passed!
Test Token: [TOKEN_ADDRESS]
Tests Run: 9
Tests Passed: 9
```

### Step 3: Deploy to Devnet

```bash
# Deploy token to devnet
npm run deploy:devnet
```

The deployment script will:
1. Create the token mint
2. Create token account
3. Mint initial supply
4. Upload metadata (if logo provided)
5. Configure authorities
6. Save deployment information

### Step 4: Verify Deployment

```bash
# Check token info
npm run cli -- info

# View on Solscan
# https://solscan.io/token/[YOUR_TOKEN_ADDRESS]?cluster=devnet
```

### Step 5: Test Operations

```bash
# Check your balance
npm run cli -- balance [YOUR_WALLET_ADDRESS]

# Test minting (if authority enabled)
npm run cli -- mint 1000 [RECIPIENT_ADDRESS]

# Test transfer
npm run cli -- transfer 100 [RECIPIENT_ADDRESS]

# Test burning
npm run cli -- burn 50
```

## Testing

### Comprehensive Testing Checklist

```bash
# 1. Token creation ✓
# 2. Token information retrieval ✓
# 3. Token account creation ✓
# 4. Token minting ✓
# 5. Token transfers ✓
# 6. Token burning ✓
# 7. Account freezing (if enabled) ✓
# 8. Account thawing (if enabled) ✓
# 9. Supply verification ✓
```

### Admin Interface Testing

```bash
# Start admin interface
npm run admin

# Open browser
# http://localhost:3000

# Test:
# - Wallet connection
# - Token information display
# - Mint tokens
# - Burn tokens
# - Transfer tokens
# - Freeze/thaw accounts
```

### Integration Testing

Test with popular Solana wallets:
- [x] Phantom Wallet
- [x] Solflare
- [x] Torus

## Mainnet Deployment

### ⚠️ CRITICAL WARNINGS FOR MAINNET DEPLOYMENT

**READ CAREFULLY BEFORE PROCEEDING**

#### 🔴 IRREVERSIBLE ACTIONS

The following actions CANNOT be undone:
- **Revoking mint authority**: Once revoked, you can NEVER mint additional tokens
- **Revoking freeze authority**: Once revoked, you can NEVER freeze accounts again
- **Burning tokens**: Burned tokens are permanently destroyed
- **Authority transfers**: Transferring authority to another wallet is permanent unless they transfer it back

#### 💰 FINANCIAL RISKS

- **Real money involved**: Mainnet uses actual SOL and real funds
- **Transaction fees**: All operations cost SOL (usually 0.000005 SOL, but can be higher during congestion)
- **Lost funds**: Sending tokens to wrong address = permanent loss
- **No customer support**: Blockchain transactions are final, no refunds or reversals
- **Wallet security**: Compromised private keys = complete loss of funds

#### 🔒 SECURITY REQUIREMENTS

**MANDATORY BEFORE MAINNET:**
- [ ] Private keys stored in hardware wallet or secure key management system
- [ ] Never commit private keys to git or share via insecure channels
- [ ] Backup wallet stored in multiple secure physical locations
- [ ] Tested wallet recovery process successfully
- [ ] Team members trained on security best practices
- [ ] Multi-signature wallet setup for critical operations (highly recommended)
- [ ] Security audit completed (if handling significant value)

#### ⚖️ LEGAL CONSIDERATIONS

**CONSULT LEGAL COUNSEL BEFORE DEPLOYMENT:**
- Securities laws may apply to your token
- Different jurisdictions have different regulations
- KYC/AML requirements may apply
- Tax implications for token distribution
- Terms of service and disclaimers required
- Geographic restrictions may be necessary
- Consumer protection laws must be considered

**This software is provided as-is with no warranties. You are solely responsible for:**
- Legal compliance in your jurisdiction
- Financial losses from errors or attacks
- Security of private keys and funds
- Token value and market performance
- User support and technical issues

#### 🛠️ TECHNICAL PREREQUISITES

**MUST COMPLETE BEFORE MAINNET:**
- [ ] Comprehensive testing on devnet (minimum 48 hours)
- [ ] All integration tests passing (npm test:integration)
- [ ] Unit test coverage ≥85% (npm run test:coverage)
- [ ] Admin interface tested thoroughly
- [ ] Monitoring and alerts configured
- [ ] Incident response plan documented
- [ ] Backup and recovery procedures tested
- [ ] Team trained on emergency procedures

#### 📊 TOKENOMICS VALIDATION

- [ ] Total supply decided and cannot be changed (if revoking mint)
- [ ] Distribution plan finalized and documented
- [ ] Vesting schedules implemented (if applicable)
- [ ] Liquidity provisions planned
- [ ] Price discovery mechanism understood
- [ ] Market making strategy (if applicable)

#### 🚨 COMMON MISTAKES THAT CAUSE PERMANENT LOSS

1. **Revoking mint authority too early**: Can't mint more tokens for distribution
2. **Wrong wallet address**: Sending to invalid/wrong address loses tokens forever
3. **Insufficient testing**: Bugs in production can't be fixed without redeployment
4. **Poor key management**: Lost keys = lost control forever
5. **No freeze authority but needed it**: Can't freeze malicious accounts
6. **Inadequate SOL for operations**: Can't complete critical transactions

#### ✅ DEPLOYMENT READINESS CHECKLIST

**ONLY proceed if you can answer YES to ALL:**
- [ ] I have tested EVERYTHING on devnet multiple times
- [ ] I understand blockchain transactions are irreversible
- [ ] I have consulted with legal counsel about token regulations
- [ ] I have secured my private keys with hardware wallet or enterprise KMS
- [ ] I have multiple backups of my wallet in secure locations
- [ ] I have documented procedures for all operations
- [ ] I have an incident response plan
- [ ] I understand I may lose real money if something goes wrong
- [ ] I accept full responsibility for this deployment
- [ ] My team is trained and ready for production operations

### Pre-Deployment Checklist

**CRITICAL: Complete ALL items before proceeding**

#### Technical Preparation
- [ ] All devnet tests passing
- [ ] Token specifications finalized
- [ ] Logo uploaded to permanent storage
- [ ] Metadata JSON verified
- [ ] Deployment wallet funded (0.1+ SOL)
- [ ] Wallet backup confirmed and secured

#### Documentation
- [ ] Whitepaper/Litepaper published
- [ ] Tokenomics documented
- [ ] Website live with token information
- [ ] Social media profiles active
- [ ] FAQ prepared

#### Legal & Compliance
- [ ] Legal review completed
- [ ] Terms of service finalized
- [ ] Privacy policy ready
- [ ] Geographic restrictions implemented
- [ ] Tax implications understood

#### Team Coordination
- [ ] Team members briefed
- [ ] Support channels ready
- [ ] Announcement drafted
- [ ] Marketing materials prepared
- [ ] Community notified

### Deployment Steps

#### 1. Configure for Mainnet

```bash
# Update .env for mainnet
SOLANA_NETWORK=mainnet-beta
MAINNET_RPC_URL=https://api.mainnet-beta.solana.com
# Consider using private RPC for better reliability
```

#### 2. Fund Mainnet Wallet

```bash
# Configure for mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Check your address
solana address

# Fund wallet with SOL (purchase from exchange)
# Minimum: 0.1 SOL
# Recommended: 0.5 SOL for safe deployment
```

#### 3. Deploy to Mainnet

```bash
# Deploy to mainnet (with confirmations)
npm run deploy:mainnet
```

The script will:
1. Ask for multiple confirmations
2. Display final configuration
3. Require typing "MAINNET" to proceed
4. Deploy token step-by-step
5. Save all transaction signatures
6. Provide explorer links

#### 4. Immediate Post-Deployment

```bash
# Verify token info
npm run cli -- info

# Update .env with token address
TOKEN_MINT_ADDRESS=[YOUR_MAINNET_TOKEN_ADDRESS]
```

## Post-Deployment

### 1. Verification & Listing

#### Solscan Verification
```
1. Visit: https://solscan.io/token/[YOUR_TOKEN_ADDRESS]
2. Click "Update Token Info"
3. Submit verification form
4. Wait 1-3 business days
```

#### Token Registry Listings

**Solana Token List**
```bash
# Fork repository
git clone https://github.com/solana-labs/token-list

# Add token info
# Follow instructions in repository
# Create pull request
```

**Jupiter DEX**
- Minimum $250 liquidity required
- Automatic indexing within 24-48 hours
- Submission: https://station.jup.ag

**CoinGecko**
- Submit: https://www.coingecko.com/en/coins/new
- Requirements: Active trading, website, social media
- Review time: 2-8 weeks

**CoinMarketCap**
- Submit: https://coinmarketcap.com/request
- Requirements: Exchange listing, 3+ months trading
- Review time: 4-12 weeks

### 2. Announcement

#### Social Media Template

```
🚀 [TOKEN_NAME] is now LIVE on Solana!

Token Address: [YOUR_TOKEN_ADDRESS]
Symbol: [SYMBOL]
Total Supply: [SUPPLY]

🔗 Website: [URL]
📊 Explorer: https://solscan.io/token/[ADDRESS]
💬 Discord: [URL]
🐦 Twitter: [URL]

#Solana #SPLToken #Crypto
```

### 3. Monitoring Setup

```bash
# Set up monitoring
npm run monitor

# Configure alerts in .env
ENABLE_MONITORING=true
ALERT_WEBHOOK_URL=[YOUR_DISCORD/SLACK_WEBHOOK]

# Run monitoring periodically (cron job recommended)
# Example cron: every hour
0 * * * * cd /path/to/project && npm run monitor
```

### 4. Security Measures

#### Authority Management

```bash
# If using fixed supply, revoke mint authority
npm run cli -- revoke mint

# If not using freeze feature, revoke freeze authority
npm run cli -- revoke freeze

# For variable supply, transfer to multi-sig
# (requires multi-sig setup)
```

#### Wallet Security
- Store deployer wallet offline
- Use hardware wallet for authorities
- Never expose private keys
- Regular security audits

### 5. Distribution

#### Airdrop to Multiple Wallets

```bash
# Create CSV file: wallets.csv
# Format: wallet_address,amount

# Example:
# 7Xc9KLqTHgL8Np5VWY2k8C8VLfQfHCqBPbq9AxoqVBPW,1000
# 8Yd3LKqTHgL8Np5VWY2k8C8VLfQfHCqBPbq9AxoqVBQX,500

# Run airdrop
npm run cli -- airdrop wallets.csv
```

#### Liquidity Pool Setup

Follow DEX-specific guides:
- Raydium: https://raydium.io
- Orca: https://www.orca.so
- Jupiter: https://jup.ag

## Troubleshooting

### Common Issues

#### 1. "Insufficient SOL balance"

```bash
# Check balance
solana balance

# For devnet
solana airdrop 2

# For mainnet
# Purchase SOL from exchange
```

#### 2. "Failed to create token"

```bash
# Check network connection
solana config get

# Verify RPC endpoint is responding
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Try different RPC endpoint
solana config set --url https://api.devnet.solana.com
```

#### 3. "Mint authority not found"

This means mint authority has been revoked. If you need to mint more tokens, you'll need to deploy a new token or use a different authority model.

#### 4. "Transaction failed"

```bash
# Check transaction details
solana confirm [SIGNATURE]

# Common reasons:
# - Insufficient SOL for fees
# - Network congestion
# - Invalid parameters

# Retry with higher priority fee (mainnet)
# Edit transaction parameters in code
```

#### 5. "Metadata upload failed"

```bash
# Check Arweave/IPFS connectivity
# Ensure you have sufficient AR or IPFS pinning credits

# Alternative: Upload manually
# 1. Upload logo to Arweave/IPFS
# 2. Update .env with logo URL
# 3. Run: npm run create-metadata
```

### Getting Help

#### Community Resources
- Solana Discord: https://discord.com/invite/solana
- Solana Stack Exchange: https://solana.stackexchange.com
- GitHub Issues: [Your project repository]

#### Support Channels
- Email: [Your support email]
- Discord: [Your Discord server]
- Twitter: [Your Twitter handle]

### Logs and Debugging

```bash
# Enable debug logging
export DEBUG=*

# Run with verbose output
npm run deploy:devnet -- --verbose

# Check deployment logs
cat deployments/devnet-latest.json

# Check transaction on explorer
# https://solscan.io/tx/[SIGNATURE]
```

## Next Steps

After successful deployment:

1. **Monitor**: Set up monitoring and alerts
2. **Engage**: Build your community
3. **Develop**: Add additional features
4. **Integrate**: Connect to your platform
5. **Scale**: Expand utility and use cases

---

**Need help?** Contact the team or consult the [REQUIREMENTS.md](./REQUIREMENTS.md) for detailed specifications.
