// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title POAPDistributor
 * @dev ERC-721 contract for distributing Proof of Attendance Protocol (POAP) NFTs
 * @author Sowad Al-Mughni
 */
contract POAPDistributor is ERC721, ERC721URIStorage, AccessControl, ReentrancyGuard {
    

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    uint256 private _tokenIdCounter;

    // POAP event information
    string public eventName;
    string public eventDescription;
    uint256 public eventDate;
    string public eventLocation;
    string public baseTokenURI;

    // Distribution tracking
    mapping(address => bool) public hasClaimed; // Track if address has claimed POAP
    mapping(uint256 => address) public ticketToOwner; // Map NFTicket ID to owner for verification
    
    // Supply management
    uint256 public maxSupply;
    uint256 public totalClaimed;
    bool public distributionActive;

    // Events
    event POAPClaimed(address indexed claimer, uint256 indexed tokenId);
    event DistributionStatusChanged(bool active);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    event BaseURIUpdated(string newBaseURI);

    constructor(
        string memory _eventName,
        string memory _eventDescription,
        uint256 _eventDate,
        string memory _eventLocation,
        string memory _baseTokenURI,
        uint256 _maxSupply
    ) ERC721("EventPOAP", "POAP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);

        eventName = _eventName;
        eventDescription = _eventDescription;
        eventDate = _eventDate;
        eventLocation = _eventLocation;
        baseTokenURI = _baseTokenURI;
        maxSupply = _maxSupply;
        distributionActive = true;
    }

    /**
     * @dev Claim a POAP for attending the event
     * @param claimer Address claiming the POAP
     * @param nfticketContract Address of the NFTicket contract for verification
     * @param ticketId Token ID of the NFTicket to verify attendance
     */
    function claimPOAP(
        address claimer, 
        address nfticketContract, 
        uint256 ticketId
    ) public onlyRole(DISTRIBUTOR_ROLE) nonReentrant returns (uint256) {
        require(distributionActive, "POAP: distribution is not active");
        require(!hasClaimed[claimer], "POAP: address has already claimed");
        require(totalClaimed < maxSupply, "POAP: maximum supply reached");

        // Verify that the claimer owns the NFTicket
        IERC721 nfticket = IERC721(nfticketContract);
        require(nfticket.ownerOf(ticketId) == claimer, "POAP: claimer does not own the specified ticket");

        uint256 tokenId = _tokenIdCounter++;
        
        _safeMint(claimer, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId))));
        
        hasClaimed[claimer] = true;
        totalClaimed++;
        ticketToOwner[ticketId] = claimer;

        emit POAPClaimed(claimer, tokenId);
        return tokenId;
    }

    /**
     * @dev Claim POAP without ticket verification (for special cases)
     * @param claimer Address claiming the POAP
     */
    function claimPOAPDirect(address claimer) 
        public 
        onlyRole(DISTRIBUTOR_ROLE) 
        nonReentrant 
        returns (uint256) 
    {
        require(distributionActive, "POAP: distribution is not active");
        require(!hasClaimed[claimer], "POAP: address has already claimed");
        require(totalClaimed < maxSupply, "POAP: maximum supply reached");

        uint256 tokenId = _tokenIdCounter++;
        
        _safeMint(claimer, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId))));
        
        hasClaimed[claimer] = true;
        totalClaimed++;

        emit POAPClaimed(claimer, tokenId);
        return tokenId;
    }

    /**
     * @dev Batch claim POAPs for multiple addresses
     * @param claimers Array of addresses to claim POAPs for
     */
    function batchClaimPOAP(address[] memory claimers) 
        public 
        onlyRole(DISTRIBUTOR_ROLE) 
        nonReentrant 
    {
        require(distributionActive, "POAP: distribution is not active");
        require(totalClaimed + claimers.length <= maxSupply, "POAP: would exceed maximum supply");

        for (uint256 i = 0; i < claimers.length; i++) {
            address claimer = claimers[i];
            if (!hasClaimed[claimer]) {
                uint256 tokenId = _tokenIdCounter++;
                
                _safeMint(claimer, tokenId);
                _setTokenURI(tokenId, string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId))));
                
                hasClaimed[claimer] = true;
                totalClaimed++;

                emit POAPClaimed(claimer, tokenId);
            }
        }
    }

    /**
     * @dev Set distribution status (admin only)
     * @param _active Whether distribution is active
     */
    function setDistributionActive(bool _active) public onlyRole(ADMIN_ROLE) {
        distributionActive = _active;
        emit DistributionStatusChanged(_active);
    }

    /**
     * @dev Update maximum supply (admin only)
     * @param _maxSupply New maximum supply
     */
    function setMaxSupply(uint256 _maxSupply) public onlyRole(ADMIN_ROLE) {
        require(_maxSupply >= totalClaimed, "POAP: new max supply cannot be less than total claimed");
        maxSupply = _maxSupply;
        emit MaxSupplyUpdated(_maxSupply);
    }

    /**
     * @dev Update base token URI (admin only)
     * @param _baseTokenURI New base URI
     */
    function setBaseTokenURI(string memory _baseTokenURI) public onlyRole(ADMIN_ROLE) {
        baseTokenURI = _baseTokenURI;
        emit BaseURIUpdated(_baseTokenURI);
    }

    /**
     * @dev Get POAP event information
     */
    function getEventInfo() public view returns (
        string memory name,
        string memory description,
        uint256 date,
        string memory location,
        uint256 claimed,
        uint256 maxSup,
        bool active
    ) {
        return (
            eventName,
            eventDescription,
            eventDate,
            eventLocation,
            totalClaimed,
            maxSupply,
            distributionActive
        );
    }

    /**
     * @dev Check if an address has claimed a POAP
     * @param claimer Address to check
     */
    function hasClaimedPOAP(address claimer) public view returns (bool) {
        return hasClaimed[claimer];
    }

    /**
     * @dev Get remaining POAPs available for claim
     */
    function remainingSupply() public view returns (uint256) {
        return maxSupply - totalClaimed;
    }

    // Override required functions


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

    /**
     * @dev Disable transfers to make POAPs soulbound (non-transferable)
     */

}






