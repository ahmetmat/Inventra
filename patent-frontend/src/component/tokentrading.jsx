// src/components/TokenTrading.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContract } from '../hooks/useContract';
import { PATENT_TOKEN_ABI } from '../contracts/abis';
import { formatEther, parseEther } from '../utils/helper';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function TokenTrading({ patent }) {
  const { provider, signer, account } = useContract();
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenMetrics, setTokenMetrics] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider && patent?.tokenAddress) {
      const contract = new ethers.Contract(
        patent.tokenAddress,
        PATENT_TOKEN_ABI,
        signer || provider
      );
      setTokenContract(contract);
      loadTokenData(contract);
    }
  }, [provider, signer, patent]);

  const loadTokenData = async (contract) => {
    try {
      const [metrics, history] = await Promise.all([
        contract.getTokenMetrics(),
        contract.getTradeHistory(10)
      ]);

      setTokenMetrics({
        currentPrice: formatEther(metrics._currentPrice),
        basePrice: formatEther(metrics._basePrice),
        liquidityPool: formatEther(metrics._liquidityPool),
        volume24h: formatEther(metrics._volume24h),
        holdersCount: metrics._holdersCount.toString(),
        isTrading: metrics._isTrading
      });

      setTradeHistory(history.map(h => ({
        time: new Date(h.timestamp.toNumber() * 1000).toLocaleTimeString(),
        price: parseFloat(formatEther(h.price)),
        volume: parseFloat(formatEther(h.volume))
      })));
    } catch (error) {
      console.error('Failed to load token data:', error);
    }
  };

  const buyTokens = async () => {
    if (!tokenContract || !amount) return;
    
    try {
      setLoading(true);
      const price = await tokenContract.calculatePrice(parseEther(amount));
      const tx = await tokenContract.buyTokens(parseEther(amount), {
        value: price
      });
      await tx.wait();
      await loadTokenData(tokenContract);
    } catch (error) {
      console.error('Failed to buy tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const sellTokens = async () => {
    if (!tokenContract || !amount) return;
    
    try {
      setLoading(true);
      const tx = await tokenContract.sellTokens(parseEther(amount));
      await tx.wait();
      await loadTokenData(tokenContract);
    } catch (error) {
      console.error('Failed to sell tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!patent) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Token Trading</h2>
      
      {tokenMetrics && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p>Current Price: {tokenMetrics.currentPrice} ETH</p>
            <p>24h Volume: {tokenMetrics.volume24h} ETH</p>
            <p>Holders: {tokenMetrics.holdersCount}</p>
          </div>
          
          <div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-full p-2 border rounded"
              disabled={loading}
            />
            
            <div className="flex gap-2 mt-2">
              <button
                onClick={buyTokens}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Buy
              </button>
              <button
                onClick={sellTokens}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      )}

      {tradeHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Price History</h3>
          <LineChart width={600} height={300} data={tradeHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#8884d8" />
          </LineChart>
        </div>
      )}
    </div>
  );
}