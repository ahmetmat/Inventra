import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

const PatentPreview = ({ ipfsHash }) => {
  const [patentData, setPatentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pinataGatewayUrl = "https://magenta-key-rooster-303.mypinata.cloud/ipfs/";

  useEffect(() => {
    const fetchPatentData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${pinataGatewayUrl}${ipfsHash}`);
        if (!response.ok) throw new Error('Failed to fetch patent data');
        
        const data = await response.json();
        setPatentData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching patent data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (ipfsHash) {
      fetchPatentData();
    }
  }, [ipfsHash]);

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !patentData) {
    return (
      <div className="w-full h-48 bg-gray-100 flex flex-col items-center justify-center rounded-lg">
        <FileText className="w-12 h-12 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500">Preview not available</span>
      </div>
    );
  }

  const pdfUrl = `${pinataGatewayUrl}${patentData.patentFile}`;

  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden">
      <iframe
        src={pdfUrl}
        className="w-full h-full"
        title="Patent PDF Preview"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
};

export default PatentPreview;