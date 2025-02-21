import React, { useState } from 'react';
import { usePatent } from './context/patentcontext';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Loader2, Shield } from 'lucide-react';

const StakeModal = ({ patent, isOpen, onClose }) => {
  const { stakeTokens } = usePatent();
  const [amount, setAmount] = useState('1000'); // Default to minimum amount
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleStake = async () => {
    if (!amount || !patent) {
      setError('Invalid input parameters');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1000) {
      setError('Minimum stake amount is 1000 tokens');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Staking tokens...', {
        patentId: patent.id,
        tokenAddress: patent.tokenAddress,
        amount: parsedAmount
      });

      const tokenId = await stakeTokens(
        patent.id,
        patent.tokenAddress,
        parsedAmount
      );

      console.log('Staking successful, token ID:', tokenId);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setAmount('1000');
      }, 2000);
    } catch (err) {
      console.error('Staking error:', err);
      setError(err.message || 'Failed to stake tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {success ? 'Staking Successful!' : 'Stake Tokens to Get NFT'}
          </DialogTitle>
          <DialogDescription>
            {success 
              ? 'Your NFT has been minted and sent to your wallet.'
              : `Stake 1000 or more tokens of ${patent?.title || ''} to receive the patent NFT in your wallet.`
            }
          </DialogDescription>
        </DialogHeader>

        {!success && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Stake Amount
              </label>
              <input
                type="number"
                min="1000"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter amount (min. 1000)"
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="p-3">
                {error}
              </Alert>
            )}

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>You will receive a patent NFT after staking</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!success && (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleStake} 
                disabled={loading || !amount || parseFloat(amount) < 1000}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Staking...
                  </>
                ) : (
                  'Stake & Get NFT'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StakeModal;