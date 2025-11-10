import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TokenOperations } from '../../token/operations';
import * as splToken from '@solana/spl-token';

jest.mock('@solana/spl-token');
jest.mock('../../utils/logger');

describe('TokenOperations - Mint', () => {
  let connection: Connection;
  let payer: Keypair;
  let tokenOps: TokenOperations;
  let mockMint: PublicKey;

  beforeEach(() => {
    connection = {} as Connection;
    payer = Keypair.generate();
    tokenOps = new TokenOperations(connection, payer);
    mockMint = Keypair.generate().publicKey;
    jest.clearAllMocks();
  });

  describe('createToken', () => {
    it('should create a new token with default authorities', async () => {
      const decimals = 9;
      const expectedMint = Keypair.generate().publicKey;

      (splToken.createMint as jest.Mock).mockResolvedValue(expectedMint);

      const result = await tokenOps.createToken(decimals);

      expect(result).toBe(expectedMint);
      expect(splToken.createMint).toHaveBeenCalledWith(
        connection,
        payer,
        payer.publicKey,
        null,
        decimals
      );
    });

    it('should create a token with custom mint authority', async () => {
      const decimals = 9;
      const mintAuthority = Keypair.generate();
      const expectedMint = Keypair.generate().publicKey;

      (splToken.createMint as jest.Mock).mockResolvedValue(expectedMint);

      const result = await tokenOps.createToken(decimals, mintAuthority);

      expect(result).toBe(expectedMint);
      expect(splToken.createMint).toHaveBeenCalledWith(
        connection,
        payer,
        mintAuthority.publicKey,
        null,
        decimals
      );
    });

    it('should create a token with freeze authority', async () => {
      const decimals = 9;
      const freezeAuthority = Keypair.generate();
      const expectedMint = Keypair.generate().publicKey;

      (splToken.createMint as jest.Mock).mockResolvedValue(expectedMint);

      const result = await tokenOps.createToken(decimals, undefined, freezeAuthority);

      expect(result).toBe(expectedMint);
      expect(splToken.createMint).toHaveBeenCalledWith(
        connection,
        payer,
        payer.publicKey,
        freezeAuthority.publicKey,
        decimals
      );
    });

    it('should handle errors during token creation', async () => {
      const decimals = 9;
      const error = new Error('Network error');

      (splToken.createMint as jest.Mock).mockRejectedValue(error);

      await expect(tokenOps.createToken(decimals)).rejects.toThrow('Network error');
    });
  });

  describe('mintTokens', () => {
    it('should mint tokens successfully', async () => {
      const amount = 1000;
      const decimals = 9;
      const destination = Keypair.generate().publicKey;
      const signature = 'mock-signature';

      (splToken.mintTo as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.mintTokens(mockMint, destination, amount, decimals);

      expect(result).toBe(signature);
      expect(splToken.mintTo).toHaveBeenCalledWith(
        connection,
        payer,
        mockMint,
        destination,
        payer,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });

    it('should mint tokens with custom authority', async () => {
      const amount = 1000;
      const decimals = 9;
      const destination = Keypair.generate().publicKey;
      const mintAuthority = Keypair.generate();
      const signature = 'mock-signature';

      (splToken.mintTo as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.mintTokens(
        mockMint,
        destination,
        amount,
        decimals,
        mintAuthority
      );

      expect(result).toBe(signature);
      expect(splToken.mintTo).toHaveBeenCalledWith(
        connection,
        payer,
        mockMint,
        destination,
        mintAuthority,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });

    it('should handle large amounts correctly', async () => {
      const amount = 1000000000;
      const decimals = 9;
      const destination = Keypair.generate().publicKey;
      const signature = 'mock-signature';

      (splToken.mintTo as jest.Mock).mockResolvedValue(signature);

      await tokenOps.mintTokens(mockMint, destination, amount, decimals);

      expect(splToken.mintTo).toHaveBeenCalledWith(
        connection,
        payer,
        mockMint,
        destination,
        payer,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });

    it('should handle errors during minting', async () => {
      const amount = 1000;
      const decimals = 9;
      const destination = Keypair.generate().publicKey;
      const error = new Error('Mint failed');

      (splToken.mintTo as jest.Mock).mockRejectedValue(error);

      await expect(
        tokenOps.mintTokens(mockMint, destination, amount, decimals)
      ).rejects.toThrow('Mint failed');
    });
  });

  describe('getOrCreateTokenAccount', () => {
    it('should get or create associated token account', async () => {
      const owner = Keypair.generate().publicKey;
      const expectedAccount = {
        address: Keypair.generate().publicKey,
      };

      (splToken.getOrCreateAssociatedTokenAccount as jest.Mock).mockResolvedValue(
        expectedAccount
      );

      const result = await tokenOps.getOrCreateTokenAccount(mockMint, owner);

      expect(result).toBe(expectedAccount.address);
      expect(splToken.getOrCreateAssociatedTokenAccount).toHaveBeenCalledWith(
        connection,
        payer,
        mockMint,
        owner
      );
    });

    it('should handle errors when creating token account', async () => {
      const owner = Keypair.generate().publicKey;
      const error = new Error('Account creation failed');

      (splToken.getOrCreateAssociatedTokenAccount as jest.Mock).mockRejectedValue(error);

      await expect(tokenOps.getOrCreateTokenAccount(mockMint, owner)).rejects.toThrow(
        'Account creation failed'
      );
    });
  });
});
