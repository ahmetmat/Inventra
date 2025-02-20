import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

const PDFPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const loadPDFPreview = async () => {
      try {
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

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
      }
    };

    if (url) {
      loadPDFPreview();
    }
  }, [url]);

  return preview ? (
    <img 
      src={preview}
      alt="PDF Preview"
      className="w-full h-48 object-cover rounded shadow"
    />
  ) : (
    <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded shadow">
      <FileText className="w-12 h-12 text-gray-400" />
    </div>
  );
};

export default PDFPreview;