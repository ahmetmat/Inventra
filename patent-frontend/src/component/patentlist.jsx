import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatent } from './context/patentcontext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { FileText, Shield, Clock, DollarSign, TrendingUp } from 'lucide-react';

const PatentList = () => {
  const { getAllPatents, loading: contextLoading, error: contextError } = usePatent();
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadPatents();
  }, [filter]);

  const loadPatents = async () => {
    try {
      setLoading(true);
      const allPatents = await getAllPatents();
      
      // Filtreleme
      const filtered = allPatents.filter(patent => {
        if (filter === 'verified') return patent.isVerified;
        if (filter === 'tokenized') return patent.tokenAddress !== '0x0000000000000000000000000000000000000000';
        return true;
      });

      setPatents(filtered);
      setError(null);
    } catch (err) {
      console.error('Failed to load patents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Patents</h2>
        <Button onClick={() => navigate('/upload-patent')}>Upload New Patent</Button>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Patents
        </Button>
        <Button
          variant={filter === 'verified' ? 'default' : 'outline'}
          onClick={() => setFilter('verified')}
        >
          Verified Only
        </Button>
        <Button
          variant={filter === 'tokenized' ? 'default' : 'outline'}
          onClick={() => setFilter('tokenized')}
        >
          Tokenized
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patents.map(patent => (
          <Card key={patent.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-lg">{patent.title}</h3>
                <p className="text-sm text-gray-500">ID: {patent.patentId}</p>
              </div>
              {patent.isVerified ? (
                <Shield className="text-green-500" />
              ) : (
                <Clock className="text-yellow-500" />
              )}
            </div>

            <div className="text-sm text-gray-500 mb-4">
              Created: {new Date(patent.createdAt * 1000).toLocaleDateString()}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(
                  `https://aquamarine-total-swift-154.mypinata.cloud/ipfs/${patent.ipfsHash}`,
                  '_blank'
                )}
              >
                <FileText className="w-4 h-4 mr-1" />
                View
              </Button>

              {patent.tokenAddress === '0x0000000000000000000000000000000000000000' ? (
                patent.isVerified && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/tokenize-patent/${patent.id}`)}
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Tokenize
                  </Button>
                )
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate(`/trade-patent/${patent.id}`)}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Trade
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PatentList;