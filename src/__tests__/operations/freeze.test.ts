import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TokenOperations } from '../../token/operations';
import * as splToken from '@solana/spl-token';

jest.mock('@solana/spl-token');
jest.mock('../../utils/logger');

describe('TokenOperations - Freeze/Thaw', () => {
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

  describe('freezeAccount', () => {
    it('should freeze account successfully', async () => {
      const account = Keypair.generate().publicKey;
      const signature = 'mock-freeze-signature';

      (splToken.freezeAccount as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.freezeAccount(mockMint, account);

      expect(result).toBe(signature);
      expect(splToken.freezeAccount).toHaveBeenCalledWith(
        connection,
        payer,
        account,
        mockMint,
        payer
      );
    });

    it('should freeze account with custom authority', async () => {
      const account = Keypair.generate().publicKey;
      const freezeAuthority = Keypair.generate();
      const signature = 'mock-freeze-signature';

      (splToken.freezeAccount as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.freezeAccount(mockMint, account, freezeAuthority);

      expect(result).toBe(signature);
      expect(splToken.freezeAccount).toHaveBeenCalledWith(
        connection,
        payer,
        account,
        mockMint,
        freezeAuthority
      );
    });

    it('should handle errors during freeze', async () => {
      const account = Keypair.generate().publicKey;
      const error = new Error('Freeze failed');

      (splToken.freezeAccount as jest.Mock).mockRejectedValue(error);

      await expect(tokenOps.freezeAccount(mockMint, account)).rejects.toThrow(
        'Freeze failed'
      );
    });
  });

  describe('thawAccount', () => {
    it('should thaw account successfully', async () => {
      const account = Keypair.generate().publicKey;
      const signature = 'mock-thaw-signature';

      (splToken.thawAccount as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.thawAccount(mockMint, account);

      expect(result).toBe(signature);
      expect(splToken.thawAccount).toHaveBeenCalledWith(
        connection,
        payer,
        account,
        mockMint,
        payer
      );
    });

    it('should thaw account with custom authority', async () => {
      const account = Keypair.generate().publicKey;
      const freezeAuthority = Keypair.generate();
      const signature = 'mock-thaw-signature';

      (splToken.thawAccount as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.thawAccount(mockMint, account, freezeAuthority);

      expect(result).toBe(signature);
      expect(splToken.thawAccount).toHaveBeenCalledWith(
        connection,
        payer,
        account,
        mockMint,
        freezeAuthority
      );
    });

    it('should handle errors during thaw', async () => {
      const account = Keypair.generate().publicKey;
      const error = new Error('Thaw failed');

      (splToken.thawAccount as jest.Mock).mockRejectedValue(error);

      await expect(tokenOps.thawAccount(mockMint, account)).rejects.toThrow('Thaw failed');
    });
  });

  describe('setAuthority', () => {
    it('should transfer authority successfully', async () => {
      const currentAuthority = Keypair.generate();
      const newAuthority = Keypair.generate().publicKey;
      const signature = 'mock-authority-signature';

      (splToken.setAuthority as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.setAuthority(
        mockMint,
        splToken.AuthorityType.MintTokens,
        currentAuthority,
        newAuthority
      );

      expect(result).toBe(signature);
      expect(splToken.setAuthority).toHaveBeenCalledWith(
        connection,
        payer,
        mockMint,
        currentAuthority,
        splToken.AuthorityType.MintTokens,
        newAuthority
      );
    });

    it('should revoke authority successfully', async () => {
      const currentAuthority = Keypair.generate();
      const signature = 'mock-authority-signature';

      (splToken.setAuthority as jest.Mock).mockResolvedValue(signature);

      const result = await tokenOps.setAuthority(
        mockMint,
        splToken.AuthorityType.FreezeAccount,
        currentAuthority,
        null
      );

      expect(result).toBe(signature);
      expect(splToken.setAuthority).toHaveBeenCalledWith(
        connection,
        payer,
        mockMint,
        currentAuthority,
        splToken.AuthorityType.FreezeAccount,
        null
      );
    });

    it('should handle errors during authority change', async () => {
      const currentAuthority = Keypair.generate();
      const newAuthority = Keypair.generate().publicKey;
      const error = new Error('Authority change failed');

      (splToken.setAuthority as jest.Mock).mockRejectedValue(error);

      await expect(
        tokenOps.setAuthority(
          mockMint,
          splToken.AuthorityType.MintTokens,
          currentAuthority,
          newAuthority
        )
      ).rejects.toThrow('Authority change failed');
    });
  });
});
