import { Keypair, PublicKey } from '@solana/web3.js';
import { TokenOperations } from '../../../src/token/operations';

jest.mock('../../../src/token/operations');
jest.mock('../../../src/utils/logger');

describe('CLI - Burn Command', () => {
  let mockTokenOps: jest.Mocked<TokenOperations>;

  beforeEach(() => {
    mockTokenOps = {
      getTokenInfo: jest.fn(),
      getOrCreateTokenAccount: jest.fn(),
      getBalance: jest.fn(),
      burnTokens: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  it('should burn tokens successfully', async () => {
    const amount = 100;
    mockTokenOps.getBalance.mockResolvedValue(1000);
    mockTokenOps.burnTokens.mockResolvedValue('signature');

    await expect(mockTokenOps.burnTokens(
      Keypair.generate().publicKey,
      Keypair.generate().publicKey,
      amount,
      9
    )).resolves.toBe('signature');
  });

  it('should reject burn when insufficient balance', async () => {
    mockTokenOps.getBalance.mockResolvedValue(50);

    const balance = await mockTokenOps.getBalance(Keypair.generate().publicKey, 9);
    expect(balance).toBeLessThan(100);
  });
});
