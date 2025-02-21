// src/contracts/abis.js
export const PATENT_REGISTRY_ABI = [
  // Core functions
  "function registerPatent(string memory title, string memory ipfsHash, string memory patentId) external whenNotPaused returns (uint256)",
  "function getPatent(uint256 patentId) external view returns (string memory title, string memory ipfsHash, uint256 price, bool isForSale, address inventor, uint256 createdAt, string memory patentId, bool isVerified)",
  "function getTotalPatents() external view returns (uint256)",
  "function verifyPatent(uint256 patentId) external onlyOwner whenNotPaused",
  "function updatePatentMetadata(uint256 patentId, string memory newIpfsHash) external whenNotPaused",
  "function setPatentPrice(uint256 patentId, uint256 newPrice) external whenNotPaused",
  "function getInventorPatents(address inventor) external view returns (uint256[])",
  "function patentExists(string memory patentId) external view returns (bool)",
  
  // Owner management
  "function owner() public view returns (address)",
  "function transferOwnership(address newOwner) public onlyOwner",
  "function renounceOwnership() public onlyOwner",
  
  // Pause functionality
  "function paused() public view returns (bool)",
  "function pause() public onlyOwner whenNotPaused",
  "function unpause() public onlyOwner whenPaused",
  
  // Events
  "event PatentRegistered(uint256 indexed patentId, string title, address inventor)",
  "event PatentVerified(uint256 indexed patentId)",
  "event PatentUpdated(uint256 indexed patentId, string ipfsHash)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event Paused(address account)",
  "event Unpaused(address account)"
];

export const PATENT_FACTORY_ABI = [
  // Core functions
  "function createPatentToken(string memory name, string memory symbol, uint256 patentId) external payable returns (address)",
  "function getPatentToken(uint256 patentId) external view returns (address)",
  "function updatePatentRegistry(address newRegistry) external onlyOwner",
  "function patentRegistry() external view returns (address)",
  "function isPatentToken(address) external view returns (bool)",
  
  // Owner functions
  "function owner() external view returns (address)",
  "function transferOwnership(address newOwner) external",
  
  // Events
  "event PatentTokenCreated(uint256 indexed patentId, address tokenAddress)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
];

export const PATENT_TOKEN_ABI = [
  // Trading functions
  "function buyTokens(uint256 amount) external payable nonReentrant",
  "function sellTokens(uint256 amount) external nonReentrant",
  "function calculatePrice(uint256 amount) public view returns (uint256)",
  
  // View functions
  "function getTokenMetrics() external view returns (uint256 _currentPrice, uint256 _basePrice, uint256 _liquidityPool, uint256 _volume24h, uint256 _holdersCount, bool _isTrading)",
  "function getTradeHistory(uint256 count) external view returns (tuple(uint256 timestamp, uint256 price, uint256 volume)[])",
  "function getPatentDetails() external view returns (tuple(string title, string ipfsHash, uint256 price, bool isForSale, address inventor, uint256 createdAt, string patentId, bool isVerified))",
  "function patentDetails() external view returns (tuple(string title, string ipfsHash, uint256 price, bool isForSale, address inventor, uint256 createdAt, string patentId, bool isVerified))",
  
  // Admin functions
  "function updatePatentDetails(string memory newIpfsHash, uint256 newPrice) external onlyOwner",
  "function setPatentForSale(bool forSale) external onlyOwner",
  "function withdrawExcessLiquidity(uint256 amount) external onlyOwner",
  
  // Standard ERC20 functions
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  
  // Constants
  "function MAX_SUPPLY() external view returns (uint256)",
  "function MIN_PRICE() external view returns (uint256)",
  "function MIN_LIQUIDITY() external view returns (uint256)",
  
  // Events
  "event TokensPurchased(address indexed buyer, uint256 amount, uint256 price)",
  "event TokensSold(address indexed seller, uint256 amount, uint256 price)",
  "event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp)",
  "event LiquidityAdded(address indexed provider, uint256 amount)",
  "event LiquidityRemoved(address indexed provider, uint256 amount)",
  "event PatentDetailsUpdated(string ipfsHash, uint256 price)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const PATENT_STAKING_ABI = [
  "function stake(address patentToken, uint256 amount, string patentTitle, string imageUrl) external",
  "function unstake(uint256 tokenId) external",
  "function stakedAmount(uint256 tokenId) external view returns (uint256)",
  "function nextTokenId(address patentToken) external view returns (uint256)",
  "function getPatentTokenForNFT(uint256 tokenId) external view returns (address)",
  "event Staked(address indexed user, address indexed patentToken, uint256 amount, uint256 nftId)",
  "event Unstaked(address indexed user, address indexed patentToken, uint256 amount, uint256 nftId)"
];

// Contract addresses
export const CONTRACT_ADDRESSES = {
  PatentRegistry: "0x217B9a2139576844b3A232aBEF0D236fE894E27d",
  PatentFactory: "0xE4dBeAFa9065bD8050117387087f34adfA25BfAc",
  PatentStaking: "0x665bcC4D12a376921C23db4894f6354D1B5D3127"
};