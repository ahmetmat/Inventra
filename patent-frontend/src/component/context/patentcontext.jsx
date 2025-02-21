// patentcontext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { PinataSDK } from 'pinata-web3';
import { 
  PATENT_REGISTRY_ABI, 
  PATENT_FACTORY_ABI, 
  PATENT_STAKING_ABI,

  CONTRACT_ADDRESSES 
} from '../../contracts/abis';

const pinata = new PinataSDK({
  pinataJwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhZDIwOTZlZS1jOTMyLTQwN2EtOTJlOC1hMDMxZjcyNjAxNjkiLCJlbWFpbCI6ImV5bWVuZWZlYWx0dW4xOEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMTliMzFjMzIxOTY5NzU1ZDdjMmQiLCJzY29wZWRLZXlTZWNyZXQiOiJjOTIwNTM5MzI0NzY0NDkyYjJlYWM5NjRmODk5YjMyZDY3MzcxZWExYmE5NmE4ZWQxNzY3ZjhmNTk4MDQwMGUzIiwiZXhwIjoxNzcxNjA4MjU2fQ.ADpLzqI8ccTT3zsbzs_O8gM7MHdhbTUJlmARIrBq1Ac',
  pinataGateway: 'magenta-key-rooster-303.mypinata.cloud'
});

const PatentContext = createContext();

export const PatentProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patentFactory, setPatentFactory] = useState(null);
  const [patentRegistry, setPatentRegistry] = useState(null
    
  );

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const account = accounts[0];
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const network = await provider.getNetwork();

      const registryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PatentRegistry,
        PATENT_REGISTRY_ABI,
        signer
      );
      
      const factoryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PatentFactory,
        PATENT_FACTORY_ABI,
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

  useEffect(() => {
    if (provider && signer) {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.PatentStaking,
        PATENT_STAKING_ABI,
        signer
      );
      setStakingContract(contract);
    }
  }, [provider, signer]);

  const uploadPatent = async (file, metadata) => {
    if (!account) throw new Error('Please connect your wallet first');
    
    try {
      setLoading(true);
      
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
  
      const metadataUpload = await pinata.upload.json({
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        patentFile: fileUpload.IpfsHash,
        createdAt: new Date().toISOString(),
        creator: account,
        patentStatus: 'pending_tokenization'
      });
  
      return metadataUpload.IpfsHash;
    } catch (err) {
      console.error('IPFS upload error:', err);
      throw new Error('Failed to upload to IPFS: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPatentDetails = async (patentId) => {
    if (!patentRegistry) throw new Error('Not connected');
    
    try {
      setLoading(true);
      const patent = await patentRegistry.getPatent(patentId);
      const tokenAddress = await patentFactory.getPatentToken(patentId);
      
      return {
        id: patentId,
        title: patent[0],
        ipfsHash: patent[1],
        price: ethers.utils.formatEther(patent[2]),
        isForSale: patent[3],
        inventor: patent[4],
        createdAt: new Date(patent[5].toNumber() * 1000),
        patentId: patent[6],
        isVerified: patent[7],
        tokenAddress
      };
    } catch (err) {
      console.error('Failed to get patent details:', err);
      throw new Error('Failed to load patent details');
    } finally {
      setLoading(false);
    }
  };

  const registerPatent = async (title, ipfsHash, patentId) => {
    if (!patentRegistry || !account) throw new Error('Not connected');
    
    try {
      setLoading(true);
      const tx = await patentRegistry.registerPatent(title, ipfsHash, patentId, {
        gasLimit: 500000
      });
      const receipt = await tx.wait();
      
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
      stakeTokens,
      unstakeTokens,
      getStakedAmount,
      stakingContract,
      registerPatent,
      getPatentDetails,
      getPatentToken: async (patentId) => {
        if (!patentFactory) throw new Error('Not connected');
        return patentFactory.getPatentToken(patentId);
      },
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

const stakeTokens = async (patentToken, amount) => {
  if (!stakingContract || !account) {
    throw new Error('Staking contract not initialized or wallet not connected');
  }

  try {
    // Get the token contract
    const tokenContract = new ethers.Contract(
      patentToken,
      ['function approve(address spender, uint256 amount) external'],
      signer
    );

    // First approve staking contract
    const approvalTx = await tokenContract.approve(
      CONTRACT_ADDRESSES.PatentStaking,
      amount
    );
    await approvalTx.wait();

    // Then stake tokens
    const stakeTx = await stakingContract.stake(patentToken, amount);
    const receipt = await stakeTx.wait();

    // Get NFT ID from event
    const stakedEvent = receipt.events?.find(e => e.event === 'Staked');
    if (!stakedEvent) throw new Error('Staking failed');

    return stakedEvent.args.nftId;
  } catch (error) {
    console.error('Staking error:', error);
    throw error;
  }
};

const unstakeTokens = async (nftId) => {
  if (!stakingContract || !account) {
    throw new Error('Staking contract not initialized or wallet not connected');
  }

  try {
    const tx = await stakingContract.unstake(nftId);
    await tx.wait();
  } catch (error) {
    console.error('Unstaking error:', error);
    throw error;
  }
};

const getStakedAmount = async (nftId) => {
  if (!stakingContract) return 0;
  try {
    const amount = await stakingContract.stakedAmount(nftId);
    return amount;
  } catch (error) {
    console.error('Error getting staked amount:', error);
    return 0;
  }
};

export const usePatent = () => {
  const context = useContext(PatentContext);
  if (!context) {
    throw new Error('usePatent must be used within PatentProvider');
  }
  return context;
};