import { Cluster, clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  initialMintAmount: number;
  description: string;
  logoUrl: string;
  website: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
}

export interface NetworkConfig {
  cluster: Cluster;
  rpcUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
}

export interface AuthorityConfig {
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  useMultisig: boolean;
  multisigAddress?: string;
  multisigThreshold?: number;
  multisigSigners?: string[];
}

class Config {
  // Network Configuration
  public readonly network: NetworkConfig;

  // Token Configuration
  public readonly token: TokenConfig;

  // Authority Configuration
  public readonly authority: AuthorityConfig;

  // Storage Configuration
  public readonly arweaveWallet?: string;
  public readonly ipfsGateway: string;
  public readonly nftStorageApiKey?: string;

  // Monitoring
  public readonly enableMonitoring: boolean;
  public readonly alertWebhookUrl?: string;

  // Admin
  public readonly adminPort: number;
  public readonly adminAuthSecret?: string;

  constructor() {
    const cluster = (process.env.SOLANA_NETWORK as Cluster) || 'devnet';

    this.network = {
      cluster,
      rpcUrl: this.getRpcUrl(cluster),
      commitment: 'confirmed',
    };

    this.token = {
      name: process.env.TOKEN_NAME || 'Platform Utility Token',
      symbol: process.env.TOKEN_SYMBOL || 'PUT',
      decimals: parseInt(process.env.TOKEN_DECIMALS || '9'),
      totalSupply: parseInt(process.env.TOTAL_SUPPLY || '1000000000'),
      initialMintAmount: parseInt(process.env.INITIAL_MINT_AMOUNT || '400000000'),
      description: process.env.TOKEN_DESCRIPTION || '',
      logoUrl: process.env.TOKEN_LOGO_URL || '',
      website: process.env.TOKEN_WEBSITE || '',
      twitter: process.env.TOKEN_TWITTER,
      discord: process.env.TOKEN_DISCORD,
      telegram: process.env.TOKEN_TELEGRAM,
    };

    this.authority = {
      mintAuthorityEnabled: process.env.MINT_AUTHORITY_ENABLED === 'true',
      freezeAuthorityEnabled: process.env.FREEZE_AUTHORITY_ENABLED === 'true',
      useMultisig: process.env.USE_MULTISIG === 'true',
      multisigAddress: process.env.MULTISIG_ADDRESS,
      multisigThreshold: parseInt(process.env.MULTISIG_THRESHOLD || '2'),
      multisigSigners: process.env.MULTISIG_SIGNERS?.split(','),
    };

    this.arweaveWallet = process.env.ARWEAVE_WALLET;
    this.ipfsGateway = process.env.IPFS_GATEWAY || 'https://ipfs.io';
    this.nftStorageApiKey = process.env.NFT_STORAGE_API_KEY;

    this.enableMonitoring = process.env.ENABLE_MONITORING === 'true';
    this.alertWebhookUrl = process.env.ALERT_WEBHOOK_URL;

    this.adminPort = parseInt(process.env.ADMIN_PORT || '3000');
    this.adminAuthSecret = process.env.ADMIN_AUTH_SECRET;
  }

  private getRpcUrl(cluster: Cluster): string {
    if (cluster === 'devnet') {
      return process.env.DEVNET_RPC_URL || clusterApiUrl('devnet');
    } else if (cluster === 'mainnet-beta') {
      return process.env.MAINNET_RPC_URL || clusterApiUrl('mainnet-beta');
    }
    return clusterApiUrl(cluster);
  }

  public getExplorerUrl(signature: string): string {
    const cluster = this.network.cluster === 'mainnet-beta' ? '' : `?cluster=${this.network.cluster}`;
    return `https://solscan.io/tx/${signature}${cluster}`;
  }

  public getTokenExplorerUrl(mintAddress: string): string {
    const cluster = this.network.cluster === 'mainnet-beta' ? '' : `?cluster=${this.network.cluster}`;
    return `https://solscan.io/token/${mintAddress}${cluster}`;
  }

  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.token.name) errors.push('TOKEN_NAME is required');
    if (!this.token.symbol) errors.push('TOKEN_SYMBOL is required');
    if (this.token.decimals < 0 || this.token.decimals > 9) {
      errors.push('TOKEN_DECIMALS must be between 0 and 9');
    }
    if (this.token.totalSupply <= 0) {
      errors.push('TOTAL_SUPPLY must be greater than 0');
    }
    if (this.token.initialMintAmount > this.token.totalSupply) {
      errors.push('INITIAL_MINT_AMOUNT cannot exceed TOTAL_SUPPLY');
    }

    if (this.authority.useMultisig) {
      if (!this.authority.multisigAddress) {
        errors.push('MULTISIG_ADDRESS is required when USE_MULTISIG is true');
      }
      if (!this.authority.multisigSigners || this.authority.multisigSigners.length < 2) {
        errors.push('At least 2 MULTISIG_SIGNERS are required');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const config = new Config();
