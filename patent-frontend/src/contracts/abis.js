// src/contracts/abis.js
export const PATENT_REGISTRY_ABI = [
    "function registerPatent(string memory title, string memory ipfsHash, string memory patentId) external returns (uint256)",
    "function getPatent(uint256 patentId) external view returns (string memory title, string memory ipfsHash, uint256 price, bool isForSale, address inventor, uint256 createdAt, string memory patentId, bool isVerified)",
    "function getTotalPatents() external view returns (uint256)",
    "function verifyPatent(uint256 patentId) external",
    "event PatentRegistered(uint256 indexed patentId, string title, address inventor)"
  ];
  
  export const PATENT_FACTORY_ABI = [
    "function createPatentToken(string memory name, string memory symbol, uint256 patentId) external payable returns (address)",
    "function getPatentToken(uint256 patentId) external view returns (address)",
    "event PatentTokenCreated(uint256 indexed patentId, address tokenAddress)"
  ];
  
  export const PATENT_TOKEN_ABI = [
    "function buyTokens(uint256 amount) external payable",
    "function sellTokens(uint256 amount) external",
    "function calculatePrice(uint256 amount) public view returns (uint256)",
    "function getTokenMetrics() external view returns (uint256 _currentPrice, uint256 _basePrice, uint256 _liquidityPool, uint256 _volume24h, uint256 _holdersCount, bool _isTrading)",
    "function getTradeHistory(uint256 count) external view returns (tuple(uint256 timestamp, uint256 price, uint256 volume)[])",
    "event TokensPurchased(address indexed buyer, uint256 amount, uint256 price)",
    "event TokensSold(address indexed seller, uint256 amount, uint256 price)"
  ];
  
  // Contract addresses
  export const CONTRACT_ADDRESSES = {
    PatentRegistry: "YOUR_REGISTRY_ADDRESS",
    PatentFactory: "YOUR_FACTORY_ADDRESS"
  };