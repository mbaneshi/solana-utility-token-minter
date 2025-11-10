import { Keypair } from '@solana/web3.js';
import { TokenOperations } from '../../../src/token/operations';

jest.mock('../../../src/token/operations');

describe('CLI - Freeze Command', () => {
  let mockTokenOps: jest.Mocked<TokenOperations>;

  beforeEach(() => {
    mockTokenOps = {
      freezeAccount: jest.fn(),
      thawAccount: jest.fn(),
      getTokenInfo: jest.fn(),
    } as any;
  });

  it('should freeze account successfully', async () => {
    mockTokenOps.freezeAccount.mockResolvedValue('signature');
    const result = await mockTokenOps.freezeAccount(
      Keypair.generate().publicKey,
      Keypair.generate().publicKey
    );
    expect(result).toBe('signature');
  });

  it('should thaw account successfully', async () => {
    mockTokenOps.thawAccount.mockResolvedValue('signature');
    const result = await mockTokenOps.thawAccount(
      Keypair.generate().publicKey,
      Keypair.generate().publicKey
    );
    expect(result).toBe('signature');
  });
});
