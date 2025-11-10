'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { getMint, getAccount } from '@solana/spl-token';
import TokenInfo from '../components/TokenInfo';
import MintTokens from '../components/MintTokens';
import BurnTokens from '../components/BurnTokens';
import TransferTokens from '../components/TransferTokens';
import FreezeAccount from '../components/FreezeAccount';

// Replace with your token mint address
const TOKEN_MINT = process.env.NEXT_PUBLIC_TOKEN_MINT || '';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [tokenMint, setTokenMint] = useState(TOKEN_MINT);
  const [isValidMint, setIsValidMint] = useState(false);

  useEffect(() => {
    if (tokenMint) {
      validateMint(tokenMint);
    }
  }, [tokenMint]);

  const validateMint = async (mint: string) => {
    try {
      const mintPubkey = new PublicKey(mint);
      await getMint(connection, mintPubkey);
      setIsValidMint(true);
    } catch {
      setIsValidMint(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
                Token Admin
              </h1>
              <p className="text-sm text-gray-400">SPL Token Management Dashboard</p>
            </div>
            <WalletMultiButton className="!bg-solana-purple hover:!bg-purple-600" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Token Mint Input */}
        <div className="mb-8 bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
          <label className="block text-sm font-medium mb-2">Token Mint Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tokenMint}
              onChange={(e) => setTokenMint(e.target.value)}
              placeholder="Enter token mint address"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-solana-purple"
            />
            {isValidMint && (
              <span className="flex items-center text-green-400">
                ✓ Valid
              </span>
            )}
          </div>
          {!isValidMint && tokenMint && (
            <p className="mt-2 text-sm text-red-400">Invalid token mint address</p>
          )}
        </div>

        {!connected ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your Solana wallet to manage tokens
            </p>
            <WalletMultiButton className="!bg-solana-purple hover:!bg-purple-600 mx-auto" />
          </div>
        ) : !isValidMint ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">Enter Token Mint</h2>
            <p className="text-gray-400">
              Please enter a valid token mint address above
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Token Information */}
            <TokenInfo mintAddress={tokenMint} />

            {/* Operations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MintTokens mintAddress={tokenMint} />
              <BurnTokens mintAddress={tokenMint} />
              <TransferTokens mintAddress={tokenMint} />
              <FreezeAccount mintAddress={tokenMint} />
            </div>

            {/* Warning */}
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-400 mr-3 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-yellow-400">Important Security Notice</h3>
                  <p className="text-sm text-yellow-200/80 mt-1">
                    Only use this interface with wallets that have proper authority over the token.
                    All operations are irreversible. Always double-check addresses and amounts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-black/30 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          <p>Solana SPL Token Admin Interface v1.0</p>
          <p className="mt-1">
            Always verify transactions before signing. Keep your private keys secure.
          </p>
        </div>
      </footer>
    </div>
  );
}
