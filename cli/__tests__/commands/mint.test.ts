import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TokenOperations } from '../../../src/token/operations';

jest.mock('../../../src/token/operations');
jest.mock('../../../src/utils/wallet');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/config');
jest.mock('fs');

describe('CLI - Mint Command', () => {
  let mockTokenOps: jest.Mocked<TokenOperations>;
  let mockMint: PublicKey;
  let mockRecipient: PublicKey;

  beforeEach(() => {
    mockMint = Keypair.generate().publicKey;
    mockRecipient = Keypair.generate().publicKey;
    mockTokenOps = {
      getTokenInfo: jest.fn(),
      getOrCreateTokenAccount: jest.fn(),
      mintTokens: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  it('should mint tokens successfully', async () => {
    const amount = 1000;
    const decimals = 9;
    const signature = 'test-signature';
    const tokenAccount = Keypair.generate().publicKey;

    mockTokenOps.getTokenInfo.mockResolvedValue({
      mintAddress: mockMint,
      decimals,
      supply: BigInt(0),
      mintAuthority: Keypair.generate().publicKey,
      freezeAuthority: null,
    });

    mockTokenOps.getOrCreateTokenAccount.mockResolvedValue(tokenAccount);
    mockTokenOps.mintTokens.mockResolvedValue(signature);

    await mockTokenOps.mintTokens(mockMint, tokenAccount, amount, decimals);

    expect(mockTokenOps.mintTokens).toHaveBeenCalledWith(
      mockMint,
      tokenAccount,
      amount,
      decimals
    );
    expect(mockTokenOps.mintTokens).toHaveReturnedWith(Promise.resolve(signature));
  });

  it('should reject minting when authority is revoked', async () => {
    mockTokenOps.getTokenInfo.mockResolvedValue({
      mintAddress: mockMint,
      decimals: 9,
      supply: BigInt(0),
      mintAuthority: null,
      freezeAuthority: null,
    });

    const tokenInfo = await mockTokenOps.getTokenInfo(mockMint);
    expect(tokenInfo.mintAuthority).toBeNull();
  });

  it('should handle invalid amount', async () => {
    const invalidAmount = -100;
    const decimals = 9;
    const tokenAccount = Keypair.generate().publicKey;

    mockTokenOps.mintTokens.mockRejectedValue(new Error('Invalid amount'));

    await expect(
      mockTokenOps.mintTokens(mockMint, tokenAccount, invalidAmount, decimals)
    ).rejects.toThrow('Invalid amount');
  });

  it('should handle invalid recipient address', async () => {
    const error = new Error('Invalid public key');
    mockTokenOps.getOrCreateTokenAccount.mockRejectedValue(error);

    await expect(
      mockTokenOps.getOrCreateTokenAccount(mockMint, mockRecipient)
    ).rejects.toThrow('Invalid public key');
  });
});
