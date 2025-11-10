# REQUIREMENTS.md - Solana Utility Token Minting

## Project Overview

This document outlines the comprehensive requirements for creating and deploying a native Solana utility token (SPL token) with operational controls, metadata configuration, and platform integration capabilities.

---

## 1. TECHNICAL SPECIFICATIONS

### 1.1 Token Program Selection Matrix

#### Option A: Native SPL Token Program (Recommended for Standard Tokens)

**Use Cases:**
- Standard utility tokens without complex logic
- Platform currencies for in-app purchases
- Loyalty/rewards programs
- Simple governance tokens

**Technical Stack:**
- Solana SPL Token Program (built-in)
- Solana CLI tools
- @solana/spl-token library
- No custom Rust code required

**Advantages:**
- Battle-tested security (millions of tokens deployed)
- Lower development cost ($500-$2,000)
- Fast deployment (1-2 weeks)
- Broad wallet support (all Solana wallets)
- Standard tooling and documentation
- Lower on-chain costs (~0.01 SOL)

**Limitations:**
- No custom business logic
- Limited programmability
- Standard token operations only
- Cannot implement complex distribution mechanisms

**When to Choose:**
- Budget under $5,000
- Timeline under 2 weeks
- Standard token functionality sufficient
- Security is top priority
- No custom logic required

#### Option B: Custom Anchor Program (For Advanced Features)

**Use Cases:**
- Tokens with vesting schedules
- Built-in staking mechanisms
- Custom transfer restrictions
- Complex distribution logic
- Integration with other smart contracts
- Access control mechanisms

**Technical Stack:**
- Rust programming language
- Anchor Framework v0.29+
- Solana Program Library
- Custom program architecture
- Security audit tools

**Advantages:**
- Full customization capability
- Custom business logic
- Advanced token features
- Direct platform integration hooks
- Programmatic control mechanisms

**Limitations:**
- Higher development cost ($3,000-$10,000)
- Requires security audit ($3,000-$50,000)
- More complex architecture
- Longer development timeline (3-4 weeks)
- Higher risk if not properly audited

**When to Choose:**
- Budget over $10,000
- Timeline 4+ weeks
- Custom features required
- In-house technical team available
- Advanced tokenomics needed

#### Decision Matrix

| Feature | SPL Token | Custom Anchor |
|---------|-----------|---------------|
| Cost | $500-$2,000 | $10,000-$25,000 |
| Timeline | 1-2 weeks | 3-4 weeks |
| Security | Proven | Requires audit |
| Customization | Limited | Unlimited |
| Maintenance | Minimal | Ongoing |
| Complexity | Low | High |
| Wallet Support | Universal | May require adapters |

### 1.2 Rust/Anchor Framework Setup

#### Development Environment Requirements

**System Requirements:**
- Operating System: Linux, macOS, or Windows (WSL2)
- RAM: Minimum 8GB, recommended 16GB
- Disk Space: 20GB free
- Internet: Stable connection for blockchain interaction

**Core Dependencies:**

```bash
# Rust installation (latest stable version)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update stable

# Solana CLI tools (v1.18.0+)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor CLI (v0.29.0+) - for custom programs only
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# SPL Token CLI
cargo install spl-token-cli
```

**Node.js Dependencies:**

```bash
# Node.js v18+ required
npm install -g yarn

# Core Solana libraries
npm install @solana/web3.js @solana/spl-token
```

#### Project Structure (Custom Anchor Program)

```
solana-utility-token/
├── programs/
│   └── utility-token/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs          # Main program entry
│           ├── instructions/   # Token operations
│           │   ├── initialize.rs
│           │   ├── mint.rs
│           │   ├── burn.rs
│           │   └── transfer.rs
│           ├── state/          # Account structures
│           │   └── token.rs
│           └── errors.rs       # Custom errors
├── tests/
│   └── utility-token.ts        # Integration tests
├── migrations/
│   └── deploy.ts               # Deployment scripts
├── target/                     # Build artifacts
├── Anchor.toml                 # Anchor configuration
├── Cargo.toml                  # Rust workspace
└── package.json                # Node dependencies
```

#### Anchor Program Configuration (Anchor.toml)

```toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
utility_token = "TokenProgramIDHere..."

[programs.mainnet]
utility_token = "TokenProgramIDHere..."

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### 1.3 Metaplex Token Metadata Integration

#### Metaplex Token Metadata Program

**Purpose:** Industry-standard metadata for Solana tokens, providing rich information displayed in wallets, explorers, and marketplaces.

**Program ID:** `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`

**Installation:**

```bash
# Metaplex JS SDK
npm install @metaplex-foundation/js
npm install @metaplex-foundation/mpl-token-metadata
```

#### Metadata Structure

**On-Chain Metadata (Required):**

```typescript
{
  name: string;              // Max 32 bytes (e.g., "Platform Utility Token")
  symbol: string;            // Max 10 bytes (e.g., "PUT")
  uri: string;               // Max 200 bytes (JSON metadata URL)
  sellerFeeBasisPoints: number; // 0 for utility tokens
  creators: Creator[];       // Token creators
  collection: Collection;    // Optional collection grouping
  uses: Uses;               // Optional usage tracking
}
```

**Off-Chain Metadata (JSON file):**

```json
{
  "name": "Platform Utility Token",
  "symbol": "PUT",
  "description": "Utility token for XYZ platform ecosystem, enabling in-app purchases, staking rewards, and governance participation.",
  "image": "https://arweave.net/token-logo-hash",
  "animation_url": "",
  "external_url": "https://platform.com",
  "attributes": [
    {
      "trait_type": "Token Type",
      "value": "Utility"
    },
    {
      "trait_type": "Blockchain",
      "value": "Solana"
    },
    {
      "trait_type": "Standard",
      "value": "SPL Token"
    }
  ],
  "properties": {
    "category": "utility",
    "files": [
      {
        "uri": "https://arweave.net/token-logo-hash",
        "type": "image/png"
      }
    ],
    "creators": [
      {
        "address": "CreatorWalletAddressHere",
        "share": 100
      }
    ]
  }
}
```

#### Metadata Creation Code

```typescript
import { Metaplex } from "@metaplex-foundation/js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

// Initialize Metaplex instance
const connection = new Connection("https://api.devnet.solana.com");
const wallet = Keypair.fromSecretKey(/* wallet secret key */);
const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet));

