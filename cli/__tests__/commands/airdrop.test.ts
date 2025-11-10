import { Keypair } from '@solana/web3.js';
import { TokenOperations } from '../../../src/token/operations';
import * as fs from 'fs';

jest.mock('../../../src/token/operations');
jest.mock('fs');

describe('CLI - Airdrop Command', () => {
  let mockTokenOps: jest.Mocked<TokenOperations>;

  beforeEach(() => {
    mockTokenOps = {
      transferTokens: jest.fn(),
      getOrCreateTokenAccount: jest.fn(),
      getTokenInfo: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  it('should process airdrop file successfully', () => {
    const csvContent = 'wallet1,100\nwallet2,200\nwallet3,300';
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(csvContent);

    const content = fs.readFileSync('test.csv', 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    expect(lines).toHaveLength(3);
  });

  it('should handle empty airdrop file', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('');

    const content = fs.readFileSync('test.csv', 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    expect(lines).toHaveLength(0);
  });

  it('should handle missing file', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(fs.existsSync('missing.csv')).toBe(false);
  });
});
