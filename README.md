# Solana SPL Utility Token - Complete Deployment System

A comprehensive, production-ready system for creating, deploying, and managing Solana SPL utility tokens with full operational controls and admin interface.

## 🚀 Features

### Core Functionality
- ✅ **SPL Token Creation** - Standard Solana token deployment
- ✅ **Metaplex Metadata** - Industry-standard token metadata
- ✅ **Token Operations** - Mint, burn, transfer, freeze/thaw
- ✅ **Authority Management** - Secure permission controls
- ✅ **CLI Tools** - Complete command-line interface
- ✅ **Admin Interface** - Web-based management dashboard
- ✅ **Deployment Automation** - Devnet and mainnet scripts
- ✅ **Monitoring** - Real-time token monitoring
- ✅ **Security** - Best practices and guidelines

### Advanced Features
- Multi-signature support ready
- Batch operations (airdrops)
- Token supply monitoring
- Transaction logging
- Explorer integration
- Wallet compatibility (Phantom, Solflare, etc.)

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [CLI Usage](#cli-usage)
- [Admin Interface](#admin-interface)
- [Documentation](#documentation)
- [Security](#security)
- [Support](#support)

## ⚡ Quick Start

```bash
# 1. Clone and install
cd solana-utility-token-minter
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Deploy to devnet
npm run deploy:devnet

# 4. Test operations
npm run cli -- info

# 5. Start admin interface
npm run admin
```

## 📦 Installation

### Prerequisites

- **Node.js** v18+
- **Solana CLI** v1.18.0+
- **Git**
- A Solana wallet with SOL

### System Setup

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version

# Install SPL Token CLI (optional, for manual operations)
cargo install spl-token-cli

# Create Solana wallet (if you don't have one)
solana-keygen new --outfile ~/.config/solana/id.json
```

### Project Installation

```bash
# Install project dependencies
npm install

# Install admin interface dependencies
cd admin && npm install && cd ..

# Verify installation
npm run cli -- --version
```

## ⚙️ Configuration

### Environment Variables

Edit `.env` file with your token specifications:

```env
# Network (devnet for testing, mainnet-beta for production)
SOLANA_NETWORK=devnet

# Token Details
TOKEN_NAME=Your Token Name
TOKEN_SYMBOL=YTN
TOKEN_DECIMALS=9
TOTAL_SUPPLY=1000000000
INITIAL_MINT_AMOUNT=400000000

# Token Description
TOKEN_DESCRIPTION=Your utility token for XYZ platform

# Authorities
MINT_AUTHORITY_ENABLED=true
FREEZE_AUTHORITY_ENABLED=false

# Asset
TOKEN_LOGO_URL=https://your-cdn.com/logo.png
```

### Token Logo

Place your token logo at `./assets/logo.png`:
- **Format:** PNG (transparent background preferred)
- **Size:** 500x500px minimum
- **File size:** Under 1MB

## 🚀 Deployment

### Devnet Deployment (Testing)

```bash
# 1. Get devnet SOL
solana airdrop 2

# 2. Run test suite
npm run test:devnet

# 3. Deploy to devnet
npm run deploy:devnet

# 4. Verify deployment
npm run cli -- info
```

### Mainnet Deployment (Production)

```bash
# 1. Switch to mainnet configuration
# Edit .env: SOLANA_NETWORK=mainnet-beta

# 2. Ensure wallet is funded (0.1+ SOL)
solana balance

# 3. Review checklist in DEPLOYMENT_GUIDE.md

# 4. Deploy to mainnet
npm run deploy:mainnet

# Follow all prompts carefully!
```

### Deployment Output

After successful deployment:
```
✅ Token created: [MINT_ADDRESS]
✅ Metadata uploaded: [METADATA_URI]
✅ Initial supply minted: [AMOUNT] tokens

🔗 View on Solscan:
https://solscan.io/token/[MINT_ADDRESS]
```

## 🛠️ CLI Usage

### Token Information

```bash
# Display token details
npm run cli -- info
```

### Check Balance

```bash
# Check balance for any wallet
npm run cli -- balance <wallet-address>
```

### Mint Tokens

```bash
# Mint tokens to a wallet (requires mint authority)
npm run cli -- mint <amount> <recipient-address>

# Example: Mint 1000 tokens
npm run cli -- mint 1000 7Xc9KLqTHgL8Np5VWY2k8C8VLfQfHCqBPbq9AxoqVBPW
```

### Burn Tokens

```bash
# Burn tokens from your wallet
npm run cli -- burn <amount>

# Example: Burn 500 tokens
npm run cli -- burn 500
```

### Transfer Tokens

```bash
# Transfer tokens to another wallet
npm run cli -- transfer <amount> <recipient-address>

# Example: Transfer 100 tokens
npm run cli -- transfer 100 8Yd3LKqTHgL8Np5VWY2k8C8VLfQfHCqBPbq9AxoqVBQX
```

### Freeze/Thaw Account

```bash
# Freeze a token account (requires freeze authority)
npm run cli -- freeze <wallet-address>

# Unfreeze a token account
npm run cli -- thaw <wallet-address>
```

### Revoke Authority

```bash
# Permanently revoke mint authority (CANNOT BE UNDONE)
npm run cli -- revoke mint

# Permanently revoke freeze authority
npm run cli -- revoke freeze
```

### Batch Airdrop

```bash
# Create CSV file with recipients
# Format: wallet_address,amount

# wallets.csv:
# 7Xc9KLq...,1000
# 8Yd3LKq...,500

# Run airdrop
npm run cli -- airdrop wallets.csv
```

### Full CLI Help

```bash
# Show all available commands
npm run cli -- --help
```

## 🖥️ Admin Interface

### Starting the Admin Interface

```bash
# Start development server
npm run admin

# Access at: http://localhost:3000
```

### Admin Interface Features

- **Token Information Dashboard**
  - Real-time supply tracking
  - Authority status
  - Token metadata display

- **Mint Tokens**
  - Specify recipient and amount
  - Transaction confirmation
  - Real-time balance updates

- **Burn Tokens**
  - Burn from connected wallet
  - Balance verification
  - Permanent supply reduction

- **Transfer Tokens**
  - Send to any Solana wallet
  - Amount validation
  - Transaction tracking

- **Freeze/Thaw Accounts**
  - Account state checking
  - Freeze operations (if enabled)
  - Compliance management

### Admin Configuration

Configure admin interface in `admin/.env`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_TOKEN_MINT=<your-token-mint-address>
NEXT_PUBLIC_RPC_URL=<optional-custom-rpc>
```

### Production Deployment

```bash
# Build for production
cd admin
npm run build

# Start production server
npm start

# Or deploy to Vercel/Netlify
```

## 📚 Documentation

Comprehensive documentation is available:

### Core Documentation
- **[REQUIREMENTS.md](./REQUIREMENTS.md)** - Complete technical specifications (74KB)
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- **[SECURITY.md](./SECURITY.md)** - Security best practices and guidelines

### Quick References
- **API Documentation** - In-code JSDoc comments
- **CLI Help** - `npm run cli -- --help`
- **Examples** - In `scripts/` directory

## 🔒 Security

### Key Security Features

1. **Private Key Management**
   - Hardware wallet support
   - Encrypted storage
   - Never exposed in code

2. **Authority Controls**
   - Multi-signature ready
   - Revocable permissions
   - Role-based access

3. **Transaction Safety**
   - Amount validation
   - Address verification
   - Confirmation prompts

4. **Monitoring**
   - Real-time alerts
   - Supply tracking
   - Anomaly detection

### Security Best Practices

✅ **Always**:
- Store private keys in hardware wallets
- Test on devnet first
- Verify all addresses before transactions
- Keep backups in multiple secure locations
- Use multi-sig for production authorities

❌ **Never**:
- Share private keys
- Store keys in plaintext
- Use development wallets in production
- Skip testing on devnet
- Ignore security warnings

### Security Checklist

Before mainnet deployment:
- [ ] Private keys secured in hardware wallet
- [ ] Multiple secure backups created
- [ ] All tests passing on devnet
- [ ] Configuration reviewed
- [ ] Team trained on operations
- [ ] Monitoring configured
- [ ] Incident response plan ready

See [SECURITY.md](./SECURITY.md) for complete guidelines.

## 📊 Monitoring

### Real-Time Monitoring

```bash
# Run monitoring check
npm run monitor

# Set up automated monitoring
# Add to cron: 0 * * * * cd /path/to/project && npm run monitor
```

### Monitoring Features

- Supply changes detection
- Authority modifications tracking
- Large transfer alerts
- Transaction logging
- Historical data

### Alert Configuration

Configure alerts in `.env`:

```env
ENABLE_MONITORING=true
ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## 🧪 Testing

### Automated Testing

```bash
# Run comprehensive test suite
npm run test:devnet
```

### Test Coverage

- ✅ Token creation
- ✅ Metadata upload
- ✅ Minting operations
- ✅ Transfer operations
- ✅ Burn operations
- ✅ Freeze/thaw (if enabled)
- ✅ Authority management
- ✅ Supply verification

### Manual Testing

1. Create test token on devnet
2. Test all operations via CLI
3. Test admin interface
4. Verify on Solscan
5. Test wallet compatibility

## 📁 Project Structure

```
12-mint-solana-utility-token/
├── admin/                    # Admin web interface (Next.js)
│   ├── app/                  # Next.js app directory
│   ├── components/           # React components
│   ├── package.json          # Admin dependencies
│   └── .env.example          # Admin configuration
│
├── cli/                      # Command-line interface
│   └── token-cli.ts          # CLI implementation
│
├── scripts/                  # Deployment and utility scripts
│   ├── deploy-devnet.ts      # Devnet deployment
│   ├── deploy-mainnet.ts     # Mainnet deployment
│   ├── create-metadata.ts    # Metadata creation
│   ├── test-devnet.ts        # Testing suite
│   └── monitor-token.ts      # Monitoring script
│
├── src/                      # Core library
│   ├── config.ts             # Configuration management
│   ├── token/                # Token operations
│   │   ├── operations.ts     # Core token functions
│   │   └── metadata.ts       # Metadata management
│   └── utils/                # Utility functions
│       ├── wallet.ts         # Wallet management
│       └── logger.ts         # Logging utilities
│
├── deployments/              # Deployment records
├── assets/                   # Token logo and assets
├── .env.example              # Environment template
├── package.json              # Project dependencies
├── REQUIREMENTS.md           # Technical specifications
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
├── SECURITY.md               # Security guidelines
└── README.md                 # This file
```

## 🔧 Troubleshooting

### Common Issues

**Problem: "Insufficient SOL balance"**
```bash
# Devnet: Get free SOL
solana airdrop 2

# Mainnet: Purchase SOL from exchange
```

**Problem: "Token mint not found"**
```bash
# Check network configuration
solana config get

# Verify token address
npm run cli -- info
```

**Problem: "Mint authority not found"**
- Mint authority has been revoked
- Deploy new token or use different authority model

**Problem: "Transaction failed"**
```bash
# Check transaction details
solana confirm <SIGNATURE>

# Common causes:
# - Insufficient SOL for fees
# - Network congestion
# - Invalid parameters
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for more troubleshooting.

## 🤝 Support

### Community Resources
- Solana Discord: https://discord.com/invite/solana
- Solana Stack Exchange: https://solana.stackexchange.com
- Metaplex Docs: https://docs.metaplex.com

### Documentation
- Solana Docs: https://docs.solana.com
- SPL Token: https://spl.solana.com/token
- Anchor: https://www.anchor-lang.com

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Solana](https://solana.com) - High-performance blockchain
- [SPL Token](https://spl.solana.com) - Token standard
- [Metaplex](https://www.metaplex.com) - NFT and token metadata
- [Anchor](https://www.anchor-lang.com) - Solana development framework
- [Next.js](https://nextjs.org) - React framework for admin interface

## 📝 Notes

### Token Standards
- **SPL Token**: Standard Solana token (recommended)
- **Token-2022**: Advanced features (transfer fees, hooks, etc.)
- **Custom Anchor**: Full control (requires audit)

### Network Costs
- Token creation: ~0.01 SOL (~$2)
- Transactions: ~0.000005 SOL each
- Metadata: ~0.01 SOL
- **Total**: < $10 in blockchain fees

### Timeline
- Devnet deployment: 1 day
- Testing: 1-2 days
- Mainnet deployment: 1 day
- **Total**: 3-4 days for complete system

---

**Ready to deploy your Solana utility token?**

Start with: `npm run deploy:devnet`

For questions or issues, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) or [SECURITY.md](./SECURITY.md).
