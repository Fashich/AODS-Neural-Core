// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AODSNFT
 * @dev ERC721 NFT for AODS Metaverse
 * - Profile NFTs
 * - Gaming Assets
 * - Digital Identity
 * - Tokenized Assets
 */
contract AODSNFT is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Pausable, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    Counters.Counter private _tokenIdCounter;

    // NFT Types
    enum NFTType { PROFILE, GAMING_ASSET, DIGITAL_IDENTITY, TOKENIZED_ASSET, CERTIFICATE }
    
    struct NFTMetadata {
        NFTType nftType;
        uint256 createdAt;
        uint256 expiresAt;
        bool transferable;
        string metadataURI;
    }

    mapping(uint256 => NFTMetadata) public nftData;
    mapping(address => uint256[]) public userNFTs;
    mapping(uint256 => uint256) public nftPrice;
    mapping(uint256 => bool) public isForSale;

    // Royalty
    mapping(uint256 => address) public originalCreator;
    uint256 public constant ROYALTY_PERCENTAGE = 250; // 2.5% (basis points)

    event NFTMinted(address indexed to, uint256 tokenId, NFTType nftType, string uri);
    event NFTListed(uint256 tokenId, uint256 price);
    event NFTSold(uint256 tokenId, address from, address to, uint256 price);
    event NFTRoyaltyPaid(uint256 tokenId, address creator, uint256 amount);

    constructor() ERC721("AODS NFT", "AODSNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function mintProfileNFT(
        address to,
        string memory uri,
        uint256 expiresAt
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        nftData[tokenId] = NFTMetadata({
            nftType: NFTType.PROFILE,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            transferable: true,
            metadataURI: uri
        });

        originalCreator[tokenId] = to;
        userNFTs[to].push(tokenId);

        emit NFTMinted(to, tokenId, NFTType.PROFILE, uri);
        return tokenId;
    }

    function mintGamingAsset(
        address to,
        string memory uri,
        uint256 price
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        nftData[tokenId] = NFTMetadata({
            nftType: NFTType.GAMING_ASSET,
            createdAt: block.timestamp,
            expiresAt: 0,
            transferable: true,
            metadataURI: uri
        });

        originalCreator[tokenId] = to;
        nftPrice[tokenId] = price;
        userNFTs[to].push(tokenId);

        emit NFTMinted(to, tokenId, NFTType.GAMING_ASSET, uri);
        return tokenId;
    }

    function mintDigitalIdentity(
        address to,
        string memory uri
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        nftData[tokenId] = NFTMetadata({
            nftType: NFTType.DIGITAL_IDENTITY,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + 365 days,
            transferable: false, // Soulbound
            metadataURI: uri
        });

        originalCreator[tokenId] = to;
        userNFTs[to].push(tokenId);

        emit NFTMinted(to, tokenId, NFTType.DIGITAL_IDENTITY, uri);
        return tokenId;
    }

    function mintTokenizedAsset(
        address to,
        string memory uri,
        uint256 assetValue
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        nftData[tokenId] = NFTMetadata({
            nftType: NFTType.TOKENIZED_ASSET,
            createdAt: block.timestamp,
            expiresAt: 0,
            transferable: true,
            metadataURI: uri
        });

        originalCreator[tokenId] = to;
        nftPrice[tokenId] = assetValue;
        userNFTs[to].push(tokenId);

        emit NFTMinted(to, tokenId, NFTType.TOKENIZED_ASSET, uri);
        return tokenId;
    }

    // Marketplace functionality
    function listForSale(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "AODSNFT: Not owner");
        require(nftData[tokenId].transferable, "AODSNFT: Not transferable");
        require(getApproved(tokenId) == address(this), "AODSNFT: Not approved");

        isForSale[tokenId] = true;
        nftPrice[tokenId] = price;

        emit NFTListed(tokenId, price);
    }

    function buyNFT(uint256 tokenId) external payable whenNotPaused {
        require(isForSale[tokenId], "AODSNFT: Not for sale");
        require(msg.value >= nftPrice[tokenId], "AODSNFT: Insufficient payment");

        address seller = ownerOf(tokenId);
        address creator = originalCreator[tokenId];
        uint256 price = nftPrice[tokenId];

        // Calculate royalty
        uint256 royalty = (price * ROYALTY_PERCENTAGE) / 10000;
        uint256 sellerAmount = price - royalty;

        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);

        // Update user NFTs list
        _removeUserNFT(seller, tokenId);
        userNFTs[msg.sender].push(tokenId);

        // Pay seller
        payable(seller).transfer(sellerAmount);

        // Pay royalty to creator
        if (creator != seller && royalty > 0) {
            payable(creator).transfer(royalty);
            emit NFTRoyaltyPaid(tokenId, creator, royalty);
        }

        // Refund excess
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        isForSale[tokenId] = false;

        emit NFTSold(tokenId, seller, msg.sender, price);
    }

    function _removeUserNFT(address user, uint256 tokenId) internal {
        uint256[] storage nfts = userNFTs[user];
        for (uint i = 0; i < nfts.length; i++) {
            if (nfts[i] == tokenId) {
                nfts[i] = nfts[nfts.length - 1];
                nfts.pop();
                break;
            }
        }
    }

    function getUserNFTs(address user) external view returns (uint256[] memory) {
        return userNFTs[user];
    }

    function getNFTDetails(uint256 tokenId) external view returns (NFTMetadata memory) {
        return nftData[tokenId];
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