// Create token metadata
const { nft } = await metaplex.nfts().create({
  uri: "https://arweave.net/metadata.json",
  name: "Platform Utility Token",
  symbol: "PUT",
  sellerFeeBasisPoints: 0,
  isMutable: true, // Can update metadata later
  tokenStandard: TokenStandard.Fungible,
  mint: mintPublicKey,
  updateAuthority: wallet.publicKey,
});
```

### 1.4 Token-2022 Program Consideration

#### Token Extensions Program Overview

**Program ID:** `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`

Token-2022 (Token Extensions) is the next generation SPL Token program with advanced features while maintaining backward compatibility.

#### Key Features

**Transfer Fees:**
```rust
// Configurable fee on every transfer
// Fees collected to designated account
// Useful for platform revenue
```

**Transfer Hooks:**
```rust
// Custom program called on every transfer
// Enables complex logic (KYC, access control)
// Platform-specific rules enforcement
```

**Confidential Transfers:**
```rust
// Private transfer amounts
// Zero-knowledge proofs
// Enhanced privacy
```

**Interest-Bearing Tokens:**
```rust
// Built-in APY mechanism
// Automatic balance updates
// No staking contract needed
```

**Permanent Delegate:**
```rust
// Recoverable tokens for compliance
// Enterprise use cases
// Regulated environments
```

**Non-Transferable Tokens:**
```rust
// Soul-bound tokens
// Reputation/credentials
// Cannot be transferred
```

**Required Memo on Transfer:**
```rust
// Enforce memo on every transfer
// Compliance tracking
// Audit trail
```

#### When to Use Token-2022

**Use Token-2022 If:**
- Need transfer fees for platform revenue
- Require transfer hooks for custom logic
- Privacy is important (confidential transfers)
- Want built-in interest/yield mechanism
- Compliance requirements (permanent delegate)
- Need non-transferable credentials

**Stick with Standard SPL Token If:**
- Standard utility token is sufficient
- Maximum compatibility required
- Simpler architecture preferred
- No advanced features needed

#### Implementation Example

```typescript
import {
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";

// Create Token-2022 with transfer fees
const mint = await createMint(
  connection,
  payer,
  mintAuthority,
  freezeAuthority,
  decimals,
  undefined, // No keypair means new random mint
  undefined, // Confirmation options
  TOKEN_2022_PROGRAM_ID // Use Token-2022 program
);

// Add transfer fee extension
await createInitializeTransferFeeConfigInstruction(
  mint,
  transferFeeConfigAuthority.publicKey,
  withdrawWithheldAuthority.publicKey,
  feeBasisPoints, // Fee in basis points (100 = 1%)
  maxFee,         // Maximum fee amount
  TOKEN_2022_PROGRAM_ID
);
```

---

## 2. FUNCTIONAL REQUIREMENTS

### 2.1 Token Creation with Specific Supply

#### Supply Models

**Fixed Supply Model:**
```
- Total supply minted at creation
- Mint authority immediately revoked
- No additional tokens can ever be created
- Bitcoin-like scarcity model
- Builds trust through immutability
```

**Variable Supply Model:**
```
- Initial supply minted
- Mint authority retained
- Additional tokens can be minted as needed
- Controlled inflation possible
- Flexible for growing platforms
```

**Deflationary Model:**
```
- Initial supply minted
- Burn mechanism implemented
- Supply decreases over time
- Scarcity increases
- Value proposition through reduction
```

#### Token Specifications

```typescript
interface TokenSpecs {
  name: string;              // "Platform Utility Token"
  symbol: string;            // "PUT" (3-5 characters recommended)
  decimals: number;          // 9 (standard for Solana)
  totalSupply: number;       // e.g., 1,000,000,000 tokens
  initialMint: number;       // Amount to mint at creation
  supplyModel: "fixed" | "variable" | "deflationary";
}
```

#### Creation Implementation

**CLI Method (SPL Token):**

```bash
# Create token mint
spl-token create-token --decimals 9

# Output: Token mint address
# Example: 7Xc9KLqTHgL8Np5VWY2k8C8VLfQfHCqBPbq9AxoqVBPW

# Mint initial supply
spl-token create-account <TOKEN_MINT_ADDRESS>
spl-token mint <TOKEN_MINT_ADDRESS> 1000000000

# For fixed supply: Revoke mint authority
spl-token authorize <TOKEN_MINT_ADDRESS> mint --disable
```

**Programmatic Method (JavaScript):**

```typescript
import {
  createMint,
  getMint,
  mintTo,
  setAuthority,
  AuthorityType
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

async function createUtilityToken() {
  const connection = new Connection("https://api.devnet.solana.com");
  const payer = Keypair.fromSecretKey(/* secret key */);

  // Create mint account
  const mint = await createMint(
    connection,
    payer,                    // Payer for transaction
    payer.publicKey,          // Mint authority
    payer.publicKey,          // Freeze authority (optional)
    9                         // Decimals
  );

  console.log("Token Mint Address:", mint.toBase58());

  // Create associated token account for initial mint
  const tokenAccount = await createAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  // Mint initial supply (1 billion tokens)
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount,
    payer,                    // Mint authority
    1_000_000_000_000_000_000 // Amount with decimals (1B * 10^9)
  );

  // Optional: Revoke mint authority for fixed supply
  await setAuthority(
    connection,
    payer,
    mint,
    payer,                    // Current authority
    AuthorityType.MintTokens,
    null                      // New authority (null = revoke)
  );

  return mint;
}
```

### 2.2 Metadata Configuration

#### Required Metadata Fields

```typescript
interface TokenMetadata {
  // On-chain metadata (stored with token)
  name: string;              // Max 32 chars
  symbol: string;            // Max 10 chars
  decimals: number;          // Usually 9

  // Off-chain metadata (JSON file)
  description: string;       // Detailed description
  image: string;            // Logo URL (PNG/SVG)
  externalUrl: string;      // Platform website

  // Optional but recommended
  animation_url?: string;    // Animated logo
  backgroundColor?: string;  // Hex color code
  attributes: Attribute[];   // Additional properties

  // Social links
  twitter?: string;
  discord?: string;
  telegram?: string;
  medium?: string;
}

interface Attribute {
  trait_type: string;
  value: string | number;
}
```

#### Logo Requirements

**Technical Specifications:**
- Format: PNG or SVG
- Size: 500x500px minimum (square aspect ratio)
- File size: Under 1MB
- Background: Transparent preferred
- Resolution: High quality for all display sizes

**Design Guidelines:**
- Simple and recognizable
- Works in small sizes (32x32px)
- Distinct from other tokens
- Matches platform branding
- Professional appearance

#### Metadata Hosting Options

**Option 1: Arweave (Recommended)**
```
- Permanent storage
- Pay once, store forever
- Decentralized
- Cost: ~$0.01 per KB
- Preferred by Solana ecosystem
```

**Option 2: IPFS**
```
- Decentralized storage
- Content-addressed
- Requires pinning service
- Cost: Varies by provider
- Good alternative to Arweave
```

**Option 3: Traditional Web Hosting**
```
- Centralized
- Easier to update
- Lower cost initially
- Less trust-minimized
- Use only if necessary
```

### 2.3 Mint Authority Configuration

#### Mint Authority Options

**Option A: Retained Authority (Centralized)**

```typescript
// Mint authority held by platform wallet
// Allows minting additional tokens as needed
// More control, less decentralization

const mintAuthority = platformWallet.publicKey;
```

**Pros:**
- Can mint tokens for rewards, airdrops
- Flexible for growing platforms
- Easy to manage initial phase

**Cons:**
- Centralization concerns
- Trust required from users
- Potential for unlimited inflation

**Option B: Multi-Signature Authority**

```typescript
// Mint authority requires multiple signatures
// Distributed control among team members
// Balance between flexibility and security

import { Multisig } from "@solana/spl-token";

const multisig = await Multisig.create(
  connection,
  payer,
  [signer1.publicKey, signer2.publicKey, signer3.publicKey],
  2 // Require 2 of 3 signatures
);
```

**Pros:**
- Distributed control
- Reduced single-point-of-failure
- More trustworthy than single authority
- Industry best practice

**Cons:**
- More complex operations
- Coordination required
- Slower for urgent actions

**Option C: Program-Controlled Authority**

```rust
// Mint authority held by smart contract
// Programmatic rules enforced
// Most decentralized option

#[account(mut)]
pub mint_authority: Signer<'info>,
#[account(
    mut,
    constraint = token_mint.mint_authority == COption::Some(mint_authority.key())
)]
pub token_mint: Account<'info, Mint>,
```

**Pros:**
- Transparent rules
- Fully decentralized
- Predictable behavior
- Cannot be overridden

**Cons:**
- Requires custom program
- More expensive to develop
- Rules are immutable (unless upgrade mechanism)

**Option D: Revoked Authority (Fixed Supply)**

```typescript
// Mint authority permanently revoked
// No additional tokens can ever be minted
// Maximum decentralization and trust

await setAuthority(
  connection,
  payer,
  mint,
  currentAuthority,
  AuthorityType.MintTokens,
  null // Revoke by setting to null
);
```

**Pros:**
- Maximum trust from users
- Clear scarcity model
- No inflation concerns
- Simple to understand

**Cons:**
- No flexibility
- Cannot fix mistakes
- Cannot reward users with new tokens
- Irreversible decision

#### Recommendation Matrix

| Use Case | Recommended Authority |
|----------|----------------------|
| Platform rewards program | Multi-sig |
| Fixed supply currency | Revoked |
| Growing ecosystem | Multi-sig or Program |
| Early stage startup | Retained (with roadmap to multi-sig) |
| DAO governance token | Program-controlled |

### 2.4 Freeze Authority Configuration

#### Freeze Authority Purpose

Freeze authority allows designated wallet(s) to freeze specific token accounts, preventing transfers until thawed. This is useful for:

- Compliance requirements (AML/CFT)
- Fraud prevention
- Lost/stolen wallet recovery
- Regulatory compliance
- Enterprise use cases

#### Configuration Options

**Option A: Enabled with Platform Control**

```typescript
// Platform can freeze/thaw accounts
const freezeAuthority = platformWallet.publicKey;

await createMint(
  connection,
  payer,
  mintAuthority,
  freezeAuthority, // Enable freeze authority
  decimals
);
```

**When to Use:**
- Regulated environments
- Enterprise customers
- Compliance requirements
- Customer protection needed

**Option B: Multi-Sig Freeze Authority**

```typescript
// Multiple signatures required to freeze
const freezeAuthority = multisigWallet.publicKey;
```

**When to Use:**
- Balance between control and decentralization
- Prevent single-point abuse
- Team consensus required

**Option C: Revoked/Disabled**

```typescript
// No freeze capability
const freezeAuthority = null;

// Or revoke existing authority
await setAuthority(
  connection,
  payer,
  mint,
  currentAuthority,
  AuthorityType.FreezeAccount,
  null // Revoke
);
```

**When to Use:**
- Maximum decentralization
- No compliance requirements
- Community-focused tokens
- DeFi applications

#### Freeze/Thaw Operations

```bash
# Freeze a token account
spl-token freeze <TOKEN_ACCOUNT> --owner <FREEZE_AUTHORITY>

# Thaw (unfreeze) a token account
spl-token thaw <TOKEN_ACCOUNT> --owner <FREEZE_AUTHORITY>

# Check if account is frozen
spl-token account-info <TOKEN_ACCOUNT>
```

### 2.5 Operational Controls

#### Mint Operations

**Programmatic Minting:**

```typescript
import { mintTo } from "@solana/spl-token";

