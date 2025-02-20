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