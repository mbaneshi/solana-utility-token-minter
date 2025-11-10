'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  burn,
  getAccount,
} from '@solana/spl-token';

interface BurnTokensProps {
  mintAddress: string;
}

export default function BurnTokens({ mintAddress }: BurnTokensProps) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  const loadBalance = async () => {
    if (!publicKey) return;

    try {
      const mint = new PublicKey(mintAddress);
      const mintInfo = await getMint(connection, mint);
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any,
        mint,
        publicKey
      );
      const accountInfo = await getAccount(connection, tokenAccount.address);
      setBalance(Number(accountInfo.amount) / 10 ** mintInfo.decimals);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleBurn = async () => {
    if (!publicKey) {
      setStatus('Please connect wallet');
      return;
    }

    try {
      setLoading(true);
      setStatus('Preparing transaction...');

      const mint = new PublicKey(mintAddress);
      const mintInfo = await getMint(connection, mint);

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any,
        mint,
        publicKey
      );

      const amountWithDecimals = BigInt(parseFloat(amount) * 10 ** mintInfo.decimals);

      setStatus('Burning tokens...');
      const signature = await burn(
        connection,
        publicKey as any,
        tokenAccount.address,
        mint,
        publicKey,
        amountWithDecimals
      );

      setStatus(`Success! Burned ${amount} tokens. Signature: ${signature.slice(0, 8)}...`);
      setAmount('');
      loadBalance();

      setTimeout(() => setStatus(''), 5000);
    } catch (error: any) {
      setStatus(`Error: ${error.message || 'Failed to burn tokens'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Burn Tokens</h3>
        {publicKey && (
          <button
            onClick={loadBalance}
            className="text-sm text-solana-purple hover:text-purple-400"
          >
            Check Balance
          </button>
        )}
      </div>

      {balance !== null && (
        <div className="mb-4 p-3 bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-400">Your Balance</p>
          <p className="text-lg font-semibold">{balance.toLocaleString()}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Amount to Burn</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-solana-purple"
          />
          {balance !== null && amount && parseFloat(amount) > balance && (
            <p className="mt-1 text-sm text-red-400">Insufficient balance</p>
          )}
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
          <p className="text-xs text-yellow-200">
            ⚠️ Burning tokens is permanent and cannot be undone
          </p>
        </div>

        <button
          onClick={handleBurn}
          disabled={loading || !amount || (balance !== null && parseFloat(amount) > balance)}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Burning...' : 'Burn Tokens'}
        </button>

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
