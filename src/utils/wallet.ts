import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';

export class WalletManager {
  /**
   * Load keypair from base58 private key string
   */
  static loadFromPrivateKey(privateKey: string): Keypair {
    try {
      const decoded = bs58.decode(privateKey);
      return Keypair.fromSecretKey(decoded);
    } catch (error) {
      throw new Error(`Failed to load keypair from private key: ${error}`);
    }
  }

  /**
   * Load keypair from JSON file (Solana CLI format)
   */
  static loadFromFile(filePath: string): Keypair {
    try {
      const resolvedPath = path.resolve(filePath);

      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Keypair file not found: ${resolvedPath}`);
      }

      const secretKeyString = fs.readFileSync(resolvedPath, 'utf8');
      const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
      return Keypair.fromSecretKey(secretKey);
    } catch (error) {
      throw new Error(`Failed to load keypair from file: ${error}`);
    }
  }

  /**
   * Load keypair from environment variable
   */
  static loadFromEnv(envVar: string = 'DEPLOYER_PRIVATE_KEY'): Keypair {
    const privateKey = process.env[envVar];

    if (!privateKey) {
      throw new Error(`Environment variable ${envVar} is not set`);
    }

    return this.loadFromPrivateKey(privateKey);
  }

  /**
   * Generate new keypair
   */
  static generate(): Keypair {
    return Keypair.generate();
  }

  /**
   * Save keypair to file (Solana CLI format)
   */
  static saveToFile(keypair: Keypair, filePath: string): void {
    try {
      const resolvedPath = path.resolve(filePath);
      const dir = path.dirname(resolvedPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const secretKeyArray = Array.from(keypair.secretKey);
      fs.writeFileSync(
        resolvedPath,
        JSON.stringify(secretKeyArray),
        { mode: 0o600 } // Read/write for owner only
      );
    } catch (error) {
      throw new Error(`Failed to save keypair to file: ${error}`);
    }
  }

  /**
   * Get base58 encoded private key
   */
  static getBase58PrivateKey(keypair: Keypair): string {
    return bs58.encode(keypair.secretKey);
  }

  /**
   * Validate public key string
   */
  static isValidPublicKey(publicKey: string): boolean {
    try {
      new PublicKey(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create backup of keypair
   */
  static createBackup(keypair: Keypair, name: string = 'backup'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(__dirname, '../../backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(backupDir, `${name}-${timestamp}.json`);
    this.saveToFile(keypair, backupPath);

    return backupPath;
  }
}

/**
 * Secure wallet loader that tries multiple sources
 */
export async function loadWallet(): Promise<Keypair> {
  // Try environment variable first
  try {
    return WalletManager.loadFromEnv();
  } catch {
    // Silent fail, try next method
  }

  // Try default Solana CLI path
  try {
    const defaultPath = path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.config',
      'solana',
      'id.json'
    );
    return WalletManager.loadFromFile(defaultPath);
  } catch {
    // Silent fail
  }

  throw new Error(
    'No wallet found. Please set DEPLOYER_PRIVATE_KEY environment variable ' +
    'or create a wallet at ~/.config/solana/id.json'
  );
}