async function mintTokens(
  amount: number,
  destinationAccount: PublicKey
): Promise<string> {
  const signature = await mintTo(
    connection,
    payer,
    mint,
    destinationAccount,
    mintAuthority,
    amount * Math.pow(10, decimals) // Convert to smallest unit
  );

  return signature;
}
```

**CLI Minting:**

```bash
# Mint 1000 tokens to specific account
spl-token mint <TOKEN_MINT> 1000 <DESTINATION_ACCOUNT>

# Mint to associated token account
spl-token mint <TOKEN_MINT> 1000 --recipient-owner <WALLET_ADDRESS>
```

#### Burn Operations

**Programmatic Burning:**

```typescript
import { burn } from "@solana/spl-token";

async function burnTokens(
  amount: number,
  tokenAccount: PublicKey,
  owner: Keypair
): Promise<string> {
  const signature = await burn(
    connection,
    payer,
    tokenAccount,
    mint,
    owner,
    amount * Math.pow(10, decimals)
  );

  return signature;
}
```

**CLI Burning:**

```bash
# Burn tokens from your account
spl-token burn <TOKEN_ACCOUNT> 1000

# Burn with explicit owner
spl-token burn <TOKEN_ACCOUNT> 1000 --owner <OWNER_KEYPAIR>
```

#### Transfer Operations

**Programmatic Transfer:**

```typescript
import { transfer } from "@solana/spl-token";

async function transferTokens(
  amount: number,
  fromAccount: PublicKey,
  toAccount: PublicKey,
  owner: Keypair
): Promise<string> {
  const signature = await transfer(
    connection,
    payer,
    fromAccount,
    toAccount,
    owner,
    amount * Math.pow(10, decimals)
  );

  return signature;
}
```

**CLI Transfer:**

```bash
# Transfer tokens
spl-token transfer <TOKEN_MINT> <AMOUNT> <RECIPIENT_ADDRESS>

# Transfer from specific account
spl-token transfer <TOKEN_MINT> <AMOUNT> <RECIPIENT> --from <SOURCE_ACCOUNT>
```

---

## 3. IMPLEMENTATION GUIDE

### 3.1 SPL Token Creation Using CLI

#### Step-by-Step Guide

**Step 1: Environment Setup**

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

**Step 2: Wallet Configuration**

```bash
# Create new wallet (or use existing)
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# Set network to devnet for testing
solana config set --url https://api.devnet.solana.com

# Airdrop SOL for transaction fees (devnet only)
solana airdrop 2

# Check balance
solana balance
```

**Step 3: Create Token Mint**

```bash
# Create token with 9 decimals
spl-token create-token --decimals 9

# Output example:
# Creating token 7Xc9KLqTHgL8Np5VWY2k8C8VLfQfHCqBPbq9AxoqVBPW
# Signature: 2ZqJ...

# Save this token address - you'll need it!
export TOKEN_MINT=7Xc9KLqTHgL8Np5VWY2k8C8VLfQfHCqBPbq9AxoqVBPW
```

**Step 4: Create Token Account**

```bash
# Create associated token account for your wallet
spl-token create-account $TOKEN_MINT

# Output example:
# Creating account 4Zv3...
```

**Step 5: Mint Initial Supply**

```bash
# Mint 1 billion tokens (1000000000)
spl-token mint $TOKEN_MINT 1000000000

# Check balance
spl-token balance $TOKEN_MINT

# Check supply
spl-token supply $TOKEN_MINT
```

**Step 6: Configure Authorities**

```bash
# View current authorities
spl-token display $TOKEN_MINT

# For fixed supply: Revoke mint authority
spl-token authorize $TOKEN_MINT mint --disable

# Optional: Revoke freeze authority
spl-token authorize $TOKEN_MINT freeze --disable
```

### 3.2 Anchor Custom Program Development

#### Project Initialization

```bash
# Create new Anchor project
anchor init utility-token-program

cd utility-token-program
```

#### Program Structure (lib.rs)

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};

declare_id!("YourProgramIDHere");

#[program]
pub mod utility_token {
    use super::*;

    // Initialize token with custom parameters
    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        uri: String,
        total_supply: u64,
    ) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;
        token_data.name = name;
        token_data.symbol = symbol;
        token_data.uri = uri;
        token_data.total_supply = total_supply;
        token_data.current_supply = 0;
        token_data.authority = ctx.accounts.authority.key();

        msg!("Token initialized: {} ({})", token_data.name, token_data.symbol);
        Ok(())
    }

    // Mint tokens with custom logic
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;

        // Custom validation
        require!(
            token_data.current_supply + amount <= token_data.total_supply,
            ErrorCode::ExceedsMaxSupply
        );

        // Mint tokens
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::mint_to(cpi_ctx, amount)?;

        token_data.current_supply += amount;

        msg!("Minted {} tokens", amount);
        Ok(())
    }

    // Burn tokens
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;

        // Burn tokens
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, amount)?;

        token_data.current_supply -= amount;

        msg!("Burned {} tokens", amount);
        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + TokenData::LEN
    )]
    pub token_data: Account<'info, TokenData>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub token_data: Account<'info, TokenData>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub token_data: Account<'info, TokenData>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// State
#[account]
pub struct TokenData {
    pub name: String,           // 4 + 32
    pub symbol: String,         // 4 + 10
    pub uri: String,            // 4 + 200
    pub total_supply: u64,      // 8
    pub current_supply: u64,    // 8
    pub authority: Pubkey,      // 32
}

impl TokenData {
    pub const LEN: usize = 4 + 32 + 4 + 10 + 4 + 200 + 8 + 8 + 32;
}

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Amount exceeds maximum supply")]
    ExceedsMaxSupply,
}
```

#### Build and Deploy

```bash
# Build program
anchor build

# Get program ID
solana address -k target/deploy/utility_token-keypair.json

# Update program ID in lib.rs and Anchor.toml

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

### 3.3 Metaplex Metadata Setup

#### Installation

```bash
npm install @metaplex-foundation/js
npm install @metaplex-foundation/mpl-token-metadata
```

#### Metadata Creation Script

```typescript
import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";

async function createTokenMetadata() {
  // Connection setup
  const connection = new Connection("https://api.devnet.solana.com");
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync("./wallet.json", "utf-8")))
  );

  // Metaplex instance with Bundlr storage (Arweave)
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(walletKeypair))
    .use(bundlrStorage({
      address: "https://devnet.bundlr.network",
      providerUrl: "https://api.devnet.solana.com",
      timeout: 60000,
    }));

  // Token mint address (from previous step)
  const mint = new PublicKey("YourTokenMintAddressHere");

  // Upload metadata JSON to Arweave
  const { uri } = await metaplex.nfts().uploadMetadata({
    name: "Platform Utility Token",
    symbol: "PUT",
    description: "Utility token for XYZ platform ecosystem, enabling in-app purchases, staking rewards, and governance participation.",
    image: "https://arweave.net/your-logo-hash",
    external_url: "https://platform.com",
    attributes: [
      { trait_type: "Token Type", value: "Utility" },
      { trait_type: "Blockchain", value: "Solana" },
      { trait_type: "Standard", value: "SPL Token" },
    ],
    properties: {
      category: "utility",
      files: [
        {
          uri: "https://arweave.net/your-logo-hash",
          type: "image/png"
        }
      ]
    }
  });

  console.log("Metadata URI:", uri);

  // Create on-chain metadata account
  const { nft } = await metaplex.nfts().create({
    uri: uri,
    name: "Platform Utility Token",
    symbol: "PUT",
    sellerFeeBasisPoints: 0,
    isMutable: true,
    tokenStandard: 0, // Fungible
    mint: mint,
    updateAuthority: walletKeypair,
  });

  console.log("Metadata created successfully!");
  console.log("Metadata account:", nft.metadataAddress.toBase58());

  return nft;
}

createTokenMetadata()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

### 3.4 Token Logo Upload (IPFS/Arweave)

#### Option 1: Arweave Upload (Recommended)

```typescript
import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";
import * as fs from "fs";

async function uploadLogoToArweave() {
  const connection = new Connection("https://api.devnet.solana.com");
  const wallet = Keypair.fromSecretKey(/* ... */);

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage());

  // Read logo file
  const imageBuffer = fs.readFileSync("./token-logo.png");

  // Upload to Arweave via Bundlr
  const imageUri = await metaplex.storage().upload(imageBuffer);

  console.log("Logo uploaded to:", imageUri);
  // Output: https://arweave.net/abc123...

  return imageUri;
}
```

#### Option 2: IPFS Upload

```bash
# Install IPFS CLI or use Pinata/NFT.Storage

# Upload file
ipfs add token-logo.png

# Output: QmHash...
# Access via: https://ipfs.io/ipfs/QmHash...

# For production, use pinning service:
# - Pinata: https://pinata.cloud
# - NFT.Storage: https://nft.storage
# - Web3.Storage: https://web3.storage
```

**Using NFT.Storage API:**

