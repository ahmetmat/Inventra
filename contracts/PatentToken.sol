// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract PatentToken is ERC721, ERC721URIStorage, Pausable, Ownable {
    struct Patent {
        string ipfsHash;        // IPFS hash of patent documents
        uint256 price;         // Current price in wei
        bool isForSale;        // Whether patent is listed for sale
        address inventor;      // Original patent holder
        uint256 createdAt;    // Timestamp of tokenization
        string patentId;      // Original patent ID
    }
    
    mapping(uint256 => Patent) public patents;
    uint256 private _tokenIds;
    
    event PatentTokenized(uint256 tokenId, address inventor, string patentId);
    event PatentListed(uint256 tokenId, uint256 price);
    event PatentSold(uint256 tokenId, address from, address to, uint256 price);
    
    constructor() ERC721("Patent Token", "PAT") {}
    
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
    
    function tokenizePatent(
        string memory ipfsHash,
        string memory patentId
    ) public returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, ipfsHash);
        
        patents[newTokenId] = Patent({
            ipfsHash: ipfsHash,
            price: 0,
            isForSale: false,
            inventor: msg.sender,
            createdAt: block.timestamp,
            patentId: patentId
        });
        
        emit PatentTokenized(newTokenId, msg.sender, patentId);
        return newTokenId;
    }
    
    function listPatentForSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not the patent owner");
        require(price > 0, "Price must be greater than 0");
        
        patents[tokenId].isForSale = true;
        patents[tokenId].price = price;
        
        emit PatentListed(tokenId, price);
    }
    
    function buyPatent(uint256 tokenId) public payable {
        Patent storage patent = patents[tokenId];
        require(patent.isForSale, "Patent not for sale");
        require(msg.value >= patent.price, "Insufficient payment");
        
        address seller = ownerOf(tokenId);
        _transfer(seller, msg.sender, tokenId);
        
        // Reset sale status
        patent.isForSale = false;
        
        // Transfer payment to seller
        payable(seller).transfer(msg.value);
        
        emit PatentSold(tokenId, seller, msg.sender, msg.value);
    }
    
    function updatePatentMetadata(uint256 tokenId, string memory newIpfsHash) public {
        require(ownerOf(tokenId) == msg.sender, "Not the patent owner");
        patents[tokenId].ipfsHash = newIpfsHash;
        _setTokenURI(tokenId, newIpfsHash);
    }
    
    // Override required functions
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}