// patentcontext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { PinataSDK } from 'pinata-web3';

const pinata = new PinataSDK({
  pinataJwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhZDIwOTZlZS1jOTMyLTQwN2EtOTJlOC1hMDMxZjcyNjAxNjkiLCJlbWFpbCI6ImV5bWVuZWZlYWx0dW4xOEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMTliMzFjMzIxOTY5NzU1ZDdjMmQiLCJzY29wZWRLZXlTZWNyZXQiOiJjOTIwNTM5MzI0NzY0NDkyYjJlYWM5NjRmODk5YjMyZDY3MzcxZWExYmE5NmE4ZWQxNzY3ZjhmNTk4MDQwMGUzIiwiZXhwIjoxNzcxNjA4MjU2fQ.ADpLzqI8ccTT3zsbzs_O8gM7MHdhbTUJlmARIrBq1Ac',
  pinataGateway: 'aquamarine-total-swift-154.mypinata.cloud'
});

const PatentContext = createContext();

export const PatentProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patentFactory, setPatentFactory] = useState(null);
  const [patentRegistry, setPatentRegistry] = useState(null);

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const account = accounts[0];
      
      // Use Web3Provider instead of BrowserProvider for ethers v5
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get the network
      const network = await provider.getNetwork();

      // Create contract instances
      const registryContract = new ethers.Contract(
        'YOUR_REGISTRY_ADDRESS',
        [
          'function registerPatent(string,string,string) returns (uint256)',
          'function getPatent(uint256) returns (tuple(string,string,uint256,bool,address,uint256,string,bool))',
          'function getTotalPatents() returns (uint256)'
        ],
        signer
      );

      const factoryContract = new ethers.Contract(
        'YOUR_FACTORY_ADDRESS',
        [
          'function createPatentToken(string,string,uint256) payable returns (address)',
          'function getPatentToken(uint256) returns (address)'
        ],
        signer
      );

      setAccount(account);
      setPatentRegistry(registryContract);
      setPatentFactory(factoryContract);
      setError(null);

      return true;
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadPatent = async (file, metadata) => {
    if (!account) throw new Error('Please connect your wallet first');
    
    try {
      setLoading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file to IPFS
      const fileUpload = await pinata.upload.file(file, {
        pinataMetadata: {
          name: metadata.title,
          keyvalues: {
            title: metadata.title,
            description: metadata.description,
            category: metadata.category,
            createdAt: new Date().toISOString()
          }
        }
      });

      // Upload metadata
      const metadataUpload = await pinata.upload.json({
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        patentFile: fileUpload.IpfsHash,
        createdAt: new Date().toISOString()
      });

      return metadataUpload.IpfsHash;
    } catch (err) {
      console.error('IPFS upload error:', err);
      throw new Error('Failed to upload to IPFS: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const registerPatent = async (title, ipfsHash, patentId) => {
    if (!patentRegistry || !account) throw new Error('Not connected');
    
    try {
      setLoading(true);
      const tx = await patentRegistry.registerPatent(title, ipfsHash, patentId, {
        gasLimit: 500000 // Add gas limit to prevent transaction failures
      });
      const receipt = await tx.wait();
      
      // Get patentId from event
      const event = receipt.events?.find(e => e.event === 'PatentRegistered');
      if (!event) throw new Error('Patent registration failed');
      
      return event.args.patentId.toString();
    } catch (err) {
      console.error('Patent registration error:', err);
      throw new Error('Failed to register patent: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Setup event listeners for wallet
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          setPatentRegistry(null);
          setPatentFactory(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      // Initial connection attempt
      connectWallet();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  return (
    <PatentContext.Provider value={{
      account,
      loading,
      error,
      connectWallet,
      uploadPatent,
      registerPatent,
      createPatentToken: async (...args) => {
        if (!patentFactory) throw new Error('Not connected');
        return patentFactory.createPatentToken(...args);
      },
      getAllPatents: async () => {
        if (!patentRegistry) throw new Error('Not connected');
        const totalPatents = await patentRegistry.getTotalPatents();
        const patents = [];
        
        for (let i = 1; i <= totalPatents; i++) {
          try {
            const patent = await patentRegistry.getPatent(i);
            const tokenAddress = await patentFactory.getPatentToken(i);
            
            patents.push({
              id: i,
              title: patent[0],
              ipfsHash: patent[1],
              price: patent[2],
              isForSale: patent[3],
              inventor: patent[4],
              createdAt: patent[5],
              patentId: patent[6],
              isVerified: patent[7],
              tokenAddress
            });
          } catch (err) {
            console.error(`Error fetching patent ${i}:`, err);
          }
        }
        
        return patents;
      },
      patentFactory,
      patentRegistry
    }}>
      {children}
    </PatentContext.Provider>
  );
};

export const usePatent = () => {
  const context = useContext(PatentContext);
  if (!context) {
    throw new Error('usePatent must be used within PatentProvider');
  }
  return context;
};