```typescript
import { NFTStorage, File } from "nft.storage";
import * as fs from "fs";

async function uploadToIPFS() {
  const client = new NFTStorage({ token: "YOUR_API_KEY" });

  const imageBuffer = fs.readFileSync("./token-logo.png");
  const imageFile = new File([imageBuffer], "token-logo.png", {
    type: "image/png"
  });

  const cid = await client.storeBlob(imageFile);
  const ipfsUrl = `https://nft.storage/ipfs/${cid}`;

  console.log("Logo uploaded to:", ipfsUrl);
  return ipfsUrl;
}
```

### 3.5 Integration Examples for Platform

#### Frontend Integration (React)

```typescript
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  getAssociatedTokenAddress,
  getAccount,
  transfer
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

function TokenIntegration() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const TOKEN_MINT = new PublicKey("YourTokenMintHere");

  // Get token balance
  async function getTokenBalance() {
    if (!publicKey) return 0;

    try {
      const tokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        publicKey
      );

      const account = await getAccount(connection, tokenAccount);
      return Number(account.amount) / Math.pow(10, 9); // Adjust for decimals
    } catch (error) {
      console.log("No token account found");
      return 0;
    }
  }

  // Transfer tokens
  async function transferTokens(recipient: string, amount: number) {
    if (!publicKey) throw new Error("Wallet not connected");

    const recipientPubkey = new PublicKey(recipient);

    const fromTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      publicKey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      recipientPubkey
    );

    const transaction = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        publicKey,
        amount * Math.pow(10, 9)
      )
    );

    const signature = await sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature);

    return signature;
  }

  return (
    <div>
      <WalletMultiButton />
      {/* Your UI components */}
    </div>
  );
}
```

#### Backend Integration (Node.js)

```typescript
import express from "express";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount
} from "@solana/spl-token";

const app = express();
const connection = new Connection("https://api.mainnet-beta.solana.com");
const TOKEN_MINT = new PublicKey("YourTokenMintHere");

// Endpoint to check user token balance
app.get("/api/balance/:wallet", async (req, res) => {
  try {
    const userWallet = new PublicKey(req.params.wallet);
    const tokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      userWallet
    );

    const account = await getAccount(connection, tokenAccount);
    const balance = Number(account.amount) / Math.pow(10, 9);

    res.json({ balance });
  } catch (error) {
    res.status(404).json({ balance: 0, error: "No account found" });
  }
});

