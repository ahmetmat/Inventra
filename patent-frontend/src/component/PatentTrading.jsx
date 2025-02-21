import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatent } from './context/patentcontext';
import { Card } from '../component/ui/card';
import { Button } from '../component/ui/button';
import { Alert } from '../component/ui/alert';
import { ethers } from 'ethers';
import TradingViewChart from './TradingViewChart';
import {
  Loader2,
  TrendingUp,
  Users,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  LinkIcon
} from 'lucide-react';

const PATENT_TOKEN_ABI = [
  "function getTokenMetrics() view returns (uint256,uint256,uint256,uint256,uint256,bool)",
  "function buyTokens(uint256) payable",
  "function sellTokens(uint256)",
  "function calculatePrice(uint256) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const PatentTrading = () => {
  const { patentId } = useParams();
  const navigate = useNavigate();
  const { getPatentDetails, getPatentToken, account, connectWallet } = usePatent();

  const [patent, setPatent] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenMetrics, setTokenMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy');
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [isTokenHolder, setIsTokenHolder] = useState(false);

  // Wallet bağlantısını ve veri yüklemeyi yönet
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!window.ethereum) {
          throw new Error('Please install MetaMask to trade tokens');
        }

        if (!account) {
          await connectWallet();
        }

        await loadPatentData();
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
      }
    };

    initialize();
  }, [patentId, account]);

  const loadPatentData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!account) {
        throw new Error('Please connect your wallet to trade');
      }

      const patentDetails = await getPatentDetails(patentId);
      setPatent(patentDetails);

      const tokenAddress = await getPatentToken(patentId);
      
      if (!tokenAddress || tokenAddress === ethers.constants.AddressZero) {
        throw new Error('No token found for this patent');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // Explicit connection request
      const signer = provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, PATENT_TOKEN_ABI, signer);
      setTokenContract(contract);

      await updateTokenMetrics(contract);

      const balance = await contract.balanceOf(account);
      setIsTokenHolder(balance.gt(ethers.constants.Zero));

    } catch (err) {
      console.error('Failed to load patent data:', err);
      setError(err.message);
      
      if (err.message.includes('No token found')) {
        setTimeout(() => {
          navigate(`/tokenize-patent/${patentId}`);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTokenMetrics = async (contract) => {
    try {
      const metrics = await contract.getTokenMetrics();
      setTokenMetrics({
        currentPrice: metrics[0],
        basePrice: metrics[1],
        liquidityPool: metrics[2],
        volume24h: metrics[3],
        holdersCount: metrics[4],
        isTrading: metrics[5]
      });
    } catch (err) {
      console.error('Failed to update metrics:', err);
      setError('Failed to load token metrics');
    }
  };

  const calculateTradePrice = async (amount) => {
    if (!amount || !tokenContract) return;
    try {
      const baseAmount = ethers.utils.parseEther(amount.toString());
      const price = await tokenContract.calculatePrice(baseAmount);
      setEstimatedCost(price);
    } catch (err) {
      console.error('Price calculation error:', err);
      setError('Failed to calculate price');
    }
  };

  useEffect(() => {
    if (tradeAmount) {
      calculateTradePrice(tradeAmount);
    }
  }, [tradeAmount, tradeType]);

  const handleTrade = async () => {
    if (!tradeAmount || !tokenContract) return;
    
    try {
      setLoading(true);
      setError(null);
      const amount = ethers.utils.parseEther(tradeAmount.toString());

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
      
      // Update token holder status
      const balance = await tokenContract.balanceOf(account);
      setIsTokenHolder(balance.gt(ethers.constants.Zero));
      
      setTradeAmount('');
      setEstimatedCost(null);

    } catch (err) {
      console.error('Trade error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="bg-white shadow-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Connect Wallet to Trade</h2>
            <Button 
              onClick={connectWallet}
              className="flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Connect Wallet
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading && !patent) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
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
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{error}</span>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading chart */}
        <Card className="bg-white shadow-lg p-6">
          {tokenContract && (
            <TradingViewChart
              tokenAddress={tokenContract.address}
              patentTitle={patent?.title}
            />
          )}
        </Card>

        {/* Trading form */}
        <Card className="bg-white shadow-lg">
          <div className="p-6">
            {tokenMetrics && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <div className="text-sm text-gray-500">Current Price</div>
                  <div className="text-xl font-bold">
                    {ethers.utils.formatEther(tokenMetrics.currentPrice)} ETH
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-500">24h Volume</div>
                  <div className="text-xl font-bold">
                    {ethers.utils.formatEther(tokenMetrics.volume24h)} ETH
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
                  disabled={!isTokenHolder}
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
                  disabled={loading || (tradeType === 'sell' && !isTokenHolder)}
                />
              </div>

              {estimatedCost && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Estimated Cost</div>
                  <div className="text-lg font-medium">
                    {ethers.utils.formatEther(estimatedCost)} ETH
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleTrade}
                disabled={!tradeAmount || loading || (tradeType === 'sell' && !isTokenHolder)}
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
    </div>
  );
};

export default PatentTrading;