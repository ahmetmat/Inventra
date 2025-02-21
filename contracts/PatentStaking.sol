// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PatentStaking is ERC721, ReentrancyGuard, Ownable {
    using Strings for uint256;

    // State variables
    address public immutable patentFactory;
    uint256 public constant STAKE_REQUIREMENT = 1000 * 10**18; // 1000 tokens
    
    struct StakeInfo {
        uint256 amount;
        address patentToken;
        string patentTitle;
        string imageUrl;
    }
    
    // Mappings
    mapping(uint256 => StakeInfo) public stakes;
    mapping(address => uint256) public nextTokenId;
    
    // Events
    event Staked(address indexed user, address indexed patentToken, uint256 amount, uint256 nftId);
    event Unstaked(address indexed user, address indexed patentToken, uint256 amount, uint256 nftId);

    constructor(address _patentFactory) ERC721("Patent Usage Rights", "PUR") Ownable(msg.sender) {
        require(_patentFactory != address(0), "Invalid factory address");
        patentFactory = _patentFactory;
    }

    function stake(
        address patentToken,
        uint256 amount,
        string memory patentTitle,
        string memory imageUrl
    ) external nonReentrant {
        require(amount >= STAKE_REQUIREMENT, "Must stake at least 1000 tokens");
        require(IERC20(patentToken).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Mint NFT
        uint256 tokenId = nextTokenId[patentToken]++;
        _mint(msg.sender, tokenId);
        
        // Store stake information
        stakes[tokenId] = StakeInfo({
            amount: amount,
            patentToken: patentToken,
            patentTitle: patentTitle,
            imageUrl: imageUrl
        });
        
        emit Staked(msg.sender, patentToken, amount, tokenId);
    }
    
    function unstake(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the NFT owner");
        
        StakeInfo memory stakeInfo = stakes[tokenId];
        
        // Burn NFT
        _burn(tokenId);
        
        // Return staked tokens
        require(IERC20(stakeInfo.patentToken).transfer(msg.sender, stakeInfo.amount), "Transfer failed");
        
        delete stakes[tokenId];
        
        emit Unstaked(msg.sender, stakeInfo.patentToken, stakeInfo.amount, tokenId);
    }
    
    function getPatentTokenForNFT(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return stakes[tokenId].patentToken;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        StakeInfo memory stake = stakes[tokenId];
        
        string memory json = string(
            abi.encodePacked(
                '{"name": "Patent NFT - ',
                stake.patentTitle,
                '", "description": "Usage rights NFT for patent", "image": "',
                stake.imageUrl,
                '"}'
            )
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }
     function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}