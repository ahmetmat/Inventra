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
  const [patentRegistry, setPatentRegistry] = useState(null);
  const [patentStaking, setPatentStaking] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [stakedTokens, setStakedTokens] = useState({});

  // Initialize provider
  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
    }
  }, []);

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
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      
      // Initialize contracts first
      const registryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PatentRegistry,
        PATENT_REGISTRY_ABI,
        web3Signer
      );
      
      const factoryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PatentFactory,
        PATENT_FACTORY_ABI,
        web3Signer
      );
  
      const stakingContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PatentStaking,
        PATENT_STAKING_ABI,
        web3Signer
      );
  
      // Set all contract and connection states
      setAccount(account);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setPatentRegistry(registryContract);
      setPatentFactory(factoryContract);
      setPatentStaking(stakingContract);
  
      // Only load staked tokens after contracts are initialized
      setTimeout(async () => {
        try {
          await loadStakedTokens(stakingContract, account);
        } catch (err) {
          console.error('Failed to load staked tokens:', err);
          // Don't throw here, just log the error
        }
      }, 100);
  
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
  
  const loadStakedTokens = async (stakingContract, userAddress) => {
    if (!patentRegistry || !patentFactory) {
      console.log('Contracts not yet initialized, skipping staked tokens load');
      return;
    }
  
    try {
      const patents = await getAllPatents();
      const stakedInfo = {};
  
      for (const patent of patents) {
        if (patent.tokenAddress !== ethers.constants.AddressZero) {
          const tokenId = await stakingContract.nextTokenId(patent.tokenAddress);
          for (let i = 0; i < tokenId; i++) {
            try {
              const owner = await stakingContract.ownerOf(i);
              if (owner.toLowerCase() === userAddress.toLowerCase()) {
                const amount = await stakingContract.stakedAmount(i);
                stakedInfo[patent.id] = {
                  tokenId: i,
                  amount: ethers.utils.formatEther(amount)
                };
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
  
      setStakedTokens(stakedInfo);
    } catch (error) {
      console.error('Error loading staked tokens:', error);
      // Don't throw, just log the error
    }
  };

  const stakeTokens = async (patentId, tokenAddress, amount, ipfsHash) => {
    try {
      if (!patentStaking || !account) {
        throw new Error('Contracts not initialized or wallet not connected');
      }
  
      setLoading(true);
      setError('');
  
      console.log('Starting stake process with:', {
        patentId,
        tokenAddress,
        amount,
        ipfsHash
      });
  
      // Token approval
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) external returns (bool)'],
        signer
      );
  
      const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
  
      console.log('Approving tokens...');
      const approveTx = await tokenContract.approve(
        CONTRACT_ADDRESSES.PatentStaking,
        amountWei,
        { gasLimit: 100000 }
      );
      await approveTx.wait();
  
      console.log('Staking tokens with IPFS hash:', ipfsHash);
      const stakeTx = await patentStaking.stake(
        tokenAddress,
        amountWei,
        ipfsHash, // Doğrudan IPFS hash'i gönderiyoruz
        { gasLimit: 500000 }
      );
      
      const receipt = await stakeTx.wait();
      const event = receipt.events?.find(e => e.event === 'Staked');
      if (!event) throw new Error('Staking event not found in transaction receipt');
  
      const tokenId = event.args.nftId;
  
      setStakedTokens(prev => ({
        ...prev,
        [patentId]: {
          tokenId: tokenId.toString(),
          amount: ethers.utils.formatEther(amountWei)
        }
      }));
  
      return tokenId;
    } catch (err) {
      console.error('Staking error:', err);
      throw new Error(`Failed to stake tokens: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const unstakeTokens = async (patentId, tokenId) => {
    if (!patentStaking || !account) throw new Error('Not connected');
    
    try {
      setLoading(true);

      const tx = await patentStaking.unstake(tokenId);
      await tx.wait();

      setStakedTokens(prev => {
        const newState = { ...prev };
        delete newState[patentId];
        return newState;
      });

    } catch (err) {
      console.error('Unstaking error:', err);
      throw new Error('Failed to unstake tokens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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

 /// Updated registerPatent function in patentcontext.jsx
// Updated registerPatent function in patentcontext.jsx
const registerPatent = async (title, ipfsHash, patentId) => {
  if (!patentRegistry || !account) throw new Error('Not connected');
  
  try {
    setLoading(true);
    console.log('Starting patent registration with:', { title, ipfsHash, patentId });

    // Get current network to ensure we're on the right chain
    const network = await provider.getNetwork();
    console.log('Current network:', network.chainId);

    // Get current gas price
    const gasPrice = await provider.getGasPrice();
    console.log('Current gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');

    // Check account balance
    const balance = await provider.getBalance(account);
    console.log('Account balance:', ethers.utils.formatEther(balance), 'ETH');

    // Prepare transaction parameters
    const tx = await patentRegistry.populateTransaction.registerPatent(
      title,
      ipfsHash,
      patentId
    );

    // Estimate gas with the actual parameters
    let gasLimit;
    try {
      gasLimit = await provider.estimateGas({
        from: account,
        to: CONTRACT_ADDRESSES.PatentRegistry,
        data: tx.data
      });
      
      // Add 30% buffer to gas estimate
      gasLimit = gasLimit.mul(130).div(100);
      console.log('Estimated gas limit:', gasLimit.toString());
    } catch (gasError) {
      console.error('Gas estimation failed:', gasError);
      throw new Error('Transaction would fail - please check your inputs and account balance');
    }

    // Send transaction with explicit parameters
    const transaction = await patentRegistry.registerPatent(
      title,
      ipfsHash,
      patentId,
      {
        from: account,
        gasLimit,
        gasPrice: gasPrice.mul(120).div(100), // Add 20% to current gas price
        nonce: await provider.getTransactionCount(account, 'latest')
      }
    );

    console.log('Transaction sent:', transaction.hash);

    // Wait for confirmation with timeout
    const receipt = await Promise.race([
      transaction.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)
      )
    ]);

    console.log('Transaction confirmed:', receipt);

    // Verify the transaction was successful
    if (receipt.status === 0) {
      throw new Error('Transaction failed during execution');
    }

    // Get event from receipt
    const event = receipt.events?.find(e => e.event === 'PatentRegistered');
    if (!event) {
      throw new Error('Patent registration event not found in receipt');
    }

    return event.args.patentId.toString();

  } catch (err) {
    console.error('Patent registration error:', {
      message: err.message,
      code: err.code,
      data: err.data,
      transaction: err.transaction
    });

    // Enhanced error messages based on specific error conditions
    if (err.code === -32603) {
      const balance = await provider.getBalance(account);
      if (balance.lt(ethers.utils.parseEther('0.01'))) {
        throw new Error('Insufficient funds - please add more ETH to your wallet');
      } else {
        throw new Error('Transaction failed - please try again with higher gas price');
      }
    } else if (err.message.includes('user rejected')) {
      throw new Error('Transaction was rejected in wallet');
    } else {
      throw new Error(`Failed to register patent: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
};
  const getAllPatents = async () => {
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
  };

  // Setup event listeners for wallet
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          connectWallet();
        } else {
          setAccount(null);
          setPatentRegistry(null);
          setPatentFactory(null);
          setPatentStaking(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
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
      provider,
      signer,
      connectWallet,
      uploadPatent,
      registerPatent,
      stakeTokens,
      unstakeTokens,
      stakedTokens,
      createPatentToken: async (...args) => {
        if (!patentFactory) throw new Error('Not connected');
        return patentFactory.createPatentToken(...args);
      },
      getPatentDetails: async (id) => {
        if (!patentRegistry) throw new Error('Not connected');
        const patent = await patentRegistry.getPatent(id);
        const tokenAddress = await patentFactory.getPatentToken(id);
        
        return {
          id,
          title: patent[0],
          ipfsHash: patent[1],
          price: patent[2],
          isForSale: patent[3],
          inventor: patent[4],
          createdAt: patent[5],
          patentId: patent[6],
          isVerified: patent[7],
          tokenAddress
        };
      },
      getAllPatents,
      patentFactory,
      patentRegistry,
      patentStaking
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