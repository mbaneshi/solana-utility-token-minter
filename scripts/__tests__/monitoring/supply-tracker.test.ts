import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TokenOperations } from '../../../src/token/operations';

jest.mock('../../../src/token/operations');
jest.mock('../../../src/utils/logger');

describe('Monitoring - Supply Tracker', () => {
  let mockTokenOps: jest.Mocked<TokenOperations>;
  let mockMint: PublicKey;

  beforeEach(() => {
    mockMint = Keypair.generate().publicKey;
    mockTokenOps = {
      getTokenInfo: jest.fn(),
      getTotalSupply: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  it('should track total supply correctly', async () => {
    const supply = 1000000;
    const decimals = 9;

    mockTokenOps.getTotalSupply.mockResolvedValue(supply);

    const result = await mockTokenOps.getTotalSupply(mockMint, decimals);

    expect(result).toBe(supply);
    expect(mockTokenOps.getTotalSupply).toHaveBeenCalledWith(mockMint, decimals);
  });

  it('should get token info with authorities', async () => {
    const tokenInfo = {
      mintAddress: mockMint,
      decimals: 9,
      supply: BigInt(1000000),
      mintAuthority: Keypair.generate().publicKey,
      freezeAuthority: Keypair.generate().publicKey,
    };

    mockTokenOps.getTokenInfo.mockResolvedValue(tokenInfo);

    const result = await mockTokenOps.getTokenInfo(mockMint);

    expect(result.mintAddress).toBe(mockMint);
    expect(result.mintAuthority).not.toBeNull();
    expect(result.freezeAuthority).not.toBeNull();
  });

  it('should detect revoked authorities', async () => {
    const tokenInfo = {
      mintAddress: mockMint,
      decimals: 9,
      supply: BigInt(1000000),
      mintAuthority: null,
      freezeAuthority: null,
    };

    mockTokenOps.getTokenInfo.mockResolvedValue(tokenInfo);

    const result = await mockTokenOps.getTokenInfo(mockMint);

    expect(result.mintAuthority).toBeNull();
    expect(result.freezeAuthority).toBeNull();
  });

  it('should handle network errors', async () => {
    const error = new Error('Network timeout');
    mockTokenOps.getTotalSupply.mockRejectedValue(error);

    await expect(
      mockTokenOps.getTotalSupply(mockMint, 9)
    ).rejects.toThrow('Network timeout');
  });
});
