import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatent } from './context/patentcontext';
import { Card } from '../component/ui/card';
import { Button } from '../component/ui/button';
import { Alert } from '../component/ui/alert';
import { 
  Upload, 
  AlertCircle,
  Loader2,
  FileText,
  Trash2 
} from 'lucide-react';

const CATEGORIES = {
  TECH: 'Technology',
  MEDICAL: 'Medical',
  SOFTWARE: 'Software',
  HARDWARE: 'Hardware',
  CHEMISTRY: 'Chemistry',
  OTHER: 'Other'
};

const PatentUpload = () => {
  const { uploadPatent, registerPatent, connectWallet, account } = usePatent();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('');
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    category: '',
    customId: ''
  });

  // Load PDF.js when component mounts
  useEffect(() => {
    const loadPdfJs = async () => {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      window.pdfjsLib = pdfjsLib;
    };
    loadPdfJs();
  }, []);

  // Connect wallet on mount
  useEffect(() => {
    if (!account) {
      connectWallet().catch(err => {
        console.error('Wallet connection failed:', err);
        setError('Please connect your wallet to continue');
      });
    }
  }, [account, connectWallet]);

  const generatePDFPreview = async (file) => {
    try {
      // Load PDF.js dynamically
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      // Create array buffer from file
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      // Get the first page
      const page = await pdf.getPage(1);
      
      // Create canvas and set dimensions
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render the PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to data URL
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('PDF preview generation error:', error);
      return null;
    }
  };
  
  // Usage in handleFileChange:
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setCurrentStep('Generating preview...');
      setLoading(true);
      
      try {
        const previewUrl = await generatePDFPreview(selectedFile);
        if (previewUrl) {
          setPreview(previewUrl);
        }
      } catch (err) {
        console.error('Preview generation error:', err);
        // Still keep the file even if preview fails
        setError('Failed to generate preview, but file was uploaded successfully');
      } finally {
        setLoading(false);
        setCurrentStep('');
      }
    }
  };


  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !metadata.title || !metadata.customId) return;
  
    try {
      setLoading(true);
      setError(null);
  
      // 1. IPFS upload
      setCurrentStep('Uploading to IPFS...');
      const ipfsHash = await uploadPatent(file, metadata);
      console.log('IPFS Upload successful:', ipfsHash); // Add this
  
      // 2. Contract registration
      setCurrentStep('Registering on blockchain...');
      console.log('Registering with params:', {
        title: metadata.title,
        ipfsHash,
        customId: metadata.customId
      }); // Add this
      const patentId = await registerPatent(
        metadata.title,
        ipfsHash,
        metadata.customId
      );
  
      // 3. Success
      setCurrentStep('Upload completed!');
      setTimeout(() => {
        navigate(`/tokenize-patent/${patentId}`);
      }, 2000);
  
  
    } catch (err) {
      console.error('Upload error details:', {
        message: err.message,
        code: err.code,
        data: err.data
      }); // Add this
      setError(err.message);
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Upload Patent</h2>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              <label 
                htmlFor="file-upload" 
                className={`cursor-pointer block ${loading ? 'opacity-50' : ''}`}
              >
                {preview ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-48 mb-4 object-contain"
                    />
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm text-gray-500">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          clearFile();
                        }}
                        className="ml-2"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-gray-500">
                      Click to upload PDF
                    </span>
                  </div>
                )}
              </label>
            </div>

            {/* Metadata Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Patent Title
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={metadata.title}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    title: e.target.value
                  })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={4}
                  value={metadata.description}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    description: e.target.value
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={metadata.category}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    category: e.target.value
                  })}
                  required
                >
                  <option value="">Select Category</option>
                  {Object.entries(CATEGORIES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Custom Patent ID
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={metadata.customId}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    customId: e.target.value
                  })}
                  placeholder="e.g., PAT2024-001"
                  required
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{currentStep}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/patents')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!file || !metadata.title || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Processing...' : 'Upload Patent'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default PatentUpload;