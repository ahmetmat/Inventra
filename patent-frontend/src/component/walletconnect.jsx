// src/components/WalletConnect.jsx
import React from 'react';
import { useContract } from '../hooks/useContract';
import { formatAddress } from '../utils/helper';

export default function WalletConnect() {
  const { account, connectWallet } = useContract();

  return (
    <div className="p-4 flex justify-end">
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="text-sm font-mono">
          Connected: {formatAddress(account)}
        </div>
      )}
    </div>
  );
}