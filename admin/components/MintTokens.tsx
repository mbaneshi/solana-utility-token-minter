'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createMintToInstruction,
} from '@solana/spl-token';

interface MintTokensProps {
  mintAddress: string;
}

export default function MintTokens({ mintAddress }: MintTokensProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleMint = async () => {
    if (!publicKey) {
      setStatus('Please connect wallet');
      return;
    }

    try {
      setLoading(true);
      setStatus('Preparing transaction...');

      const mint = new PublicKey(mintAddress);
      const recipientPubkey = new PublicKey(recipient);

      // Get mint info
      const mintInfo = await getMint(connection, mint);

      // Check mint authority
      if (!mintInfo.mintAuthority || !mintInfo.mintAuthority.equals(publicKey)) {
        setStatus('Error: You do not have mint authority');
        setLoading(false);
        return;
      }

      // Get or create token account
      setStatus('Getting token account...');
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any,
        mint,
        recipientPubkey
      );

      // Calculate amount with decimals
      const amountWithDecimals = BigInt(parseFloat(amount) * 10 ** mintInfo.decimals);

      // Send mint transaction
      setStatus('Minting tokens...');
      const signature = await mintTo(
        connection,
        publicKey as any,
        mint,
        tokenAccount.address,
        publicKey,
        amountWithDecimals
      );

      setStatus(`Success! Signature: ${signature.slice(0, 8)}...`);
      setRecipient('');
      setAmount('');

      // Auto-clear status after 5 seconds
      setTimeout(() => setStatus(''), 5000);
    } catch (error: any) {
      setStatus(`Error: ${error.message || 'Failed to mint tokens'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold mb-4">Mint Tokens</h3>

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
          onClick={handleMint}
          disabled={loading || !recipient || !amount}
          className="w-full py-3 bg-solana-purple hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Minting...' : 'Mint Tokens'}
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
