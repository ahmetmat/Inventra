// src/hooks/useContract.js
import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { 
  PATENT_REGISTRY_ABI, 
  PATENT_FACTORY_ABI, 
  PATENT_TOKEN_ABI,
  CONTRACT_ADDRESSES 
} from '../contracts/abis';

export function useContract() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Contract instances
  const registry = useMemo(() => {
    if (provider) {
      return new ethers.Contract(
        CONTRACT_ADDRESSES.PatentRegistry,
        PATENT_REGISTRY_ABI,
        provider
      );
    }
    return null;
  }, [provider]);

  const factory = useMemo(() => {
    if (provider) {
      return new ethers.Contract(
        CONTRACT_ADDRESSES.PatentFactory,
        PATENT_FACTORY_ABI,
        provider
      );
    }
    return null;
  }, [provider]);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
      
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
      });

      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(chainId);
      });
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const web3Signer = web3Provider.getSigner();
        
        setAccount(accounts[0]);
        setSigner(web3Signer);
        return accounts[0];
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      }
    } else {
      throw new Error('No Web3 provider found');
    }
  };

  return {
    provider,
    signer,
    account,
    chainId,
    registry,
    factory,
    connectWallet
  };
}