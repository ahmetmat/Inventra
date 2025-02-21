import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatent } from './context/patentcontext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Coins, Loader2, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';

const TokenizePatent = () => {
  const { patentId } = useParams();
  const navigate = useNavigate();
  const { createPatentToken, getAllPatents, account } = usePatent();

  const [patent, setPatent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('');
  const [tokenAddress, setTokenAddress] = useState(null);
  
  const [tokenDetails, setTokenDetails] = useState({
    name: '',
    symbol: '',
    initialInvestment: '0.1'
  });

  useEffect(() => {
    loadPatentDetails();
  }, [patentId]);

  const loadPatentDetails = async () => {
    try {
      const patents = await getAllPatents();
      const currentPatent = patents.find(p => p.id.toString() === patentId);
      
      if (!currentPatent) {
        throw new Error('Patent not found');
      }

      setPatent(currentPatent);
      
      const suggestedSymbol = currentPatent.title
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 5);

      setTokenDetails(prev => ({
        ...prev,
        name: `${currentPatent.title} Token`,
        symbol: suggestedSymbol
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenize = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStep('Creating token contract...');
      
      // Use BigInt for Wei conversion
      const oneEther = BigInt('1000000000000000000'); // 1 ETH in Wei
      const investment = parseFloat(tokenDetails.initialInvestment);
      const investmentInWei = BigInt(Math.floor(investment * Number(oneEther)));
      
      const tx = await createPatentToken(
        tokenDetails.name,
        tokenDetails.symbol,
        patentId,
        { value: investmentInWei }
      );

      setCurrentStep('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      
      // Extract token address from event
      const event = receipt.events?.find(e => e.event === 'PatentTokenCreated');
      const newTokenAddress = event?.args?.tokenAddress;

      if (!newTokenAddress) {
        throw new Error('Token creation failed - no token address in event');
      }

      setTokenAddress(newTokenAddress);
      setCurrentStep('Token created successfully! Redirecting...');
      
      setTimeout(() => {
        navigate(`/trade-patent/${patentId}`);
      }, 2000);

    } catch (err) {
      console.error('Tokenization error:', err);
      setError(err.message || 'Failed to create token');
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
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            Tokenize Patent: {patent?.title}
          </h2>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Token Name
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={tokenDetails.name}
                onChange={(e) => setTokenDetails({
                  ...tokenDetails,
                  name: e.target.value
                })}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Token Symbol
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={tokenDetails.symbol}
                onChange={(e) => setTokenDetails({
                  ...tokenDetails,
                  symbol: e.target.value.toUpperCase()
                })}
                maxLength={5}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Initial Investment (ETH)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                className="w-full p-2 border rounded"
                value={tokenDetails.initialInvestment}
                onChange={(e) => setTokenDetails({
                  ...tokenDetails,
                  initialInvestment: e.target.value
                })}
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 0.1 ETH required for initial liquidity
              </p>
            </div>

            {loading && currentStep && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{currentStep}</span>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/patents')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleTokenize}
                disabled={loading || !tokenDetails.name || !tokenDetails.symbol}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Coins className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Creating Token...' : 'Tokenize Patent'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TokenizePatent;