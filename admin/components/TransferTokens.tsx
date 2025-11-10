'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
} from '@solana/spl-token';

interface TransferTokensProps {
  mintAddress: string;
}

export default function TransferTokens({ mintAddress }: TransferTokensProps) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleTransfer = async () => {
    if (!publicKey) {
      setStatus('Please connect wallet');
      return;
    }

    try {
      setLoading(true);
      setStatus('Preparing transaction...');

      const mint = new PublicKey(mintAddress);
      const recipientPubkey = new PublicKey(recipient);
      const mintInfo = await getMint(connection, mint);

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any,
        mint,
        publicKey
      );

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any,
        mint,
        recipientPubkey
      );

      const amountWithDecimals = BigInt(parseFloat(amount) * 10 ** mintInfo.decimals);

      setStatus('Transferring tokens...');
      const signature = await transfer(
        connection,
        publicKey as any,
        fromTokenAccount.address,
        toTokenAccount.address,
        publicKey,
        amountWithDecimals
      );

      setStatus(`Success! Transferred ${amount} tokens. Signature: ${signature.slice(0, 8)}...`);
      setRecipient('');
      setAmount('');

      setTimeout(() => setStatus(''), 5000);
    } catch (error: any) {
      setStatus(`Error: ${error.message || 'Failed to transfer tokens'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold mb-4">Transfer Tokens</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Solana wallet address"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-solana-purple"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-solana-purple"
          />
        </div>

        <button
          onClick={handleTransfer}
          disabled={loading || !recipient || !amount}
          className="w-full py-3 bg-solana-green hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors text-black"
        >
          {loading ? 'Transferring...' : 'Transfer Tokens'}
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
