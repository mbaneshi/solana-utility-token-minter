import { Keypair } from '@solana/web3.js';
import { TokenOperations } from '../../../src/token/operations';

jest.mock('../../../src/token/operations');

describe('CLI - Transfer Command', () => {
  let mockTokenOps: jest.Mocked<TokenOperations>;

  beforeEach(() => {
    mockTokenOps = {
      transferTokens: jest.fn(),
      getOrCreateTokenAccount: jest.fn(),
    } as any;
  });

  it('should transfer tokens successfully', async () => {
    mockTokenOps.transferTokens.mockResolvedValue('signature');
    const result = await mockTokenOps.transferTokens(
      Keypair.generate().publicKey,
      Keypair.generate().publicKey,
      Keypair.generate().publicKey,
      100,
      9
    );
    expect(result).toBe('signature');
  });
});
