// src/App.jsx
import React, { useState } from 'react';
import WalletConnect from './component/walletconnect';
import PatentList from './component/patentlist';
import TokenTrading from './component/tokentrading';
import CreatePatent from './component/createPatent';


import './index.css';

export default function App() {
  const [selectedPatent, setSelectedPatent] = useState(null);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Patent Trading Platform</h1>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <CreatePatent />
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Available Patents</h2>
              <PatentList onSelectPatent={setSelectedPatent} />
            </div>
          </div>

          <div>
            {selectedPatent && (
              <TokenTrading patent={selectedPatent} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}