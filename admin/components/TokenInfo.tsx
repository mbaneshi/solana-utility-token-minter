'use client';

import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

interface TokenInfoProps {
  mintAddress: string;
}

export default function TokenInfo({ mintAddress }: TokenInfoProps) {
  const { connection } = useConnection();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInfo();
  }, [mintAddress]);

  const loadInfo = async () => {
    try {
      setLoading(true);
      const mint = new PublicKey(mintAddress);
      const mintInfo = await getMint(connection, mint);

      setInfo({
        address: mintAddress,
        decimals: mintInfo.decimals,
        supply: Number(mintInfo.supply) / 10 ** mintInfo.decimals,
        mintAuthority: mintInfo.mintAuthority?.toBase58() || 'Revoked',
        freezeAuthority: mintInfo.freezeAuthority?.toBase58() || 'Revoked',
      });
    } catch (error) {
      console.error('Failed to load token info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!info) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Token Information</h2>
        <button
          onClick={loadInfo}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Mint Address</p>
          <p className="font-mono text-sm break-all">{info.address}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Total Supply</p>
          <p className="text-lg font-semibold">{info.supply.toLocaleString()}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Decimals</p>
          <p className="text-lg font-semibold">{info.decimals}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Mint Authority</p>
          <p className="font-mono text-xs break-all">
            {info.mintAuthority === 'Revoked' ? (
              <span className="text-red-400">❌ Revoked</span>
            ) : (
              info.mintAuthority
            )}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Freeze Authority</p>
          <p className="font-mono text-xs break-all">
            {info.freezeAuthority === 'Revoked' ? (
              <span className="text-red-400">❌ Revoked</span>
            ) : (
              info.freezeAuthority
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