// Endpoint to reward user with tokens
app.post("/api/reward", async (req, res) => {
  const { userWallet, amount, reason } = req.body;

  try {
    const platformWallet = Keypair.fromSecretKey(/* platform secret key */);
    const userPubkey = new PublicKey(userWallet);

    const fromAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      platformWallet.publicKey
    );

    const toAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      userPubkey
    );

    const transaction = new Transaction().add(
      createTransferInstruction(
        fromAccount,
        toAccount,
        platformWallet.publicKey,
        amount * Math.pow(10, 9)
      )
    );

    const signature = await connection.sendTransaction(
      transaction,
      [platformWallet]
    );

    await connection.confirmTransaction(signature);

    // Log reward in database
    // await db.rewards.create({ user: userWallet, amount, reason, signature });

    res.json({
      success: true,
      signature,
      message: `Rewarded ${amount} tokens for ${reason}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

---

## 4. TOKENOMICS SPECIFICATIONS

### 4.1 Total Supply Determination

#### Supply Models

**Fixed Supply (Bitcoin Model):**
```
Total Supply: 21,000,000 tokens (example)
- All tokens minted at genesis
- Mint authority revoked
- Deflationary through burn
- Scarcity increases over time
```

**Capped Supply (Ethereum Model):**
```
Max Supply: 1,000,000,000 tokens
- Minted as needed up to cap
- Programmatic issuance rules
- Predictable inflation rate
- Flexibility with limits
```

**Unlimited Supply (Stablecoin Model):**
```
Supply: Unlimited
- Mint as needed
- Demand-driven issuance
- Backed by reserves or algorithm
- Focus on utility, not scarcity
```

#### Calculation Framework

**Platform Utility Token Example:**

```
Total Supply: 1,000,000,000 tokens

Reasoning:
1. User base projection: 10M users in 5 years
2. Average holdings: 100 tokens per user
3. Required circulation: 1B tokens
4. Room for growth: Built into supply

Supply Allocation:
- Circulating: 400M (40%) - Immediate distribution
- Reserved: 600M (60%) - Future issuance

Decimal Places: 9 (allows micro-transactions)
- 1 token = 1,000,000,000 base units
- Enables sub-cent pricing
- Standard for Solana ecosystem
```

### 4.2 Distribution Allocation

#### Standard Distribution Model

```
Total Supply: 1,000,000,000 tokens (100%)

Allocation Breakdown:
├─ Team & Founders: 200M (20%)
│  ├─ Core team: 150M
│  ├─ Advisors: 30M
│  └─ Future hires: 20M
│
├─ Community & Ecosystem: 400M (40%)
│  ├─ User rewards: 200M
│  ├─ Airdrops: 50M
│  ├─ Liquidity mining: 100M
│  └─ Community grants: 50M
│
├─ Company Treasury: 250M (25%)
│  ├─ Operations: 100M
│  ├─ Marketing: 75M
│  ├─ Partnerships: 50M
│  └─ Emergency reserve: 25M
│
├─ Initial Sale: 100M (10%)
│  ├─ Seed round: 30M
│  ├─ Private sale: 40M
│  └─ Public sale: 30M
│
└─ Liquidity Pools: 50M (5%)
   ├─ DEX liquidity: 40M
   └─ CEX listings: 10M
```

#### Distribution Timeline

```
Year 1 (Launch Phase):
├─ Month 0 (TGE - Token Generation Event)
│  ├─ Public sale: 30M tokens (3%)
│  ├─ Initial liquidity: 40M tokens (4%)
│  └─ Early adopter airdrop: 10M tokens (1%)
│
├─ Months 1-12
│  ├─ User rewards: 50M tokens (5%)
│  ├─ Team vesting: 0 tokens (cliff period)
│  └─ Marketing campaigns: 25M tokens (2.5%)

Year 2 (Growth Phase):
├─ Team vesting begins: 50M tokens (5%)
├─ User rewards: 75M tokens (7.5%)
├─ Partnership incentives: 25M tokens (2.5%)
└─ Liquidity expansion: 10M tokens (1%)

Year 3 (Maturity Phase):
├─ Team vesting: 75M tokens (7.5%)
├─ User rewards: 50M tokens (5%)
├─ Ecosystem grants: 25M tokens (2.5%)
└─ Treasury utilization: 50M tokens (5%)

Year 4 (Sustainable Phase):
├─ Team final vesting: 75M tokens (7.5%)
├─ User rewards: 25M tokens (2.5%)
├─ Remaining allocations per governance
```

### 4.3 Vesting Schedule

#### Team Vesting (Standard)

```
Team Allocation: 200M tokens
Cliff: 12 months (no tokens released)
Vesting Period: 36 months (after cliff)
Total Duration: 48 months

Release Schedule:
- Month 0-12: 0 tokens (cliff)
- Month 13: 16.67M tokens (8.33% of allocation)
- Month 14-48: 5.09M tokens per month (linear)

Formula:
  tokens_unlocked = (total_allocation / vesting_months) * months_since_cliff

Example at Month 24:
  tokens_unlocked = (200M / 36) * 12 = 66.67M tokens
```

**Implementation (Smart Contract):**

```rust
#[account]
pub struct VestingSchedule {
    pub beneficiary: Pubkey,
    pub total_amount: u64,
    pub start_timestamp: i64,
    pub cliff_duration: i64,    // 31,536,000 seconds (1 year)
    pub vesting_duration: i64,  // 94,608,000 seconds (3 years)
    pub amount_withdrawn: u64,
}

pub fn withdraw_vested_tokens(ctx: Context<WithdrawVested>) -> Result<()> {
    let schedule = &mut ctx.accounts.vesting_schedule;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Check cliff has passed
    require!(
        current_time >= schedule.start_timestamp + schedule.cliff_duration,
        ErrorCode::CliffNotReached
    );

    // Calculate vested amount
    let time_since_cliff = current_time - (schedule.start_timestamp + schedule.cliff_duration);
    let vesting_ratio = std::cmp::min(
        time_since_cliff as u64,
        schedule.vesting_duration as u64
    ) * 10000 / schedule.vesting_duration as u64;

    let vested_amount = (schedule.total_amount * vesting_ratio) / 10000;
    let withdrawable = vested_amount - schedule.amount_withdrawn;

    require!(withdrawable > 0, ErrorCode::NoTokensToWithdraw);

    // Transfer tokens
    // ... token transfer logic ...

    schedule.amount_withdrawn += withdrawable;
    Ok(())
}
```

#### Advisor Vesting (Accelerated)

```
Advisor Allocation: 30M tokens
Cliff: 6 months
Vesting Period: 18 months
Total Duration: 24 months

More aggressive to incentivize early contribution
```

#### Community Rewards (No Vesting)

```
User Rewards: 200M tokens
Vesting: None (immediate)
Distribution: Activity-based

Earned through:
- Platform engagement
- Referrals
- Staking
- Governance participation
```

### 4.4 Burn Mechanism

#### Burn Model Types

**Type 1: Transaction Fee Burn**

```
Mechanism:
- X% of platform transaction fees burned
- Reduces supply with usage
- Deflationary pressure
- Aligns with platform growth

Example:
- Platform transaction: $10
- Token fee: 100 tokens
- Burn rate: 50%
- Tokens burned: 50 tokens
- Net fee: 50 tokens to treasury
```

**Type 2: Buyback and Burn**

```
Mechanism:
- Platform revenue used to buy tokens
- Purchased tokens burned
- Market-driven deflation
- Similar to stock buybacks

Example:
- Quarterly revenue: $1M
- 10% allocated to buyback: $100k
- Tokens purchased and burned
- Announced publicly for transparency
```

**Type 3: Activity-Based Burn**

```
Mechanism:
- Certain activities burn tokens
- Examples:
  * Premium content access
  * Exclusive features
  * Name registration
  * Profile customization

Example:
- Premium membership: 1000 tokens
- 100% burned (not transferred)
- Permanent supply reduction
```

**Type 4: Staking Rewards Burn**

```
Mechanism:
- Unstaking early incurs penalty
- Penalty tokens burned
- Encourages long-term holding
- Reduces selling pressure

Example:
- Staked: 10,000 tokens
- Early unstake: 10% penalty
- Penalty burned: 1,000 tokens
- User receives: 9,000 tokens
```

#### Burn Implementation

```typescript
import { burn, getAccount } from "@solana/spl-token";

async function burnPlatformFees(
  amount: number,
  feeAccount: PublicKey,
  authority: Keypair
) {
  // Calculate burn amount (50% of fees)
  const burnAmount = Math.floor(amount * 0.5);

  // Burn tokens
  const signature = await burn(
    connection,
    payer,
    feeAccount,
    mint,
    authority,
    burnAmount * Math.pow(10, 9)
  );

  // Log burn for transparency
  console.log(`Burned ${burnAmount} tokens`);
  console.log(`Transaction: ${signature}`);

  // Store in database for analytics
  await db.burns.create({
    amount: burnAmount,
    signature,
    timestamp: Date.now(),
    type: "transaction_fee"
  });

  return signature;
}
```

---

## 5. OPERATIONAL GUIDE

### 5.1 How to Mint Additional Tokens

#### Prerequisites

- Mint authority not revoked
- Sufficient SOL for transaction fees (~0.000005 SOL)
- Wallet with mint authority private key

#### CLI Method

```bash
# Check current supply
spl-token supply <TOKEN_MINT>

# Check mint authority
spl-token display <TOKEN_MINT>
# Look for "Mint authority: <WALLET_ADDRESS>"

# Mint tokens to specific account
spl-token mint <TOKEN_MINT> <AMOUNT> <RECIPIENT_TOKEN_ACCOUNT>

# Mint to associated token account
spl-token mint <TOKEN_MINT> <AMOUNT> --recipient-owner <WALLET_ADDRESS>

# Example: Mint 1 million tokens
spl-token mint 7Xc9KLq... 1000000 --recipient-owner HrG3k...

# Verify new supply
spl-token supply <TOKEN_MINT>
```

#### Programmatic Method

```typescript
import { mintTo, getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

async function mintTokens(
  recipientWallet: string,
  amount: number
): Promise<string> {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const mintAuthority = Keypair.fromSecretKey(/* load from secure storage */);
  const mint = new PublicKey("YourTokenMintAddress");

  // Get recipient's associated token account
  const recipientPubkey = new PublicKey(recipientWallet);
  const recipientTokenAccount = await getAssociatedTokenAddress(
    mint,
    recipientPubkey
  );

  // Mint tokens (adjust for decimals)
  const signature = await mintTo(
    connection,
    mintAuthority,
    mint,
    recipientTokenAccount,
    mintAuthority,
    amount * Math.pow(10, 9) // 9 decimals
  );

  console.log(`Minted ${amount} tokens to ${recipientWallet}`);
  console.log(`Transaction signature: ${signature}`);

  return signature;
}

// Usage
await mintTokens("UserWalletAddressHere", 1000);
```

#### Multi-Signature Minting

```bash
# For multi-sig wallet, requires multiple signatures

# 1. Create transaction
spl-token mint <TOKEN_MINT> <AMOUNT> <RECIPIENT> --multisig-signer <SIGNER1> --multisig-signer <SIGNER2>

# 2. Each required signer approves
# (Specific steps depend on multi-sig implementation)
```

#### Best Practices

```
1. Security:
   - Store mint authority keypair in hardware wallet or HSM
   - Use multi-sig for production environments
   - Implement approval workflows for large mints

2. Transparency:
   - Announce mints publicly
   - Explain reason for minting
   - Update tokenomics documentation

3. Record Keeping:
   - Log all mint transactions
   - Track cumulative supply
   - Document purpose of each mint

4. Monitoring:
   - Alert on unexpected mints
   - Regular authority checks
   - Supply cap enforcement (if applicable)
```

### 5.2 How to Burn Tokens

#### Purpose of Burning

- Reduce circulating supply (deflationary)
- Remove tokens from circulation permanently
- Implement fee burning mechanisms
- Correct minting errors

#### CLI Method

```bash
# Check your token balance
spl-token balance <TOKEN_MINT>

# Burn tokens from your account
spl-token burn <TOKEN_ACCOUNT> <AMOUNT>

# Example: Burn 500 tokens
spl-token burn TokenAccountAddress 500

# Burn with explicit owner
spl-token burn <TOKEN_ACCOUNT> <AMOUNT> --owner <OWNER_KEYPAIR_PATH>

# Verify new balance
spl-token balance <TOKEN_MINT>

# Check new total supply
spl-token supply <TOKEN_MINT>
```

#### Programmatic Method

```typescript
import { burn, getAssociatedTokenAddress } from "@solana/spl-token";

async function burnTokens(
  amount: number,
  ownerKeypair: Keypair
): Promise<string> {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const mint = new PublicKey("YourTokenMintAddress");

  // Get token account
  const tokenAccount = await getAssociatedTokenAddress(
    mint,
    ownerKeypair.publicKey
  );

  // Burn tokens
  const signature = await burn(
    connection,
    ownerKeypair,
    tokenAccount,
    mint,
    ownerKeypair,
    amount * Math.pow(10, 9)
  );

  console.log(`Burned ${amount} tokens`);
  console.log(`Transaction: ${signature}`);

  return signature;
}
```

#### Automated Fee Burning

```typescript
// Backend service that burns transaction fees

async function processTransactionWithBurn(
  userId: string,
  transactionFee: number
) {
  const burnPercentage = 0.5; // 50% of fees burned
  const burnAmount = Math.floor(transactionFee * burnPercentage);
  const treasuryAmount = transactionFee - burnAmount;

  // Transfer fees from user
  await transferTokens(userId, platformWallet, transactionFee);

  // Burn portion of fees
  await burnTokens(burnAmount, platformWallet);

  // Keep remainder in treasury
  console.log(`Fee processed: ${transactionFee} tokens`);
  console.log(`Burned: ${burnAmount} tokens`);
  console.log(`Treasury: ${treasuryAmount} tokens`);

  // Update analytics
  await db.burns.create({
    amount: burnAmount,
    source: "transaction_fee",
    userId,
    timestamp: Date.now()
  });
}
```

### 5.3 How to Freeze/Thaw Accounts

#### When to Use Freeze

- Compliance requirements (AML/CFT)
- Suspected fraudulent activity
- Court orders
- User-requested account freeze (lost device)
- Security incidents

#### Prerequisites

- Freeze authority not revoked
- Freeze authority keypair access
- Target token account address

#### CLI Method

```bash
# Check if freeze authority exists
spl-token display <TOKEN_MINT>
# Look for "Freeze authority: <WALLET_ADDRESS>"

# Freeze a token account
spl-token freeze <TOKEN_ACCOUNT> --owner <FREEZE_AUTHORITY_KEYPAIR>

# Verify account is frozen
spl-token account-info <TOKEN_ACCOUNT>
# Will show: "State: Frozen"

# Thaw (unfreeze) a token account
spl-token thaw <TOKEN_ACCOUNT> --owner <FREEZE_AUTHORITY_KEYPAIR>

# Verify account is thawed
spl-token account-info <TOKEN_ACCOUNT>
# Will show: "State: Initialized"
```

#### Programmatic Method

```typescript
import {
  freezeAccount,
  thawAccount,
  getAssociatedTokenAddress
} from "@solana/spl-token";

// Freeze account
async function freezeUserAccount(
  userWallet: string,
  reason: string
): Promise<string> {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const freezeAuthority = Keypair.fromSecretKey(/* load securely */);
  const mint = new PublicKey("YourTokenMintAddress");

  const userPubkey = new PublicKey(userWallet);
  const tokenAccount = await getAssociatedTokenAddress(mint, userPubkey);

  const signature = await freezeAccount(
    connection,
    freezeAuthority,
    tokenAccount,
    mint,
    freezeAuthority
  );

  // Log for compliance
  await db.freezes.create({
    account: tokenAccount.toBase58(),
    wallet: userWallet,
    reason,
    timestamp: Date.now(),
    signature
  });

  console.log(`Froze account ${tokenAccount.toBase58()}`);
  console.log(`Reason: ${reason}`);

  return signature;
}

// Thaw account
async function thawUserAccount(
  userWallet: string,
  reason: string
): Promise<string> {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const freezeAuthority = Keypair.fromSecretKey(/* load securely */);
  const mint = new PublicKey("YourTokenMintAddress");

  const userPubkey = new PublicKey(userWallet);
  const tokenAccount = await getAssociatedTokenAddress(mint, userPubkey);

  const signature = await thawAccount(
    connection,
    freezeAuthority,
    tokenAccount,
    mint,
    freezeAuthority
  );

  // Log for compliance
  await db.thaws.create({
    account: tokenAccount.toBase58(),
    wallet: userWallet,
    reason,
    timestamp: Date.now(),
    signature
  });

  console.log(`Thawed account ${tokenAccount.toBase58()}`);
  console.log(`Reason: ${reason}`);

  return signature;
}
```

#### Compliance Workflow

```typescript
// Example compliance system

interface FreezeRequest {
  wallet: string;
  reason: "fraud" | "compliance" | "court_order" | "user_request";
  requestedBy: string;
  approvals: string[];
}

async function processFreezeRequest(request: FreezeRequest) {
  // Multi-sig approval required
  const requiredApprovals = 2;

  if (request.approvals.length < requiredApprovals) {
    throw new Error("Insufficient approvals");
  }

  // Freeze account
  const signature = await freezeUserAccount(
    request.wallet,
    request.reason
  );

  // Notify user
  await sendNotification(request.wallet, {
    title: "Account Frozen",
    message: `Your account has been frozen. Reason: ${request.reason}`,
    action: "Contact support for assistance",
  });

  return signature;
}
```

#### Best Practices

```
1. Transparency:
   - Notify users before freezing (when possible)
   - Provide clear reasons
   - Outline process to unfreeze

2. Security:
   - Multi-sig for freeze authority
   - Audit log all freeze/thaw actions
   - Regular review of frozen accounts

3. Compliance:
   - Document legal basis for freezes
   - Maintain freeze/thaw records
   - Follow jurisdictional requirements

4. User Experience:
   - Fast response to legitimate unfreeze requests
   - Clear communication channels
   - Preventive measures to avoid false positives
```

### 5.4 How to Transfer Authorities

#### Authority Types

1. **Mint Authority:** Can mint new tokens
2. **Freeze Authority:** Can freeze/thaw accounts
3. **Update Authority:** Can update token metadata

#### Transfer Mint Authority

**CLI Method:**

```bash
# Check current mint authority
spl-token display <TOKEN_MINT>

# Transfer to new authority
spl-token authorize <TOKEN_MINT> mint <NEW_AUTHORITY_ADDRESS> --owner <CURRENT_AUTHORITY_KEYPAIR>

# Verify transfer
spl-token display <TOKEN_MINT>
```

**Programmatic Method:**

```typescript
import { setAuthority, AuthorityType } from "@solana/spl-token";

async function transferMintAuthority(
  newAuthority: PublicKey,
  currentAuthority: Keypair
): Promise<string> {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const mint = new PublicKey("YourTokenMintAddress");

  const signature = await setAuthority(
    connection,
    currentAuthority,
    mint,
    currentAuthority,
    AuthorityType.MintTokens,
    newAuthority
  );

  console.log(`Mint authority transferred to ${newAuthority.toBase58()}`);
  console.log(`Transaction: ${signature}`);

  return signature;
}
```

#### Transfer to Multi-Sig

```typescript
// Transfer authority to multi-sig wallet for enhanced security

import { Multisig } from "@solana/spl-token";

async function setupMultisigAuthority() {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const payer = Keypair.fromSecretKey(/* ... */);

  // Create multi-sig account
  const multisig = await Multisig.create(
    connection,
    payer,
    [
      signer1.publicKey,
      signer2.publicKey,
      signer3.publicKey
    ],
    2 // Require 2 of 3 signatures
  );

  console.log("Multi-sig created:", multisig.toBase58());

  // Transfer mint authority to multi-sig
  await transferMintAuthority(multisig, currentAuthority);

  return multisig;
}
```

#### Transfer Freeze Authority

```bash
# Transfer freeze authority
spl-token authorize <TOKEN_MINT> freeze <NEW_AUTHORITY_ADDRESS> --owner <CURRENT_AUTHORITY_KEYPAIR>
```

```typescript
// Programmatic freeze authority transfer
async function transferFreezeAuthority(
  newAuthority: PublicKey,
  currentAuthority: Keypair
): Promise<string> {
  const signature = await setAuthority(
    connection,
    currentAuthority,
    mint,
    currentAuthority,
    AuthorityType.FreezeAccount,
    newAuthority
  );

  return signature;
}
```

#### Update Metadata Authority

```typescript
import { Metaplex } from "@metaplex-foundation/js";

async function transferUpdateAuthority(
  newAuthority: PublicKey,
  currentAuthority: Keypair
) {
  const metaplex = Metaplex.make(connection).use(keypairIdentity(currentAuthority));
  const mint = new PublicKey("YourTokenMintAddress");

  // Find metadata account
  const nft = await metaplex.nfts().findByMint({ mintAddress: mint });

  // Update authority
  await metaplex.nfts().update({
    nftOrSft: nft,
    updateAuthority: currentAuthority,
    newUpdateAuthority: newAuthority,
  });

  console.log(`Update authority transferred to ${newAuthority.toBase58()}`);
}
```

### 5.5 How to Revoke Authorities

#### Why Revoke Authorities

- Lock total supply (fixed supply model)
- Remove freeze capability (enhance decentralization)
- Finalize token after setup
- Build user trust

#### Revoke Mint Authority (Fixed Supply)

**CLI Method:**

```bash
# Revoke mint authority permanently
spl-token authorize <TOKEN_MINT> mint --disable --owner <CURRENT_AUTHORITY>

# Verify revocation
spl-token display <TOKEN_MINT>
# Will show: "Mint authority: (disabled)"
```

**Programmatic Method:**

```typescript
async function revokeMintAuthority(
  currentAuthority: Keypair
): Promise<string> {
  const signature = await setAuthority(
    connection,
    currentAuthority,
    mint,
    currentAuthority,
    AuthorityType.MintTokens,
    null // null = revoke permanently
  );

  console.log("Mint authority permanently revoked");
  console.log(`Transaction: ${signature}`);

  // Announce to community
  await announceToommunity({
    title: "Token Supply Now Fixed",
    message: "Mint authority has been permanently revoked. No additional tokens can ever be created.",
    signature
  });

  return signature;
}
```

#### Revoke Freeze Authority

```bash
# Revoke freeze authority permanently
spl-token authorize <TOKEN_MINT> freeze --disable --owner <CURRENT_AUTHORITY>
```

```typescript
async function revokeFreezeAuthority(
  currentAuthority: Keypair
): Promise<string> {
  const signature = await setAuthority(
    connection,
    currentAuthority,
    mint,
    currentAuthority,
    AuthorityType.FreezeAccount,
    null
  );

  console.log("Freeze authority permanently revoked");
  return signature;
}
```

#### Revocation Checklist

```
Before Revoking Mint Authority:
[ ] All planned tokens minted
[ ] Distribution complete
[ ] No future minting requirements
[ ] Team consensus achieved
[ ] Community informed
[ ] Legal review completed
[ ] Tested on devnet first

Before Revoking Freeze Authority:
[ ] No compliance requirements for freezing
[ ] No regulatory obligations
[ ] Platform risk assessment complete
[ ] Alternative security measures in place
[ ] Community support confirmed
```

#### Gradual Decentralization Path

```
Phase 1: Launch (Centralized)
- Platform holds all authorities
- Fast iteration capability
- Quick response to issues

Phase 2: Multi-Sig (Distributed)
- Transfer to multi-sig wallet
- Require team consensus
- Reduced single-point risk

Phase 3: DAO Control (Decentralized)
- Transfer to governance program
- Community votes on actions
- Full decentralization

Phase 4: Revocation (Immutable)
- Revoke unnecessary authorities
- Lock in final state
- Maximum trust
```

---

## 6. DEPLOYMENT

### 6.1 Devnet Testing Procedure

#### Setup Devnet Environment

```bash
# Configure Solana CLI for devnet
solana config set --url https://api.devnet.solana.com

# Create or use devnet wallet
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# Set as default
solana config set --keypair ~/.config/solana/devnet-wallet.json

# Airdrop devnet SOL (free)
solana airdrop 2

# Verify balance
solana balance
```

#### Devnet Testing Checklist

```
Phase 1: Token Creation (Day 1)
[ ] Create token mint
[ ] Set decimals correctly (9)
[ ] Configure mint authority
[ ] Configure freeze authority (if needed)
[ ] Verify token created on Solscan Devnet

Phase 2: Initial Minting (Day 1)
[ ] Create associated token accounts
[ ] Mint initial test supply
[ ] Verify balances
[ ] Test token display in Phantom/Solflare

Phase 3: Metadata Setup (Day 2)
[ ] Upload logo to IPFS/Arweave (testnet)
[ ] Create metadata JSON
[ ] Add on-chain metadata via Metaplex
[ ] Verify metadata displays in wallets
[ ] Check on Solscan explorer

Phase 4: Operations Testing (Day 3-4)
[ ] Test minting additional tokens
[ ] Test burning tokens
[ ] Test transfers between accounts
[ ] Test freeze/thaw (if enabled)
[ ] Test authority transfers
[ ] Test authority revocation

Phase 5: Integration Testing (Day 5-7)
[ ] Frontend wallet connection
[ ] Token balance display
[ ] Transfer functionality
[ ] Error handling
[ ] Transaction confirmation
[ ] Multi-wallet support

Phase 6: Performance Testing (Day 8-9)
[ ] High-frequency transactions
[ ] Concurrent operations
[ ] Gas cost analysis
[ ] Transaction success rate
[ ] Latency measurements

Phase 7: Security Testing (Day 10-12)
[ ] Authority verification
[ ] Permission checks
[ ] Reentrancy testing (custom programs)
[ ] Overflow/underflow tests
[ ] Access control validation

Phase 8: User Acceptance (Day 13-14)
[ ] Internal team testing
[ ] Beta user testing
[ ] Feedback collection
[ ] Bug fixes
[ ] Documentation updates
```

#### Testing Script Example

```typescript
// devnet-test-suite.ts

import { Connection, Keypair } from "@solana/web3.js";
import {
  createMint,
  mintTo,
  burn,
  transfer,
  getAccount
} from "@solana/spl-token";

async function runDevnetTests() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const payer = Keypair.fromSecretKey(/* devnet wallet */);

  console.log("Starting devnet tests...\n");

  // Test 1: Create Token
  console.log("Test 1: Creating token...");
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    9
  );
  console.log("✓ Token created:", mint.toBase58());

  // Test 2: Mint Tokens
  console.log("\nTest 2: Minting tokens...");
  const tokenAccount = await createAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount,
    payer,
    1_000_000_000_000_000_000
  );

  const balance = await connection.getTokenAccountBalance(tokenAccount);
  console.log("✓ Minted:", balance.value.uiAmount, "tokens");

  // Test 3: Transfer
  console.log("\nTest 3: Transferring tokens...");
  const recipient = Keypair.generate();
  const recipientAccount = await createAssociatedTokenAccount(
    connection,
    payer,
    mint,
    recipient.publicKey
  );

  await transfer(
    connection,
    payer,
    tokenAccount,
    recipientAccount,
    payer,
    1000000000
  );

  const recipientBalance = await connection.getTokenAccountBalance(recipientAccount);
  console.log("✓ Transferred:", recipientBalance.value.uiAmount, "tokens");

  // Test 4: Burn
  console.log("\nTest 4: Burning tokens...");
  await burn(
    connection,
    payer,
    tokenAccount,
    mint,
    payer,
    500000000
  );

  const newBalance = await connection.getTokenAccountBalance(tokenAccount);
  console.log("✓ Burned 0.5 tokens. New balance:", newBalance.value.uiAmount);

  console.log("\n✓ All devnet tests passed!");
}

runDevnetTests().catch(console.error);
```

### 6.2 Mainnet Deployment Checklist

#### Pre-Deployment Preparation

```
Technical Readiness:
[ ] All devnet tests passed
[ ] Security audit completed (for custom programs)
[ ] Code review completed
[ ] Documentation finalized
[ ] Backup recovery plan documented

Infrastructure:
[ ] Mainnet wallet created with secure backup
[ ] Multi-sig setup (if used)
[ ] Sufficient SOL for deployment (~0.1 SOL)
[ ] RPC provider selected (QuickNode, Helius, etc.)
[ ] Monitoring tools configured

Metadata & Assets:
[ ] Final logo uploaded to Arweave
[ ] Metadata JSON finalized and hosted
[ ] Website live with token information
[ ] Social media profiles ready

Legal & Compliance:
[ ] Legal review completed
[ ] Terms of service finalized
[ ] Privacy policy ready
[ ] Geographic restrictions implemented (if any)
[ ] Tax implications documented

Community:
[ ] Whitepaper/litepaper published
[ ] Tokenomics publicly documented
[ ] Community channels active (Discord, Telegram)
[ ] Support team briefed
[ ] FAQ prepared
```

#### Deployment Steps

**Step 1: Final Security Check**

```bash
# Verify wallet
solana config get
# Ensure URL is mainnet: https://api.mainnet-beta.solana.com

# Check SOL balance
solana balance
# Ensure sufficient SOL (0.1+ recommended)

# Backup wallet (CRITICAL)
cp ~/.config/solana/id.json ~/secure-backup/mainnet-wallet-$(date +%Y%m%d).json
```

**Step 2: Create Token on Mainnet**

```bash
# Create token mint
spl-token create-token --decimals 9

# IMMEDIATELY SAVE TOKEN ADDRESS
export TOKEN_MINT=<COPY_TOKEN_ADDRESS_HERE>
echo $TOKEN_MINT > TOKEN_MINT_ADDRESS.txt

# Create token account
spl-token create-account $TOKEN_MINT
```

**Step 3: Mint Initial Supply**

```bash
# Mint initial supply (example: 1 billion tokens)
spl-token mint $TOKEN_MINT 1000000000

# Verify supply
spl-token supply $TOKEN_MINT

# Verify balance
spl-token balance $TOKEN_MINT
```

**Step 4: Add Metadata**

```bash
# Run metadata creation script
ts-node scripts/create-metadata.ts

# Verify on Solscan
# https://solscan.io/token/$TOKEN_MINT
```

**Step 5: Configure Authorities**

```bash
# Option A: Transfer to multi-sig
spl-token authorize $TOKEN_MINT mint <MULTISIG_ADDRESS>
spl-token authorize $TOKEN_MINT freeze <MULTISIG_ADDRESS>

# Option B: Revoke for fixed supply
spl-token authorize $TOKEN_MINT mint --disable
spl-token authorize $TOKEN_MINT freeze --disable
```

**Step 6: Initial Distribution**

```bash
# Distribute to team wallets (from distribution plan)
spl-token transfer $TOKEN_MINT 50000000 <TEAM_WALLET_1>
spl-token transfer $TOKEN_MINT 50000000 <TEAM_WALLET_2>

# Transfer to treasury
spl-token transfer $TOKEN_MINT 250000000 <TREASURY_WALLET>

# Transfer to liquidity pool
spl-token transfer $TOKEN_MINT 50000000 <LIQUIDITY_POOL>
```

**Step 7: Verification**

```bash
# Verify on Solscan
# https://solscan.io/token/$TOKEN_MINT

# Check metadata display
# Use Phantom/Solflare to view token

# Verify supply
spl-token supply $TOKEN_MINT

# Verify authorities
spl-token display $TOKEN_MINT
```

#### Post-Deployment Actions

```
Immediate (Within 1 hour):
[ ] Announce deployment on Twitter
[ ] Share token address in Discord/Telegram
[ ] Update website with token address
[ ] Enable token tracking on portfolio apps

Within 24 hours:
[ ] Submit to Solscan for verification
[ ] Submit to SolanaFM
[ ] Add to Jupiter token list
[ ] Notify CoinGecko (if applicable)
[ ] Notify CoinMarketCap (if applicable)

Within 1 week:
[ ] Set up liquidity pools
[ ] Begin distribution schedule
[ ] Monitor for issues
[ ] Collect community feedback
[ ] Address any concerns
```

### 6.3 Token Registry Listing

#### Solana Token List (Official)

**Repository:** https://github.com/solana-labs/token-list

**Submission Process:**

```bash
# 1. Fork the repository
git clone https://github.com/YOUR_USERNAME/token-list
cd token-list

# 2. Add your token
# Create file: assets/mainnet/YOUR_TOKEN_ADDRESS/logo.png
# Create file: assets/mainnet/YOUR_TOKEN_ADDRESS/info.json

# 3. info.json format
{
  "name": "Platform Utility Token",
  "symbol": "PUT",
  "address": "YourTokenMintAddress",
  "decimals": 9,
  "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/YourTokenMintAddress/logo.png",
  "tags": ["utility-token"],
  "extensions": {
    "website": "https://platform.com",
    "twitter": "https://twitter.com/platform",
    "discord": "https://discord.gg/platform"
  }
}

# 4. Create pull request
git add .
git commit -m "Add Platform Utility Token (PUT)"
git push origin main
# Create PR on GitHub

# 5. Wait for review (1-2 weeks typically)
```

#### Jupiter Token List

**Submission:** https://station.jup.ag/guides/general/get-your-token-onto-jup

```
Requirements:
- Active liquidity on Jupiter-supported DEX
- Minimum $250 liquidity
- Token metadata complete
- Logo meets requirements (500x500px, <100KB)

Steps:
1. Add liquidity on Orca or Raydium
2. Submit token via Jupiter form
3. Wait for automatic indexing (24-48 hours)
4. Verify listing on jup.ag
```

#### Coingecko Listing

**Submission:** https://www.coingecko.com/en/coins/new

```
Requirements:
- Listed on at least 1 exchange
- Active trading volume
- Project website
- Blockchain explorer page
- Social media presence

Process:
1. Fill application form
2. Provide token details
3. Submit verification documents
4. Wait for review (2-8 weeks)
5. Pay listing fee (if applicable)
```

#### CoinMarketCap Listing

**Submission:** https://coinmarketcap.com/request

```
Requirements:
- Listed on exchange with API
- Active trading for 3+ months
- Public token distribution
- Project website
- Social media

Process:
1. Create CMC account
2. Submit token information
3. Provide exchange details
4. Wait for review (4-12 weeks)
```

### 6.4 Explorer Verification

#### Solscan Verification

**URL:** https://solscan.io

```
Verification Steps:
1. Visit token page: https://solscan.io/token/YOUR_TOKEN_ADDRESS
2. Click "Update Token Info"
3. Fill verification form:
   - Token name
   - Symbol
   - Logo URL
   - Website
   - Social links
   - Description
4. Submit for review
5. Wait 1-3 business days
```

**Verification Badge Benefits:**
- Official checkmark on Solscan
- Enhanced visibility
- Reduced scam concerns
- Better user trust

#### SolanaFM Verification

**URL:** https://solana.fm

```
Process:
1. Navigate to token page
2. Click "Claim Token"
3. Verify ownership via wallet signature
4. Update token information
5. Submit logo and metadata
6. Automatic verification within 24 hours
```

#### Verification Checklist

```
Required Information:
[ ] Official token name
[ ] Token symbol
[ ] Token mint address
[ ] Logo (500x500px, PNG/SVG)
[ ] Project website URL
[ ] Twitter profile
[ ] Discord invite
[ ] Telegram group
[ ] Token description
[ ] GitHub repository (if open source)
[ ] Contract verification (if custom program)

Optional But Recommended:
[ ] Medium blog
[ ] Whitepaper link
[ ] Token utility explanation
[ ] Team information
[ ] Roadmap
[ ] Audit report
```

---

## 7. SECURITY CONSIDERATIONS

### 7.1 Authority Management

**Best Practices:**

```
1. Multi-Signature Wallets:
   - Use Squads Protocol or Solana multi-sig
   - Require 2-of-3 or 3-of-5 signatures
   - Distribute signers geographically

2. Hardware Wallet Storage:
   - Store authority keys on Ledger/Trezor
   - Never use hot wallets for authorities
   - Backup in secure, offline location

3. Access Control:
   - Limit authority holders to trusted team
   - Regular authority audits
   - Immediate revocation if compromised

4. Gradual Decentralization:
   - Start with platform control
   - Move to multi-sig
   - Eventually DAO governance
   - Final authority revocation
```

### 7.2 Smart Contract Security (Custom Programs)

**Audit Requirements:**

```
Recommended Auditors:
- OtterSec (https://osec.io)
- Neodyme (https://neodyme.io)
- Halborn (https://halborn.com)
- Kudelski Security

Audit Scope:
- Access control mechanisms
- Arithmetic overflow/underflow
- Reentrancy vulnerabilities
- Authority validation
- Account validation
- CPI (Cross-Program Invocation) safety

Cost: $3,000 - $50,000 depending on complexity
```

**Security Checklist:**

```
[ ] All accounts validated
[ ] Owner checks on sensitive functions
[ ] No unchecked arithmetic
[ ] Signer validation
[ ] PDA derivation correct
[ ] No unbounded loops
[ ] Emergency pause mechanism
[ ] Upgrade mechanism (if needed)
[ ] Test coverage >80%
[ ] Fuzz testing completed
```

### 7.3 Operational Security

**Key Management:**

```
DO:
✓ Use hardware wallets
✓ Maintain offline backups
✓ Use multi-sig for production
✓ Regular security audits
✓ Incident response plan

DON'T:
✗ Store keys in plain text
✗ Share keys via email/Slack
✗ Use same key for test & production
✗ Store keys in code repositories
✗ Use web wallets for authorities
```

**Monitoring:**

```
Setup Alerts For:
- Unexpected minting events
- Large token transfers
- Authority changes
- Failed transactions
- Abnormal activity patterns

Tools:
- OtterSec monitoring
- Forta network alerts
- Custom monitoring scripts
- Real-time notifications
```

---

## 8. SUPPORT & MAINTENANCE

### 8.1 Ongoing Maintenance

**Monthly Tasks:**

```
Security:
- Review access logs
- Audit authority holders
- Update security procedures
- Test backup recovery

Operations:
- Monitor token supply
- Review distribution status
- Process burn transactions
- Update documentation

Community:
- Address support tickets
- Update FAQ
- Communicate changes
- Gather feedback
```

### 8.2 Upgrade Path

**Token Evolution:**

```
Phase 1: Launch
- Standard SPL token
- Basic operations

Phase 2: Enhanced Metadata
- Rich metadata
- Updated branding
- Social links

Phase 3: Advanced Features
- Staking contract
- Governance module
- Reward distribution

Phase 4: Migration (if needed)
- Token-2022 migration
- Feature additions
- User migration process
```

---

## 9. COST SUMMARY

### Development Costs

```
Option A: Standard SPL Token
├─ Token creation: $500
├─ Metadata setup: $300
├─ Documentation: $500
├─ Testing & deployment: $200
└─ Total: $1,500 - $2,000

Option B: Custom Anchor Program
├─ Smart contract development: $5,000 - $8,000
├─ Security audit: $3,000 - $50,000
├─ Testing & QA: $2,000 - $3,000
├─ Metadata & deployment: $500 - $1,000
├─ Documentation: $1,000 - $2,000
└─ Total: $11,500 - $64,000
```

### Blockchain Costs

```
One-Time:
- Create token: ~0.01 SOL ($2)
- Add metadata: ~0.01 SOL ($2)
- Initial distribution: ~0.001 SOL per transaction
Total: ~$5 - $10

Ongoing:
- Transaction fees: ~0.000005 SOL per tx
- Very minimal ongoing costs
```

### Third-Party Services

```
Logo Hosting:
- Arweave: ~$0.01 per KB (one-time)
- IPFS pinning: $5 - $20/month

Monitoring:
- OtterSec: Quote based
- Custom monitoring: Development time

Audits:
- Smart contract: $3,000 - $50,000
- Ongoing security: $5,000 - $20,000/year
```

---

## 10. TIMELINE

### Standard SPL Token (Recommended)

```
Week 1:
- Day 1-2: Requirements & planning
- Day 3-4: Devnet testing
- Day 5: Metadata preparation

Week 2:
- Day 1: Mainnet deployment
- Day 2-3: Verification & listings
- Day 4-5: Documentation & handoff

Total: 2 weeks
```

### Custom Anchor Program

```
Week 1: Planning & Design
Week 2-3: Development
Week 4: Testing & Security
Week 5: Audit & Fixes
Week 6: Deployment & Integration

Total: 6-8 weeks
```

---

## APPENDIX

### Glossary

```
SPL Token: Solana Program Library token standard
Anchor: Framework for Solana smart contracts
Metaplex: Metadata standard for Solana tokens
Arweave: Permanent storage network
IPFS: InterPlanetary File System
DEX: Decentralized Exchange
DAO: Decentralized Autonomous Organization
Multi-sig: Multi-signature wallet requiring multiple approvals
```

### Resources

```
Official Documentation:
- Solana Docs: https://docs.solana.com
- SPL Token: https://spl.solana.com/token
- Anchor: https://www.anchor-lang.com
- Metaplex: https://docs.metaplex.com

Tools:
- Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools
- Anchor CLI: https://www.anchor-lang.com/docs/installation
- Phantom Wallet: https://phantom.app
- Solscan Explorer: https://solscan.io

Community:
- Solana Discord: https://discord.com/invite/solana
- Anchor Discord: https://discord.gg/anchor
- Stack Exchange: https://solana.stackexchange.com
```

### Contact & Support

```
For implementation support:
- Review this requirements document
- Consult Solana documentation
- Engage experienced Solana developers
- Consider professional audit services

For deployment assistance:
- Use Solana CLI documentation
- Test thoroughly on devnet
- Follow mainnet deployment checklist
- Monitor post-deployment
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Comprehensive Requirements Specification
