import { WalletManager } from '../../utils/wallet';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';

jest.mock('fs');

describe('WalletManager - Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidPublicKey', () => {
    it('should validate correct public key', () => {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toBase58();

      const result = WalletManager.isValidPublicKey(publicKey);

      expect(result).toBe(true);
    });

    it('should reject invalid public key', () => {
      const invalidKey = 'invalid-public-key';

      const result = WalletManager.isValidPublicKey(invalidKey);

      expect(result).toBe(false);
    });

    it('should reject empty string', () => {
      const result = WalletManager.isValidPublicKey('');

      expect(result).toBe(false);
    });

    it('should reject public key with wrong length', () => {
      const result = WalletManager.isValidPublicKey('abc123');

      expect(result).toBe(false);
    });
  });

  describe('getBase58PrivateKey', () => {
    it('should encode private key correctly', () => {
      const keypair = Keypair.generate();

      const base58Key = WalletManager.getBase58PrivateKey(keypair);

      expect(base58Key).toBeTruthy();
      expect(typeof base58Key).toBe('string');

      // Verify we can decode it back
      const decoded = bs58.decode(base58Key);
      expect(decoded).toEqual(keypair.secretKey);
    });

    it('should produce consistent encoding', () => {
      const keypair = Keypair.generate();

      const key1 = WalletManager.getBase58PrivateKey(keypair);
      const key2 = WalletManager.getBase58PrivateKey(keypair);

      expect(key1).toBe(key2);
    });
  });

  describe('loadFromPrivateKey', () => {
    it('should load keypair from valid base58 private key', () => {
      const originalKeypair = Keypair.generate();
      const base58Key = WalletManager.getBase58PrivateKey(originalKeypair);

      const loadedKeypair = WalletManager.loadFromPrivateKey(base58Key);

      expect(loadedKeypair.publicKey.toBase58()).toBe(
        originalKeypair.publicKey.toBase58()
      );
    });

    it('should throw error for invalid base58 string', () => {
      const invalidKey = 'invalid-base58-key!!!';

      expect(() => {
        WalletManager.loadFromPrivateKey(invalidKey);
      }).toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => {
        WalletManager.loadFromPrivateKey('');
      }).toThrow();
    });
  });

  describe('generate', () => {
    it('should generate new keypair', () => {
      const keypair = WalletManager.generate();

      expect(keypair).toBeInstanceOf(Keypair);
      expect(keypair.publicKey).toBeInstanceOf(PublicKey);
      expect(keypair.secretKey).toHaveLength(64);
    });

    it('should generate unique keypairs', () => {
      const keypair1 = WalletManager.generate();
      const keypair2 = WalletManager.generate();

      expect(keypair1.publicKey.toBase58()).not.toBe(keypair2.publicKey.toBase58());
    });
  });

  describe('saveToFile', () => {
    it('should save keypair to file', () => {
      const keypair = Keypair.generate();
      const filePath = '/tmp/test-keypair.json';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      WalletManager.saveToFile(keypair, filePath);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('['),
        expect.objectContaining({ mode: 0o600 })
      );
    });

    it('should create directory if it does not exist', () => {
      const keypair = Keypair.generate();
      const filePath = '/tmp/new-dir/test-keypair.json';

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      WalletManager.saveToFile(keypair, filePath);

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ recursive: true })
      );
    });
  });

  describe('loadFromFile', () => {
    it('should load keypair from valid file', () => {
      const originalKeypair = Keypair.generate();
      const filePath = '/tmp/test-keypair.json';
      const secretKeyArray = Array.from(originalKeypair.secretKey);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(secretKeyArray));

      const loadedKeypair = WalletManager.loadFromFile(filePath);

      expect(loadedKeypair.publicKey.toBase58()).toBe(
        originalKeypair.publicKey.toBase58()
      );
    });

    it('should throw error if file does not exist', () => {
      const filePath = '/tmp/nonexistent.json';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => {
        WalletManager.loadFromFile(filePath);
      }).toThrow();
    });

    it('should throw error for invalid file format', () => {
      const filePath = '/tmp/invalid.json';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      expect(() => {
        WalletManager.loadFromFile(filePath);
      }).toThrow();
    });
  });

  describe('loadFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should load keypair from environment variable', () => {
      const keypair = Keypair.generate();
      const base58Key = WalletManager.getBase58PrivateKey(keypair);
      process.env.DEPLOYER_PRIVATE_KEY = base58Key;

      const loadedKeypair = WalletManager.loadFromEnv();

      expect(loadedKeypair.publicKey.toBase58()).toBe(keypair.publicKey.toBase58());
    });

    it('should use custom environment variable name', () => {
      const keypair = Keypair.generate();
      const base58Key = WalletManager.getBase58PrivateKey(keypair);
      process.env.CUSTOM_KEY = base58Key;

      const loadedKeypair = WalletManager.loadFromEnv('CUSTOM_KEY');

      expect(loadedKeypair.publicKey.toBase58()).toBe(keypair.publicKey.toBase58());
    });

    it('should throw error if environment variable is not set', () => {
      delete process.env.DEPLOYER_PRIVATE_KEY;

      expect(() => {
        WalletManager.loadFromEnv();
      }).toThrow('Environment variable DEPLOYER_PRIVATE_KEY is not set');
    });
  });
});
