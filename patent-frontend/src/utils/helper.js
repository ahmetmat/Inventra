import { ethers } from 'ethers';

export function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei) {
  return ethers.utils.formatEther(wei);
}

export function parseEther(ether) {
  return ethers.utils.parseEther(ether.toString());
}

export function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function calculateGasMargin(value) {
  return value.mul(120).div(100);
}

export function useContract() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
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
    }
    throw new Error('No Web3 provider found');
  };

  return { provider, signer, account, connectWallet };
}