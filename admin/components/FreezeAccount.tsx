'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  freezeAccount,
  thawAccount,
  getAccount,
} from '@solana/spl-token';

interface FreezeAccountProps {
  mintAddress: string;
}

export default function FreezeAccount({ mintAddress }: FreezeAccountProps) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [targetWallet, setTargetWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [accountState, setAccountState] = useState<'unknown' | 'frozen' | 'unfrozen'>('unknown');

  const checkAccountState = async () => {
    if (!targetWallet) return;

    try {
      const mint = new PublicKey(mintAddress);
      const targetPubkey = new PublicKey(targetWallet);
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any,
        mint,
        targetPubkey
      );
      const accountInfo = await getAccount(connection, tokenAccount.address);
      setAccountState(accountInfo.isFrozen ? 'frozen' : 'unfrozen');
    } catch (error) {
      console.error('Failed to check account state:', error);
    }
  };

  const handleFreeze = async () => {
    if (!publicKey) {
      setStatus('Please connect wallet');
      return;
    }

    try {
      setLoading(true);
      setStatus('Preparing transaction...');

      const mint = new PublicKey(mintAddress);
      const targetPubkey = new PublicKey(targetWallet);

      const mintInfo = await getMint(connection, mint);
      if (!mintInfo.freezeAuthority || !mintInfo.freezeAuthority.equals(publicKey)) {
        setStatus('Error: You do not have freeze authority');
        setLoading(false);
        return;
      }

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any,
        mint,
        targetPubkey
      );

      setStatus('Freezing account...');
      const signature = await freezeAccount(
        connection,
        publicKey as any,
        tokenAccount.address,
        mint,
        publicKey
      );

      setStatus(`Success! Account frozen. Signature: ${signature.slice(0, 8)}...`);
      checkAccountState();

      setTimeout(() => setStatus(''), 5000);
    } catch (error: any) {
      setStatus(`Error: ${error.message || 'Failed to freeze account'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleThaw = async () => {
    if (!publicKey) {
      setStatus('Please connect wallet');
      return;
    }

    try {
      setLoading(true);
      setStatus('Preparing transaction...');

      const mint = new PublicKey(mintAddress);
      const targetPubkey = new PublicKey(targetWallet);

      const mintInfo = await getMint(connection, mint);
      if (!mintInfo.freezeAuthority || !mintInfo.freezeAuthority.equals(publicKey)) {
        setStatus('Error: You do not have freeze authority');
        setLoading(false);
        return;
      }

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any,
        mint,
        targetPubkey
      );

      setStatus('Thawing account...');
      const signature = await thawAccount(
        connection,
        publicKey as any,
        tokenAccount.address,
        mint,
        publicKey
      );

      setStatus(`Success! Account unfrozen. Signature: ${signature.slice(0, 8)}...`);
      checkAccountState();

      setTimeout(() => setStatus(''), 5000);
    } catch (error: any) {
      setStatus(`Error: ${error.message || 'Failed to thaw account'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold mb-4">Freeze/Thaw Account</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Target Wallet Address</label>
          <input
            type="text"
            value={targetWallet}
            onChange={(e) => {
              setTargetWallet(e.target.value);
              setAccountState('unknown');
            }}
            placeholder="Solana wallet address"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-solana-purple"
          />
          {targetWallet && (
            <button
              onClick={checkAccountState}
              className="mt-2 text-sm text-solana-purple hover:text-purple-400"
            >
              Check Account State
            </button>
          )}
        </div>

        {accountState !== 'unknown' && (
          <div className="p-3 bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-400">Current State</p>
            <p className="text-lg font-semibold">
              {accountState === 'frozen' ? (
                <span className="text-red-400">🔒 Frozen</span>
              ) : (
                <span className="text-green-400">🔓 Unfrozen</span>
              )}
            </p>
          </div>
        )}

        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
          <p className="text-xs text-yellow-200">
            ⚠️ Freezing prevents all transfers. Use only for compliance or security reasons.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleFreeze}
            disabled={loading || !targetWallet}
            className="py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Processing...' : 'Freeze'}
          </button>

          <button
            onClick={handleThaw}
            disabled={loading || !targetWallet}
            className="py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Processing...' : 'Thaw'}
          </button>
        </div>

        {status && (
          <div
            className={`p-3 rounded-lg text-sm ${
              status.startsWith('Error')
                ? 'bg-red-900/30 border border-red-700 text-red-400'
                : status.startsWith('Success')
                ? 'bg-green-900/30 border border-green-700 text-green-400'
                : 'bg-blue-900/30 border border-blue-700 text-blue-400'
            }`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
