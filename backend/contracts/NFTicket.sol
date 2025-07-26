// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFTicket
 * @dev ERC-721 NFT contract for event tickets with anti-scalping mechanisms
 * @author Sowad Al-Mughni
 */
contract NFTicket is ERC721, ERC721URIStorage, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 private _tokenIdCounter;

    // Anti-scalping parameters
    uint256 public royaltyCap; // Percentage in basis points (e.g., 500 = 5%)
    uint256 public maxPrice; // Maximum resale price in wei
    address public royaltyRecipient; // Address to receive royalties

    // Event information
    string public eventName;
    string public eventDescription;
    uint256 public eventDate;
    string public eventVenue;

    // Ticket tracking
    mapping(uint256 => bool) public ticketUsed; // Track if ticket has been used for entry
    mapping(uint256 => uint256) public originalPrice; // Track original sale price

    // Events
    event TicketMinted(uint256 indexed tokenId, address indexed to, string uri);
    event TicketTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price, uint256 royaltyAmount);
    event TicketUsed(uint256 indexed tokenId, address indexed owner);
    event RoyaltyCapUpdated(uint256 newRoyaltyCap);
    event MaxPriceUpdated(uint256 newMaxPrice);
    event RoyaltyRecipientUpdated(address newRecipient);

    constructor(
        string memory _eventName,
        string memory _eventDescription,
        uint256 _eventDate,
        string memory _eventVenue,
        uint256 _royaltyCap,
        uint256 _maxPrice,
        address _royaltyRecipient
    ) ERC721("NFTicket", "NFTIX") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        eventName = _eventName;
        eventDescription = _eventDescription;
        eventDate = _eventDate;
        eventVenue = _eventVenue;
        royaltyCap = _royaltyCap;
        maxPrice = _maxPrice;
        royaltyRecipient = _royaltyRecipient;
    }

    /**
     * @dev Mint a new NFTicket
     * @param to Address to mint the ticket to
     * @param uri Metadata URI for the ticket
     * @param price Original sale price of the ticket
     */
    function mintTicket(address to, string memory uri, uint256 price) 
        public 
        onlyRole(MINTER_ROLE) 
        returns (uint256) 
    {
        uint256 tokenId = _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        originalPrice[tokenId] = price;
        
        emit TicketMinted(tokenId, to, uri);
        return tokenId;
    }

    /**
     * @dev Transfer ticket with anti-scalping enforcement
     * @param from Current owner
     * @param to New owner
     * @param tokenId Token ID to transfer
     * @param salePrice Price of the sale (0 for gifts)
     */
    function transferWithPrice(address from, address to, uint256 tokenId, uint256 salePrice) 
        public 
        payable 
        nonReentrant 
    {
        require(
            msg.sender == ownerOf(tokenId) || 
            getApproved(tokenId) == msg.sender || 
            isApprovedForAll(ownerOf(tokenId), msg.sender), 
            "NFTicket: transfer caller is not owner nor approved"
        );
        require(ownerOf(tokenId) == from, "NFTicket: transfer from incorrect owner");
        require(!ticketUsed[tokenId], "NFTicket: ticket has already been used");

        // Enforce max price if this is a resale (salePrice > 0)
        if (salePrice > 0) {
            require(salePrice <= maxPrice, "NFTicket: sale price exceeds maximum allowed price");
            require(msg.value >= salePrice, "NFTicket: insufficient payment");

            // Calculate and transfer royalty
            uint256 royaltyAmount = (salePrice * royaltyCap) / 10000;
            uint256 sellerAmount = salePrice - royaltyAmount;

            if (royaltyAmount > 0) {
                payable(royaltyRecipient).transfer(royaltyAmount);
            }
            
            if (sellerAmount > 0) {
                payable(from).transfer(sellerAmount);
            }

            // Refund excess payment
            if (msg.value > salePrice) {
                payable(msg.sender).transfer(msg.value - salePrice);
            }

            emit TicketTransferred(tokenId, from, to, salePrice, royaltyAmount);
        }

        _transfer(from, to, tokenId);
    }

    /**
     * @dev Mark a ticket as used for event entry
     * @param tokenId Token ID to mark as used
     */
    function useTicket(uint256 tokenId) public {
        require(ownerOf(tokenId) != address(0), "NFTicket: ticket does not exist");
        require(ownerOf(tokenId) == msg.sender, "NFTicket: caller is not the owner");
        require(!ticketUsed[tokenId], "NFTicket: ticket has already been used");

        ticketUsed[tokenId] = true;
        emit TicketUsed(tokenId, msg.sender);
    }

    /**
     * @dev Update royalty cap (admin only)
     * @param _royaltyCap New royalty cap in basis points
     */
    function setRoyaltyCap(uint256 _royaltyCap) public onlyRole(ADMIN_ROLE) {
        require(_royaltyCap <= 2500, "NFTicket: royalty cap cannot exceed 25%");
        royaltyCap = _royaltyCap;
        emit RoyaltyCapUpdated(_royaltyCap);
    }

    /**
     * @dev Update maximum resale price (admin only)
     * @param _maxPrice New maximum price in wei
     */
    function setMaxPrice(uint256 _maxPrice) public onlyRole(ADMIN_ROLE) {
        maxPrice = _maxPrice;
        emit MaxPriceUpdated(_maxPrice);
    }

    /**
     * @dev Update royalty recipient (admin only)
     * @param _royaltyRecipient New royalty recipient address
     */
    function setRoyaltyRecipient(address _royaltyRecipient) public onlyRole(ADMIN_ROLE) {
        require(_royaltyRecipient != address(0), "NFTicket: royalty recipient cannot be zero address");
        royaltyRecipient = _royaltyRecipient;
        emit RoyaltyRecipientUpdated(_royaltyRecipient);
    }

    /**
     * @dev Get ticket information
     * @param tokenId Token ID to query
     */
    function getTicketInfo(uint256 tokenId) public view returns (
        address owner,
        string memory uri,
        bool used,
        uint256 origPrice
    ) {
        require(ownerOf(tokenId) != address(0), "NFTicket: ticket does not exist");
        return (
            ownerOf(tokenId),
            tokenURI(tokenId),
            ticketUsed[tokenId],
            originalPrice[tokenId]
        );
    }

    /**
     * @dev Get event information
     */
    function getEventInfo() public view returns (
        string memory name,
        string memory description,
        uint256 date,
        string memory venue
    ) {
        return (eventName, eventDescription, eventDate, eventVenue);
    }

    // The following functions are overrides required by Solidity. 
    // We need to explicitly mark them as `virtual` here and `override` in the child contracts.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Internal function to prevent transfer of used tickets
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        if (to != address(0)) {
            require(!ticketUsed[tokenId], "NFTicket: cannot transfer used ticket");
        }
        return super._update(to, tokenId, auth);
    }
}

