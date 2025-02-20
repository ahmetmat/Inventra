// IPatentRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPatentRegistry {
    function getPatent(uint256 patentId) external view returns (
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

// PatentRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PatentRegistry is IPatentRegistry, Ownable, Pausable {
    using Counters for Counters.Counter;
    
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
    
    Counters.Counter private _patentIds;
    mapping(uint256 => Patent) private _patents;
    mapping(string => bool) private _patentIdExists;
    mapping(address => uint256[]) private _inventorPatents;
    
    event PatentRegistered(uint256 indexed patentId, string title, address inventor);
    event PatentVerified(uint256 indexed patentId);
    event PatentUpdated(uint256 indexed patentId, string ipfsHash);
    
    constructor() Ownable(msg.sender) {}
    
    function registerPatent(
        string memory title,
        string memory ipfsHash,
        string memory patentId
    ) external returns (uint256) {
        require(!_patentIdExists[patentId], "Patent ID already exists");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        _patentIds.increment();
        uint256 newPatentId = _patentIds.current();
        
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
    
    function verifyPatent(uint256 patentId) external onlyOwner {
        require(_patents[patentId].inventor != address(0), "Patent does not exist");
        require(!_patents[patentId].isVerified, "Patent already verified");
        
        _patents[patentId].isVerified = true;
        emit PatentVerified(patentId);
    }
    
    function updatePatentMetadata(
        uint256 patentId,
        string memory newIpfsHash
    ) external {
        require(_patents[patentId].inventor == msg.sender, "Not the patent owner");
        _patents[patentId].ipfsHash = newIpfsHash;
        emit PatentUpdated(patentId, newIpfsHash);
    }
    
    function getPatent(uint256 patentId) external view override returns (
        string memory title,
        string memory ipfsHash,
        uint256 price,
        bool isForSale,
        address inventor,
        uint256 createdAt,
        string memory patentId,
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
}

// PatentFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PatentToken.sol";

contract PatentFactory is Ownable {
    address public patentRegistry;
    mapping(uint256 => address) public patentTokens;
    mapping(address => bool) public isPatentToken;
    
    event PatentTokenCreated(uint256 indexed patentId, address tokenAddress);
    
    constructor(address _patentRegistry) Ownable(msg.sender) {
        patentRegistry = _patentRegistry;
    }
    
    function createPatentToken(
        string memory name,
        string memory symbol,
        uint256 patentId
    ) external payable returns (address) {
        require(patentTokens[patentId] == address(0), "Token already exists for patent");
        
        PatentToken newToken = new PatentToken{value: msg.value}(
            name,
            symbol,
            patentRegistry,
            patentId,
            msg.sender
        );
        
        address tokenAddress = address(newToken);
        patentTokens[patentId] = tokenAddress;
        isPatentToken[tokenAddress] = true;
        
        emit PatentTokenCreated(patentId, tokenAddress);
        return tokenAddress;
    }
    
    function getPatentToken(uint256 patentId) external view returns (address) {
        return patentTokens[patentId];
    }
    
    function updatePatentRegistry(address newRegistry) external onlyOwner {
        patentRegistry = newRegistry;
    }
}