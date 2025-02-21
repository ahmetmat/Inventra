import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatent } from './context/patentcontext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import PDFPreview from './PDFPreview';
import StakeModal from './StakeModal';
import PatentPreview from './PatentPreview';

import { 
  FileText, 
  Shield, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Loader2,
  LockKeyhole 
} from 'lucide-react';

const PatentList = () => {
  const { 
    getAllPatents, 
    loading: contextLoading, 
    error: contextError, 
    account, 
    connectWallet,
    stakedTokens 
  } = usePatent();
  
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedPatent, setSelectedPatent] = useState(null);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        if (!account) {
          await connectWallet();
        }
      } catch (err) {
        console.error('Wallet connection failed:', err);
        setError('Please connect your wallet to view patents');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (account) {
      loadPatents();
    }
  }, [account, filter]);

  const handleViewPatent = async (patent) => {
    try {
      // Önce patent'in metadata'sını çekiyoruz
      const response = await fetch(`https://magenta-key-rooster-303.mypinata.cloud/ipfs/${patent.ipfsHash}`);
      const metadata = await response.json();
      // metadata içindeki patentFile değerini kullanarak PDF URL'sini oluşturuyoruz
      const pdfUrl = `https://magenta-key-rooster-303.mypinata.cloud/ipfs/${metadata.patentFile}`;
      
      // Yeni sekmede PDF'i açıyoruz
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error('Error opening patent:', err);
    }
  };

  const loadPatents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allPatents = await getAllPatents();
      
      const filtered = allPatents.filter(patent => {
        if (filter === 'verified') return patent.isVerified;
        if (filter === 'tokenized') return patent.tokenAddress !== '0x0000000000000000000000000000000000000000';
        return true;
      });

      setPatents(filtered);
    } catch (err) {
      console.error('Failed to load patents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStakeClick = (patent) => {
    setSelectedPatent(patent);
    setIsStakeModalOpen(true);
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-bold mb-4">Connect Wallet to View Patents</h2>
        <Button onClick={connectWallet}>Connect Wallet</Button>
      </div>
    );
  }

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Patents</h2>
        <Button onClick={() => navigate('/upload-patent')}>Upload New Patent</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{error}</span>
        </Alert>
      )}

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
            {/* PDF Preview */}
            <div className="mb-4">
            <PatentPreview ipfsHash={patent.ipfsHash} /></div>

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
  onClick={() => handleViewPatent(patent)}
>
  <FileText className="w-4 h-4 mr-1" />
  View
</Button>

              {patent.tokenAddress !== '0x0000000000000000000000000000000000000000' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/trade-patent/${patent.id}`)}
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Trade
                  </Button>
                  
                  {!stakedTokens[patent.id] ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStakeClick(patent)}
                    >
                      <LockKeyhole className="w-4 h-4 mr-1" />
                      Use
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      In Use
                    </Button>
                  )}
                </>
              )}

              {patent.tokenAddress === '0x0000000000000000000000000000000000000000' && patent.isVerified && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/tokenize-patent/${patent.id}`)}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Tokenize
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedPatent && (
        <StakeModal
          patent={selectedPatent}
          isOpen={isStakeModalOpen}
          onClose={() => {
            setIsStakeModalOpen(false);
            setSelectedPatent(null);
          }}
        />
      )}
    </div>
  );
};

export default PatentList;