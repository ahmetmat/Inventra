import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../component/ui/card";
import { Button } from "../component/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../component/ui/alert";
import { Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, PATENT_REGISTRY_ABI } from '../contracts/abis';

const CATEGORIES = {
  TECH: 'Technology',
  MEDICAL: 'Medical',
  SOFTWARE: 'Software',
  HARDWARE: 'Hardware',
  CHEMICAL: 'Chemical',
  MECHANICAL: 'Mechanical',
  OTHER: 'Other'
};

export default function PatentUpload() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('');

  const [patentMetadata, setPatentMetadata] = useState({
    title: '',
    description: '',
    category: '',
    keywords: []
  });

  const generatePDFPreview = async (file) => {
    const pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const page = await pdf.getPage(1);
          
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      try {
        const previewImage = await generatePDFPreview(file);
        setPreview(previewImage);
      } catch (err) {
        setError('Could not generate PDF preview');
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError(null);
      setCurrentStep('Preparing files...');

      // IPFS'e yükleme simülasyonu
      setCurrentStep('Uploading to IPFS...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockIpfsHash = 'QmXgZh7QdQweR' + Math.random().toString(36).substr(2, 9);

      setCurrentStep('Registering patent on blockchain...');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.PatentRegistry,
        PATENT_REGISTRY_ABI,
        signer
      );

      const tx = await contract.registerPatent(
        patentMetadata.title,
        mockIpfsHash,
        Date.now().toString()
      );
      await tx.wait();

      setCurrentStep('Patent registration complete!');
      setTimeout(() => {
        navigate('/patents');
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register patent');
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <CardTitle className="text-2xl">Patent Registration</CardTitle>
        <CardDescription className="text-gray-200">Register your patent on the blockchain</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            id="patent-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="patent-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            {preview ? (
              <div className="max-w-md mx-auto">
                <img
                  src={preview}
                  alt="Patent Preview"
                  className="max-h-48 object-contain rounded shadow-lg"
                />
                <p className="mt-2 text-sm text-gray-600">{selectedFile.name}</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mb-2 text-blue-600" />
                <span className="text-gray-700 font-medium">
                  Click to upload patent document (PDF)
                </span>
              </>
            )}
          </label>
        </div>

        {/* Metadata Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={patentMetadata.title}
              onChange={(e) => setPatentMetadata(prev => ({
                ...prev,
                title: e.target.value
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={patentMetadata.category}
              onChange={(e) => setPatentMetadata(prev => ({
                ...prev,
                category: e.target.value
              }))}
            >
              <option value="">Select a category</option>
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={4}
              value={patentMetadata.description}
              onChange={(e) => setPatentMetadata(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Keywords</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Enter keywords separated by commas"
              onChange={(e) => setPatentMetadata(prev => ({
                ...prev,
                keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
              }))}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center space-x-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">{currentStep}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || !patentMetadata.title || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Processing...' : 'Register Patent'}
        </Button>
      </CardContent>
    </Card>
  );
}
