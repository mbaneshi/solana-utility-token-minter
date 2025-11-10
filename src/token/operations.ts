import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  burn,
  transfer,
  setAuthority,
  AuthorityType,
  getMint,
  getAccount,
  freezeAccount,
  thawAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { logger } from '../utils/logger';

export interface TokenInfo {
  mintAddress: PublicKey;
  decimals: number;
  supply: bigint;
  mintAuthority: PublicKey | null;
  freezeAuthority: PublicKey | null;
}

export interface AccountInfo {
  address: PublicKey;
  mint: PublicKey;
  owner: PublicKey;
  amount: bigint;
  delegate: PublicKey | null;
  state: 'initialized' | 'frozen';
  isNative: boolean;
}

export class TokenOperations {
  constructor(
    private connection: Connection,
    private payer: Keypair
  ) {}

  /**
   * Create a new SPL Token
   */
  async createToken(
    decimals: number,
    mintAuthority?: Keypair,
    freezeAuthority?: Keypair | null
  ): Promise<PublicKey> {
    try {
      logger.info('Creating new SPL token...');

      const mint = await createMint(
        this.connection,
        this.payer,
        mintAuthority?.publicKey || this.payer.publicKey,
        freezeAuthority?.publicKey || null,
        decimals
      );

      logger.success(`Token created: ${mint.toBase58()}`);
      return mint;
    } catch (error) {
      logger.error('Failed to create token:', error);
      throw error;
    }
  }

  /**
   * Get or create associated token account
   */
  async getOrCreateTokenAccount(
    mint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> {
    try {
      const account = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.payer,
        mint,
        owner
      );

      return account.address;
    } catch (error) {
      logger.error('Failed to get/create token account:', error);
      throw error;
    }
  }

  /**
   * Mint tokens to an account
   */
  async mintTokens(
    mint: PublicKey,
    destination: PublicKey,
    amount: number,
    decimals: number,
    mintAuthority?: Keypair
  ): Promise<string> {
    try {
      const authority = mintAuthority || this.payer;
      const amountWithDecimals = BigInt(amount) * BigInt(10 ** decimals);

      logger.info(`Minting ${amount} tokens...`);

      const signature = await mintTo(
        this.connection,
        this.payer,
        mint,
        destination,
        authority,
        amountWithDecimals
      );

      logger.success(`Minted ${amount} tokens. Signature: ${signature}`);
      return signature;
    } catch (error) {
      logger.error('Failed to mint tokens:', error);
      throw error;
    }
  }

  /**
   * Burn tokens from an account
   */
  async burnTokens(
    mint: PublicKey,
    account: PublicKey,
    amount: number,
    decimals: number,
    owner?: Keypair
  ): Promise<string> {
    try {
      const authority = owner || this.payer;
      const amountWithDecimals = BigInt(amount) * BigInt(10 ** decimals);

      logger.info(`Burning ${amount} tokens...`);

      const signature = await burn(
        this.connection,
        this.payer,
        account,
        mint,
        authority,
        amountWithDecimals
      );

      logger.success(`Burned ${amount} tokens. Signature: ${signature}`);
      return signature;
    } catch (error) {
      logger.error('Failed to burn tokens:', error);
      throw error;
    }
  }

  /**
   * Transfer tokens between accounts
   */
  async transferTokens(
    mint: PublicKey,
    from: PublicKey,
    to: PublicKey,
    amount: number,
    decimals: number,
    owner?: Keypair
  ): Promise<string> {
    try {
      const authority = owner || this.payer;
      const amountWithDecimals = BigInt(amount) * BigInt(10 ** decimals);

      logger.info(`Transferring ${amount} tokens...`);

      const signature = await transfer(
        this.connection,
        this.payer,
        from,
        to,
        authority,
        amountWithDecimals
      );

      logger.success(`Transferred ${amount} tokens. Signature: ${signature}`);
      return signature;
    } catch (error) {
      logger.error('Failed to transfer tokens:', error);
      throw error;
    }
  }

  /**
   * Set or revoke authority
   */
  async setAuthority(
    mint: PublicKey,
    authorityType: AuthorityType,
    currentAuthority: Keypair,
    newAuthority: PublicKey | null
  ): Promise<string> {
    try {
      const action = newAuthority ? 'Transferring' : 'Revoking';
      logger.info(`${action} ${AuthorityType[authorityType]} authority...`);

      const signature = await setAuthority(
        this.connection,
        this.payer,
        mint,
        currentAuthority,
        authorityType,
        newAuthority
      );

      const result = newAuthority ? `transferred to ${newAuthority.toBase58()}` : 'revoked';
      logger.success(`Authority ${result}. Signature: ${signature}`);
      return signature;
    } catch (error) {
      logger.error('Failed to set authority:', error);
      throw error;
    }
  }

  /**
   * Freeze an account
   */
  async freezeAccount(
    mint: PublicKey,
    account: PublicKey,
    freezeAuthority?: Keypair
  ): Promise<string> {
    try {
      const authority = freezeAuthority || this.payer;

      logger.info(`Freezing account ${account.toBase58()}...`);

      const signature = await freezeAccount(
        this.connection,
        this.payer,
        account,
        mint,
        authority
      );

      logger.success(`Account frozen. Signature: ${signature}`);
      return signature;
    } catch (error) {
      logger.error('Failed to freeze account:', error);
      throw error;
    }
  }

  /**
   * Thaw a frozen account
   */
  async thawAccount(
    mint: PublicKey,
    account: PublicKey,
    freezeAuthority?: Keypair
  ): Promise<string> {
    try {
      const authority = freezeAuthority || this.payer;

      logger.info(`Thawing account ${account.toBase58()}...`);

      const signature = await thawAccount(
        this.connection,
        this.payer,
        account,
        mint,
        authority
      );

      logger.success(`Account thawed. Signature: ${signature}`);
      return signature;
    } catch (error) {
      logger.error('Failed to thaw account:', error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(mint: PublicKey): Promise<TokenInfo> {
    try {
      const mintInfo = await getMint(this.connection, mint);

      return {
        mintAddress: mint,
        decimals: mintInfo.decimals,
        supply: mintInfo.supply,
        mintAuthority: mintInfo.mintAuthority,
        freezeAuthority: mintInfo.freezeAuthority,
      };
    } catch (error) {
      logger.error('Failed to get token info:', error);
      throw error;
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(account: PublicKey): Promise<AccountInfo> {
    try {
      const accountInfo = await getAccount(this.connection, account);

      return {
        address: account,
        mint: accountInfo.mint,
        owner: accountInfo.owner,
        amount: accountInfo.amount,
        delegate: accountInfo.delegate,
        state: accountInfo.isFrozen ? 'frozen' : 'initialized',
        isNative: accountInfo.isNative,
      };
    } catch (error) {
      logger.error('Failed to get account info:', error);
      throw error;
    }
  }

  /**
   * Get token balance
   */
  async getBalance(account: PublicKey, decimals: number): Promise<number> {
    try {
      const accountInfo = await this.getAccountInfo(account);
      return Number(accountInfo.amount) / 10 ** decimals;
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get total supply
   */
  async getTotalSupply(mint: PublicKey, decimals: number): Promise<number> {
    try {
      const tokenInfo = await this.getTokenInfo(mint);
      return Number(tokenInfo.supply) / 10 ** decimals;
    } catch (error) {
      logger.error('Failed to get total supply:', error);
      throw error;
    }
  }
}
