// src/components/PatentList.jsx
import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { formatDate, formatAddress } from '../utils/helper';

export default function PatentList({ onSelectPatent }) {
  const { registry, account } = useContract();
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPatents = async () => {
    if (!registry) return;
    
    try {
      setLoading(true);
      const totalPatents = await registry.getTotalPatents();
      const patentPromises = [];

      for (let i = 1; i <= totalPatents.toNumber(); i++) {
        patentPromises.push(registry.getPatent(i));
      }

      const patentData = await Promise.all(patentPromises);
      const formattedPatents = patentData.map((patent, index) => ({
        id: index + 1,
        title: patent.title,
        ipfsHash: patent.ipfsHash,
        price: patent.price,
        isForSale: patent.isForSale,
        inventor: patent.inventor,
        createdAt: formatDate(patent.createdAt.toNumber()),
        patentId: patent.patentId,
        isVerified: patent.isVerified
      }));

      setPatents(formattedPatents);
    } catch (error) {
      console.error('Failed to load patents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (registry) {
      loadPatents();
    }
  }, [registry]);

  if (loading) {
    return <div>Loading patents...</div>;
  }

  return (
    <div className="grid gap-4 p-4">
      {patents.map((patent) => (
        <div
          key={patent.id}
          className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          onClick={() => onSelectPatent(patent)}
        >
          <h3 className="text-xl font-bold">{patent.title}</h3>
          <div className="mt-2 space-y-1">
            <p>Inventor: {formatAddress(patent.inventor)}</p>
            <p>Created: {patent.createdAt}</p>
            <p>Status: {patent.isVerified ? 'Verified' : 'Pending'}</p>
            {patent.isForSale && (
              <p className="text-green-600">Available for Sale</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}