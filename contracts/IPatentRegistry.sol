// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPatentRegistry {
    function getPatent(uint256 Pid) external view returns (
        string memory title,
        string memory ipfsHash,
        uint256 price,
        bool isForSale,
        address inventor,
        uint256 createdAt,
        string memory patentId,
        bool isVerified
    );
}

contract PatentRegistry is IPatentRegistry {
    // Custom Owner implementation
    address private _owner;
    bool private _paused;
    
    struct Patent {
        string title;
        string ipfsHash;
        uint256 price;
        bool isForSale;
        address inventor;
        uint256 createdAt;
        string patentId;
        bool isVerified;
    }
    
    uint256 private nextPatentId = 1;
    mapping(uint256 => Patent) private _patents;
    mapping(string => bool) private _patentIdExists;
    mapping(address => uint256[]) private _inventorPatents;
    
    // Events
    event PatentRegistered(uint256 indexed patentId, string title, address inventor);
    event PatentVerified(uint256 indexed patentId);
    event PatentUpdated(uint256 indexed patentId, string ipfsHash);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);
    
    // Custom modifiers
    modifier onlyOwner() {
        require(msg.sender == _owner, "Caller is not the owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!_paused, "Contract is paused");
        _;
    }
    
    modifier whenPaused() {
        require(_paused, "Contract is not paused");
        _;
    }
    
    constructor() {
        _owner = msg.sender;
        _paused = false;
    }
    
    // Owner management functions
    function owner() public view returns (address) {
        return _owner;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }
    
    // Pausable functions
    function paused() public view returns (bool) {
        return _paused;
    }
    
    function pause() public onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() public onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }
    
    // Patent management functions
    function registerPatent(
        string memory title,
        string memory ipfsHash,
        string memory patentId
    ) external whenNotPaused returns (uint256) {
        require(!_patentIdExists[patentId], "Patent ID already exists");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        uint256 newPatentId = nextPatentId;
        nextPatentId++;
        
        _patents[newPatentId] = Patent({
            title: title,
            ipfsHash: ipfsHash,
            price: 0,
            isForSale: false,
            inventor: msg.sender,
            createdAt: block.timestamp,
            patentId: patentId,
            isVerified: false
        });
        
        _patentIdExists[patentId] = true;
        _inventorPatents[msg.sender].push(newPatentId);
        
        emit PatentRegistered(newPatentId, title, msg.sender);
        return newPatentId;
    }
    
    function verifyPatent(uint256 patentId) external onlyOwner whenNotPaused {
        require(_patents[patentId].inventor != address(0), "Patent does not exist");
        require(!_patents[patentId].isVerified, "Patent already verified");
        
        _patents[patentId].isVerified = true;
        emit PatentVerified(patentId);
    }
    
    function updatePatentMetadata(
        uint256 patentId,
        string memory newIpfsHash
    ) external whenNotPaused {
        require(_patents[patentId].inventor == msg.sender, "Not the patent owner");
        require(bytes(newIpfsHash).length > 0, "IPFS hash cannot be empty");
        
        _patents[patentId].ipfsHash = newIpfsHash;
        emit PatentUpdated(patentId, newIpfsHash);
    }
    
    function setPatentPrice(uint256 patentId, uint256 newPrice) external whenNotPaused {
        require(_patents[patentId].inventor == msg.sender, "Not the patent owner");
        require(_patents[patentId].isVerified, "Patent not verified");
        
        _patents[patentId].price = newPrice;
        _patents[patentId].isForSale = newPrice > 0;
    }
    
    function getPatent(uint256 patentId) external view override returns (
        string memory title,
        string memory ipfsHash,
        uint256 price,
        bool isForSale,
        address inventor,
        uint256 createdAt,
        string memory patentIdStr,
        bool isVerified
    ) {
        Patent storage patent = _patents[patentId];
        require(patent.inventor != address(0), "Patent does not exist");
        
        return (
            patent.title,
            patent.ipfsHash,
            patent.price,
            patent.isForSale,
            patent.inventor,
            patent.createdAt,
            patent.patentId,
            patent.isVerified
        );
    }
    
    function getInventorPatents(address inventor) external view returns (uint256[] memory) {
        return _inventorPatents[inventor];
    }
    
    function patentExists(string memory patentId) external view returns (bool) {
        return _patentIdExists[patentId];
    }
    
    function getTotalPatents() external view returns (uint256) {
        return nextPatentId - 1;
    }
}