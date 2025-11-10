import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TokenOperations } from '../../token/operations';
import * as splToken from '@solana/spl-token';

jest.mock('@solana/spl-token');
jest.mock('../../utils/logger');

describe('TokenOperations - Transfer', () => {
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

  describe('transferTokens', () => {
    it('should transfer tokens successfully', async () => {
      const amount = 500;
      const decimals = 9;
      const from = Keypair.generate().publicKey;
      const to = Keypair.generate().publicKey;
      const signature = 'mock-transfer-signature';

      (splToken.transfer as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.transferTokens(mockMint, from, to, amount, decimals);

      expect(result).toBe(signature);
      expect(splToken.transfer).toHaveBeenCalledWith(
        connection,
        payer,
        from,
        to,
        payer,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });

    it('should transfer tokens with custom owner', async () => {
      const amount = 500;
      const decimals = 9;
      const from = Keypair.generate().publicKey;
      const to = Keypair.generate().publicKey;
      const owner = Keypair.generate();
      const signature = 'mock-transfer-signature';

      (splToken.transfer as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.transferTokens(
        mockMint,
        from,
        to,
        amount,
        decimals,
        owner
      );

      expect(result).toBe(signature);
      expect(splToken.transfer).toHaveBeenCalledWith(
        connection,
        payer,
        from,
        to,
        owner,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });

    it('should handle whole number amounts', async () => {
      const amount = 123;
      const decimals = 6;
      const from = Keypair.generate().publicKey;
      const to = Keypair.generate().publicKey;
      const signature = 'mock-transfer-signature';

      (splToken.transfer as jest.Mock).mockResolvedValue(signature);

      await tokenOps.transferTokens(mockMint, from, to, amount, decimals);

      expect(splToken.transfer).toHaveBeenCalledWith(
        connection,
        payer,
        from,
        to,
        payer,
        BigInt(amount) * BigInt(10 ** decimals)
      );
    });

    it('should handle errors during transfer', async () => {
      const amount = 500;
      const decimals = 9;
      const from = Keypair.generate().publicKey;
      const to = Keypair.generate().publicKey;
      const error = new Error('Transfer failed');

      (splToken.transfer as jest.Mock).mockRejectedValue(error);

      await expect(
        tokenOps.transferTokens(mockMint, from, to, amount, decimals)
      ).rejects.toThrow('Transfer failed');
    });

    it('should handle zero amount transfers', async () => {
      const amount = 0;
      const decimals = 9;
      const from = Keypair.generate().publicKey;
      const to = Keypair.generate().publicKey;
      const signature = 'mock-transfer-signature';

      (splToken.transfer as jest.Mock).mockResolvedValue(signature);

      await tokenOps.transferTokens(mockMint, from, to, amount, decimals);

      expect(splToken.transfer).toHaveBeenCalledWith(
        connection,
        payer,
        from,
        to,
        payer,
        BigInt(0)
      );
    });
  });
});
