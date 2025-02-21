import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

const PDFPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load PDF.js script and worker
    const loadPdfJs = async () => {
      // Load main PDF.js script
      const pdfJsScript = document.createElement('script');
      pdfJsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      document.head.appendChild(pdfJsScript);

      return new Promise((resolve) => {
        pdfJsScript.onload = async () => {
          // After main script loads, set worker
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjsLib);
        };
      });
    };

    const loadPreview = async () => {
      try {
        if (!url) return;

        // Load PDF.js if not already loaded
        const pdfjsLib = window['pdfjs-dist/build/pdf'] || await loadPdfJs();

        // Fetch and process PDF
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const typedarray = new Uint8Array(arrayBuffer);

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

        setPreview(canvas.toDataURL('image/jpeg', 0.8));
      } catch (error) {
        console.error('PDF preview generation error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    // Cleanup function
    return () => {
      // Remove script if it exists
      const script = document.querySelector('script[src*="pdf.min.js"]');
      if (script) {
        script.remove();
      }
    };
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded shadow">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return preview ? (
    <div className="relative w-full h-48 rounded shadow overflow-hidden">
      <img 
        src={preview}
        alt="PDF Preview"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
    </div>
  ) : (
    <div className="w-full h-48 bg-gray-100 flex flex-col items-center justify-center rounded shadow">
      <FileText className="w-12 h-12 text-gray-400 mb-2" />
      <span className="text-sm text-gray-500">Preview not available</span>
    </div>
  );
};

export default PDFPreview;