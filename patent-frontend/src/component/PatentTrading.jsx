import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatent } from './context/patentcontext';
import { Card } from '../component/ui/card';
import { Button } from '../component/ui/button';
import { Loader2, Coins } from 'lucide-react';


import {
  TrendingUp,
  Users,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';

const PATENT_TOKEN_ABI = [
  "function getTokenMetrics() view returns (uint256,uint256,uint256,uint256,uint256,bool)",
  "function buyTokens(uint256) payable",
  "function sellTokens(uint256)",
  "function calculatePrice(uint256,bool) view returns (uint256)"
];

const PatentTrading = () => {
  const { patentId } = useParams();
  const navigate = useNavigate();
  const { getPatentDetails, getPatentToken } = usePatent();

  const [patent, setPatent] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenMetrics, setTokenMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy');
  const [estimatedCost, setEstimatedCost] = useState(null);

  useEffect(() => {
    loadPatentData();
  }, [patentId]);

  const loadPatentData = async () => {
    try {
      setLoading(true);
      // Patent detaylarını yükle
      const patentDetails = await getPatentDetails(patentId);
      setPatent(patentDetails);

      // Token kontratını yükle
      const tokenAddress = await getPatentToken(patentId);
      if (tokenAddress === ethers.ZeroAddress) {
        throw new Error('Token not found for this patent');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, PATENT_TOKEN_ABI, signer);
      setTokenContract(contract);

      // Token metriklerini yükle
      await updateTokenMetrics(contract);

    } catch (err) {
      console.error('Failed to load patent data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTokenMetrics = async (contract) => {
    const metrics = await contract.getTokenMetrics();
    setTokenMetrics({
      currentPrice: metrics[0],
      basePrice: metrics[1],
      liquidityPool: metrics[2],
      volume24h: metrics[3],
      holdersCount: metrics[4],
      isTrading: metrics[5]
    });
  };

  const calculateTradePrice = async (amount) => {
    if (!amount || !tokenContract) return;
    try {
      const baseAmount = ethers.parseEther(amount);
      const price = await tokenContract.calculatePrice(baseAmount, tradeType === 'buy');
      setEstimatedCost(price);
    } catch (err) {
      console.error('Price calculation error:', err);
    }
  };

  useEffect(() => {
    calculateTradePrice(tradeAmount);
  }, [tradeAmount, tradeType]);

  const handleTrade = async () => {
    if (!tradeAmount || !tokenContract) return;
    
    try {
      setLoading(true);
      const amount = ethers.parseEther(tradeAmount);

      let tx;
      if (tradeType === 'buy') {
        tx = await tokenContract.buyTokens(amount, {
          value: estimatedCost,
          gasLimit: 300000
        });
      } else {
        tx = await tokenContract.sellTokens(amount, {
          gasLimit: 300000
        });
      }

      await tx.wait();
      await updateTokenMetrics(tokenContract);
      setTradeAmount('');
      setEstimatedCost(null);

    } catch (err) {
      console.error('Trade error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !patent) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-white shadow-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">{patent?.title}</h2>
              <p className="text-gray-500">Patent ID: {patent?.patentId}</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/patents')}
            >
              Back to Patents
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              {error}
            </Alert>
          )}

          {tokenMetrics && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-sm text-gray-500">Current Price</div>
                <div className="text-xl font-bold">
                  {ethers.formatEther(tokenMetrics.currentPrice)} ETH
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-gray-500">24h Volume</div>
                <div className="text-xl font-bold">
                  {ethers.formatEther(tokenMetrics.volume24h)} ETH
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-gray-500">Holders</div>
                <div className="text-xl font-bold">
                  {tokenMetrics.holdersCount.toString()}
                </div>
              </Card>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex gap-2">
              <Button
                variant={tradeType === 'buy' ? 'default' : 'outline'}
                onClick={() => setTradeType('buy')}
                className="flex-1"
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Buy
              </Button>
              <Button
                variant={tradeType === 'sell' ? 'default' : 'outline'}
                onClick={() => setTradeType('sell')}
                className="flex-1"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Sell
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Amount to {tradeType}
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={loading}
              />
            </div>

            {estimatedCost && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Estimated Cost</div>
                <div className="text-lg font-medium">
                  {ethers.formatEther(estimatedCost)} ETH
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleTrade}
              disabled={!tradeAmount || loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : tradeType === 'buy' ? (
                <Wallet className="w-4 h-4 mr-2" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Processing...' : `${tradeType} Tokens`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PatentTrading;