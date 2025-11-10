import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TokenOperations } from '../../token/operations';
import * as splToken from '@solana/spl-token';

jest.mock('@solana/spl-token');
jest.mock('../../utils/logger');

describe('TokenOperations - Burn', () => {
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

  describe('burnTokens', () => {
    it('should burn tokens successfully', async () => {
      const amount = 100;
      const decimals = 9;
      const account = Keypair.generate().publicKey;
      const signature = 'mock-burn-signature';

      (splToken.burn as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.burnTokens(mockMint, account, amount, decimals);

      expect(result).toBe(signature);
      expect(splToken.burn).toHaveBeenCalledWith(
        connection,
        payer,
        account,
        mockMint,
        payer,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });

    it('should burn tokens with custom owner', async () => {
      const amount = 100;
      const decimals = 9;
      const account = Keypair.generate().publicKey;
      const owner = Keypair.generate();
      const signature = 'mock-burn-signature';

      (splToken.burn as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.burnTokens(mockMint, account, amount, decimals, owner);

      expect(result).toBe(signature);
      expect(splToken.burn).toHaveBeenCalledWith(
        connection,
        payer,
        account,
        mockMint,
        owner,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });

    it('should handle whole number amounts correctly', async () => {
      const amount = 123;
      const decimals = 6;
      const account = Keypair.generate().publicKey;
      const signature = 'mock-burn-signature';

      (splToken.burn as jest.Mock).mockResolvedValue(signature);

      await tokenOps.burnTokens(mockMint, account, amount, decimals);

      expect(splToken.burn).toHaveBeenCalledWith(
        connection,
        payer,
        account,
        mockMint,
        payer,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });

    it('should handle errors during burning', async () => {
      const amount = 100;
      const decimals = 9;
      const account = Keypair.generate().publicKey;
      const error = new Error('Burn failed');

      (splToken.burn as jest.Mock).mockRejectedValue(error);

      await expect(
        tokenOps.burnTokens(mockMint, account, amount, decimals)
      ).rejects.toThrow('Burn failed');
    });

    it('should handle zero amount', async () => {
      const amount = 0;
      const decimals = 9;
      const account = Keypair.generate().publicKey;
      const signature = 'mock-burn-signature';

      (splToken.burn as jest.Mock).mockResolvedValue(signature);

      await tokenOps.burnTokens(mockMint, account, amount, decimals);

      expect(splToken.burn).toHaveBeenCalledWith(
        connection,
        payer,
        account,
        mockMint,
        payer,
        BigInt(0)
      );
    });

    it('should handle large burn amounts', async () => {
      const amount = 1000000000;
      const decimals = 9;
      const account = Keypair.generate().publicKey;
      const signature = 'mock-burn-signature';

      (splToken.burn as jest.Mock).mockResolvedValue(signature);

      await tokenOps.burnTokens(mockMint, account, amount, decimals);

      expect(splToken.burn).toHaveBeenCalledWith(
        connection,
        payer,
        account,
        mockMint,
        payer,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });
  });
});
