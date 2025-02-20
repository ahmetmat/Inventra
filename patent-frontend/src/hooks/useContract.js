// src/hooks/useContract.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { PATENT_REGISTRY_ABI } from '../contracts/abis';

export function useContract() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [registry, setRegistry] = useState(null);
  const [chainId, setChainId] = useState(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const account = accounts[0];
      setAccount(account);

      // Get the provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get the network
      const network = await provider.getNetwork();
      setChainId(network.chainId);

      // Create contract instance
      const registryContract = new ethers.Contract(
        '0xYourContractAddress', // Replace with your contract address
        PATENT_REGISTRY_ABI,
        signer
      );

      setProvider(provider);
      setSigner(signer);
      setRegistry(registryContract);

      return true;
    } catch (err) {
      console.error("Connection error:", err);
      return false;
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      // Handle account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
      });

      // Handle chain changes
      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      });

      // Try to connect on initial load
      connectWallet();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return {
    provider,
    signer,
    account,
    registry,
    chainId,
    connectWallet
  };
}