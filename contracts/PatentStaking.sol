// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PatentStaking is ERC721, ReentrancyGuard, Ownable {
    // State variables
    address public immutable patentFactory;
    uint256 public constant STAKE_REQUIREMENT = 1000 * 10**18; // 1000 tokens
    
    // Mapping from token ID to staked amount
    mapping(uint256 => uint256) public stakedAmount;
    
    // Mapping from patent token to next available NFT ID
    mapping(address => uint256) public nextTokenId;
    
    // Event declarations
    event Staked(address indexed user, address indexed patentToken, uint256 amount, uint256 nftId);
    event Unstaked(address indexed user, address indexed patentToken, uint256 amount, uint256 nftId);

    constructor(address _patentFactory) ERC721("Patent Usage Rights", "PUR") Ownable(msg.sender) {
        require(_patentFactory != address(0), "Invalid factory address");
        patentFactory = _patentFactory;
    }

    function stake(address patentToken, uint256 amount) external nonReentrant {
        require(amount >= STAKE_REQUIREMENT, "Must stake at least 1000 tokens");
        require(IERC20(patentToken).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Mint NFT
        uint256 tokenId = nextTokenId[patentToken]++;
        _mint(msg.sender, tokenId);
        
        // Record staked amount
        stakedAmount[tokenId] = amount;
        
        emit Staked(msg.sender, patentToken, amount, tokenId);
    }
    
    function unstake(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the NFT owner");
        
        uint256 amount = stakedAmount[tokenId];
        address patentToken = getPatentTokenForNFT(tokenId);
        
        // Burn NFT
        _burn(tokenId);
        
        // Return staked tokens
        require(IERC20(patentToken).transfer(msg.sender, amount), "Transfer failed");
        
        delete stakedAmount[tokenId];
        
        emit Unstaked(msg.sender, patentToken, amount, tokenId);
    }
    
    function getPatentTokenForNFT(uint256 tokenId) public view returns (address) {
        // Implementation depends on how you want to map NFTs to patent tokens
        // This is a simplified version
        return address(uint160(tokenId >> 96));
    }
}