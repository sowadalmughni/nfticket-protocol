# NFTicket Protocol API Reference

**Author:** Sowad Al-Mughni

Complete API reference for the NFTicket Anti-Scalping Protocol, including smart contract interfaces, mobile app APIs, and dashboard endpoints.

## Table of Contents

1. [Smart Contract APIs](#smart-contract-apis)
2. [Mobile App APIs](#mobile-app-apis)
3. [Dashboard APIs](#dashboard-apis)
4. [Web3 Integration](#web3-integration)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Authentication](#authentication)

## Smart Contract APIs

### NFTicket Contract

The main ERC-721 contract for managing event tickets with anti-scalping features.

#### Contract Address
- **Mainnet:** `0x...` (To be deployed)
- **Sepolia:** `0x...` (To be deployed)
- **Local:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`

#### Constructor

```solidity
constructor(
    string memory _eventName,
    string memory _eventDescription,
    uint256 _eventDate,
    string memory _venue,
    uint256 _royaltyCap,
    uint256 _maxPrice,
    address _royaltyRecipient
)
```

**Parameters:**
- `_eventName` (string): Display name of the event
- `_eventDescription` (string): Detailed event description
- `_eventDate` (uint256): Unix timestamp of event date
- `_venue` (string): Event venue/location
- `_royaltyCap` (uint256): Maximum royalty percentage (basis points, e.g., 500 = 5%)
- `_maxPrice` (uint256): Maximum resale price in wei
- `_royaltyRecipient` (address): Address to receive royalty payments

#### Read Functions

##### `getEventInfo()`

Returns basic event information.

```solidity
function getEventInfo() external view returns (
    string memory name,
    string memory description,
    uint256 date,
    string memory venue
)
```

**Returns:**
- `name` (string): Event name
- `description` (string): Event description
- `date` (uint256): Event date timestamp
- `venue` (string): Event venue

**Example Usage:**
```javascript
const eventInfo = await nfticketContract.getEventInfo();
console.log(`Event: ${eventInfo.name} at ${eventInfo.venue}`);
```

##### `getTicketInfo(uint256 tokenId)`

Returns detailed information about a specific ticket.

```solidity
function getTicketInfo(uint256 tokenId) external view returns (
    address owner,
    string memory uri,
    bool used,
    uint256 origPrice
)
```

**Parameters:**
- `tokenId` (uint256): The ticket token ID

**Returns:**
- `owner` (address): Current owner of the ticket
- `uri` (string): Metadata URI for the ticket
- `used` (bool): Whether the ticket has been used for entry
- `origPrice` (uint256): Original purchase price in wei

**Example Usage:**
```javascript
const ticketInfo = await nfticketContract.getTicketInfo(1);
console.log(`Ticket owner: ${ticketInfo.owner}, Used: ${ticketInfo.used}`);
```

##### `royaltyCap()`

Returns the maximum royalty percentage.

```solidity
function royaltyCap() external view returns (uint256)
```

**Returns:**
- `uint256`: Royalty cap in basis points (e.g., 500 = 5%)

##### `maxPrice()`

Returns the maximum allowed resale price.

```solidity
function maxPrice() external view returns (uint256)
```

**Returns:**
- `uint256`: Maximum price in wei

##### `royaltyRecipient()`

Returns the address that receives royalty payments.

```solidity
function royaltyRecipient() external view returns (address)
```

**Returns:**
- `address`: Royalty recipient address

#### Write Functions

##### `mintTicket(address to, string memory uri, uint256 price)`

Mints a new ticket NFT.

```solidity
function mintTicket(
    address to,
    string memory uri,
    uint256 price
) external onlyOwner returns (uint256)
```

**Parameters:**
- `to` (address): Address to mint the ticket to
- `uri` (string): Metadata URI for the ticket
- `price` (uint256): Original ticket price in wei

**Returns:**
- `uint256`: The newly minted token ID

**Events Emitted:**
- `TicketMinted(uint256 indexed tokenId, address indexed to, string uri)`

**Example Usage:**
```javascript
const tx = await nfticketContract.mintTicket(
    userAddress,
    "https://api.example.com/metadata/1",
    ethers.utils.parseEther("0.1")
);
const receipt = await tx.wait();
const tokenId = receipt.events[0].args.tokenId;
```

##### `transferWithPrice(address from, address to, uint256 tokenId, uint256 salePrice)`

Transfers a ticket with price validation and royalty payment.

```solidity
function transferWithPrice(
    address from,
    address to,
    uint256 tokenId,
    uint256 salePrice
) external payable
```

**Parameters:**
- `from` (address): Current owner of the ticket
- `to` (address): New owner of the ticket
- `tokenId` (uint256): Token ID to transfer
- `salePrice` (uint256): Sale price in wei

**Requirements:**
- `msg.value` must equal `salePrice`
- `salePrice` must not exceed `maxPrice`
- Caller must be approved or owner

**Events Emitted:**
- `TicketTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price, uint256 royaltyAmount)`

**Example Usage:**
```javascript
const salePrice = ethers.utils.parseEther("0.15");
const tx = await nfticketContract.transferWithPrice(
    fromAddress,
    toAddress,
    tokenId,
    salePrice,
    { value: salePrice }
);
```

##### `useTicket(uint256 tokenId)`

Marks a ticket as used for event entry.

```solidity
function useTicket(uint256 tokenId) external
```

**Parameters:**
- `tokenId` (uint256): Token ID to mark as used

**Requirements:**
- Caller must be owner or approved
- Ticket must not already be used

**Events Emitted:**
- `TicketUsed(uint256 indexed tokenId, address indexed owner)`

**Example Usage:**
```javascript
const tx = await nfticketContract.useTicket(tokenId);
await tx.wait();
console.log(`Ticket ${tokenId} marked as used`);
```

##### `setRoyaltyCap(uint256 _royaltyCap)`

Updates the royalty cap (owner only).

```solidity
function setRoyaltyCap(uint256 _royaltyCap) external onlyOwner
```

**Parameters:**
- `_royaltyCap` (uint256): New royalty cap in basis points

**Requirements:**
- Caller must be contract owner
- Royalty cap must be ≤ 2500 (25%)

##### `setMaxPrice(uint256 _maxPrice)`

Updates the maximum resale price (owner only).

```solidity
function setMaxPrice(uint256 _maxPrice) external onlyOwner
```

**Parameters:**
- `_maxPrice` (uint256): New maximum price in wei

**Requirements:**
- Caller must be contract owner

##### `setRoyaltyRecipient(address _royaltyRecipient)`

Updates the royalty recipient address (owner only).

```solidity
function setRoyaltyRecipient(address _royaltyRecipient) external onlyOwner
```

**Parameters:**
- `_royaltyRecipient` (address): New royalty recipient address

**Requirements:**
- Caller must be contract owner
- Address must not be zero address

#### Events

##### `TicketMinted`

Emitted when a new ticket is minted.

```solidity
event TicketMinted(uint256 indexed tokenId, address indexed to, string uri);
```

##### `TicketTransferred`

Emitted when a ticket is transferred with price and royalty information.

```solidity
event TicketTransferred(
    uint256 indexed tokenId,
    address indexed from,
    address indexed to,
    uint256 price,
    uint256 royaltyAmount
);
```

##### `TicketUsed`

Emitted when a ticket is used for event entry.

```solidity
event TicketUsed(uint256 indexed tokenId, address indexed owner);
```

### POAPDistributor Contract

Manages POAP (Proof of Attendance Protocol) token distribution for event attendees.

#### Constructor

```solidity
constructor(
    string memory _eventName,
    string memory _eventDescription,
    uint256 _eventDate,
    string memory _location,
    uint256 _maxSupply,
    string memory _baseTokenURI
)
```

**Parameters:**
- `_eventName` (string): POAP event name
- `_eventDescription` (string): Event description
- `_eventDate` (uint256): Event date timestamp
- `_location` (string): Event location
- `_maxSupply` (uint256): Maximum number of POAPs that can be minted
- `_baseTokenURI` (string): Base URI for POAP metadata

#### Read Functions

##### `getEventInfo()`

Returns POAP event information.

```solidity
function getEventInfo() external view returns (
    string memory name,
    string memory description,
    uint256 date,
    string memory location,
    uint256 claimed,
    uint256 maxSup,
    bool active
)
```

**Returns:**
- `name` (string): Event name
- `description` (string): Event description
- `date` (uint256): Event date
- `location` (string): Event location
- `claimed` (uint256): Number of POAPs claimed
- `maxSup` (uint256): Maximum supply
- `active` (bool): Whether distribution is active

##### `hasClaimedPOAP(address claimer)`

Checks if an address has already claimed a POAP.

```solidity
function hasClaimedPOAP(address claimer) external view returns (bool)
```

**Parameters:**
- `claimer` (address): Address to check

**Returns:**
- `bool`: True if address has claimed a POAP

##### `remainingSupply()`

Returns the number of POAPs remaining to be claimed.

```solidity
function remainingSupply() external view returns (uint256)
```

**Returns:**
- `uint256`: Number of POAPs remaining

##### `totalClaimed()`

Returns the total number of POAPs claimed.

```solidity
function totalClaimed() external view returns (uint256)
```

**Returns:**
- `uint256`: Total POAPs claimed

##### `distributionActive()`

Returns whether POAP distribution is currently active.

```solidity
function distributionActive() external view returns (bool)
```

**Returns:**
- `bool`: True if distribution is active

#### Write Functions

##### `claimPOAP(address claimer, address nfticketContract, uint256 ticketId)`

Claims a POAP by verifying ticket ownership.

```solidity
function claimPOAP(
    address claimer,
    address nfticketContract,
    uint256 ticketId
) external
```

**Parameters:**
- `claimer` (address): Address claiming the POAP
- `nfticketContract` (address): NFTicket contract address
- `ticketId` (uint256): Ticket token ID for verification

**Requirements:**
- Distribution must be active
- Claimer must own the specified ticket
- Claimer must not have already claimed a POAP
- Supply must be available

**Events Emitted:**
- `POAPClaimed(address indexed claimer, uint256 indexed tokenId)`

##### `claimPOAPDirect(address claimer)`

Claims a POAP directly without ticket verification (admin only).

```solidity
function claimPOAPDirect(address claimer) external onlyOwner
```

**Parameters:**
- `claimer` (address): Address to receive the POAP

**Requirements:**
- Caller must be contract owner
- Supply must be available

##### `batchClaimPOAP(address[] memory claimers)`

Claims POAPs for multiple addresses (admin only).

```solidity
function batchClaimPOAP(address[] memory claimers) external onlyOwner
```

**Parameters:**
- `claimers` (address[]): Array of addresses to receive POAPs

**Requirements:**
- Caller must be contract owner
- Sufficient supply must be available

##### `setDistributionActive(bool active)`

Enables or disables POAP distribution (owner only).

```solidity
function setDistributionActive(bool active) external onlyOwner
```

**Parameters:**
- `active` (bool): Whether to activate distribution

**Events Emitted:**
- `DistributionStatusChanged(bool active)`

##### `setMaxSupply(uint256 _maxSupply)`

Updates the maximum supply (owner only).

```solidity
function setMaxSupply(uint256 _maxSupply) external onlyOwner
```

**Parameters:**
- `_maxSupply` (uint256): New maximum supply

**Requirements:**
- New supply must be ≥ current claimed amount

**Events Emitted:**
- `MaxSupplyUpdated(uint256 newMaxSupply)`

##### `setBaseTokenURI(string memory _baseTokenURI)`

Updates the base token URI (owner only).

```solidity
function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner
```

**Parameters:**
- `_baseTokenURI` (string): New base URI for metadata

#### Events

##### `POAPClaimed`

Emitted when a POAP is claimed.

```solidity
event POAPClaimed(address indexed claimer, uint256 indexed tokenId);
```

##### `DistributionStatusChanged`

Emitted when distribution status changes.

```solidity
event DistributionStatusChanged(bool active);
```

##### `MaxSupplyUpdated`

Emitted when maximum supply is updated.

```solidity
event MaxSupplyUpdated(uint256 newMaxSupply);
```

## Mobile App APIs

### Wallet Service

#### `connectWallet(provider)`

Connects to a Web3 wallet provider.

```javascript
async function connectWallet(provider = 'metamask') {
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    return {
      success: true,
      address: accounts[0],
      provider: provider
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Parameters:**
- `provider` (string): Wallet provider ('metamask', 'walletconnect', etc.)

**Returns:**
- `success` (boolean): Whether connection was successful
- `address` (string): Connected wallet address
- `provider` (string): Provider used
- `error` (string): Error message if failed

#### `disconnectWallet()`

Disconnects from the current wallet.

```javascript
async function disconnectWallet() {
  // Clear stored connection data
  await AsyncStorage.removeItem('walletAddress');
  await AsyncStorage.removeItem('walletProvider');
  
  return { success: true };
}
```

**Returns:**
- `success` (boolean): Always true

#### `getBalance(address)`

Gets the ETH balance for an address.

```javascript
async function getBalance(address) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(address);
    
    return {
      success: true,
      balance: ethers.utils.formatEther(balance),
      balanceWei: balance.toString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Parameters:**
- `address` (string): Ethereum address

**Returns:**
- `success` (boolean): Whether request was successful
- `balance` (string): Balance in ETH
- `balanceWei` (string): Balance in wei
- `error` (string): Error message if failed

### Ticket Service

#### `getUserTickets(address)`

Retrieves all tickets owned by an address.

```javascript
async function getUserTickets(address) {
  try {
    const contract = new ethers.Contract(
      NFTICKET_ADDRESS,
      NFTICKET_ABI,
      provider
    );
    
    const balance = await contract.balanceOf(address);
    const tickets = [];
    
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      const ticketInfo = await contract.getTicketInfo(tokenId);
      const tokenURI = await contract.tokenURI(tokenId);
      
      tickets.push({
        tokenId: tokenId.toString(),
        owner: ticketInfo.owner,
        uri: ticketInfo.uri,
        used: ticketInfo.used,
        originalPrice: ethers.utils.formatEther(ticketInfo.origPrice),
        metadata: await fetchMetadata(tokenURI)
      });
    }
    
    return {
      success: true,
      tickets: tickets,
      count: tickets.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Parameters:**
- `address` (string): Owner address

**Returns:**
- `success` (boolean): Whether request was successful
- `tickets` (array): Array of ticket objects
- `count` (number): Number of tickets
- `error` (string): Error message if failed

#### `transferTicket(from, to, tokenId, price)`

Transfers a ticket with price validation.

```javascript
async function transferTicket(from, to, tokenId, price) {
  try {
    const contract = new ethers.Contract(
      NFTICKET_ADDRESS,
      NFTICKET_ABI,
      signer
    );
    
    const priceWei = ethers.utils.parseEther(price.toString());
    
    const tx = await contract.transferWithPrice(
      from,
      to,
      tokenId,
      priceWei,
      { value: priceWei }
    );
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Parameters:**
- `from` (string): Current owner address
- `to` (string): New owner address
- `tokenId` (string): Token ID to transfer
- `price` (number): Sale price in ETH

**Returns:**
- `success` (boolean): Whether transfer was successful
- `transactionHash` (string): Transaction hash
- `gasUsed` (string): Gas used for transaction
- `error` (string): Error message if failed

#### `useTicket(tokenId)`

Marks a ticket as used for event entry.

```javascript
async function useTicket(tokenId) {
  try {
    const contract = new ethers.Contract(
      NFTICKET_ADDRESS,
      NFTICKET_ABI,
      signer
    );
    
    const tx = await contract.useTicket(tokenId);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      used: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Parameters:**
- `tokenId` (string): Token ID to mark as used

**Returns:**
- `success` (boolean): Whether operation was successful
- `transactionHash` (string): Transaction hash
- `used` (boolean): Always true if successful
- `error` (string): Error message if failed

#### `generateQRCode(tokenId)`

Generates a QR code for offline ticket verification.

```javascript
async function generateQRCode(tokenId) {
  try {
    const contract = new ethers.Contract(
      NFTICKET_ADDRESS,
      NFTICKET_ABI,
      provider
    );
    
    const ticketInfo = await contract.getTicketInfo(tokenId);
    const eventInfo = await contract.getEventInfo();
    
    // Create verification data
    const verificationData = {
      tokenId: tokenId,
      owner: ticketInfo.owner,
      eventName: eventInfo.name,
      eventDate: eventInfo.date,
      used: ticketInfo.used,
      timestamp: Date.now(),
      signature: await signVerificationData(tokenId, ticketInfo.owner)
    };
    
    const qrData = JSON.stringify(verificationData);
    
    return {
      success: true,
      qrData: qrData,
      verificationData: verificationData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Parameters:**
- `tokenId` (string): Token ID for QR generation

**Returns:**
- `success` (boolean): Whether QR generation was successful
- `qrData` (string): JSON string for QR code
- `verificationData` (object): Verification data object
- `error` (string): Error message if failed

### POAP Service

#### `getUserPOAPs(address)`

Retrieves all POAPs owned by an address.

```javascript
async function getUserPOAPs(address) {
  try {
    const contract = new ethers.Contract(
      POAP_DISTRIBUTOR_ADDRESS,
      POAP_DISTRIBUTOR_ABI,
      provider
    );
    
    const balance = await contract.balanceOf(address);
    const poaps = [];
    
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      const tokenURI = await contract.tokenURI(tokenId);
      
      poaps.push({
        tokenId: tokenId.toString(),
        uri: tokenURI,
        metadata: await fetchMetadata(tokenURI)
      });
    }
    
    return {
      success: true,
      poaps: poaps,
      count: poaps.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Parameters:**
- `address` (string): Owner address

**Returns:**
- `success` (boolean): Whether request was successful
- `poaps` (array): Array of POAP objects
- `count` (number): Number of POAPs
- `error` (string): Error message if failed

#### `claimPOAP(claimer, nfticketContract, ticketId)`

Claims a POAP using ticket verification.

```javascript
async function claimPOAP(claimer, nfticketContract, ticketId) {
  try {
    const contract = new ethers.Contract(
      POAP_DISTRIBUTOR_ADDRESS,
      POAP_DISTRIBUTOR_ABI,
      signer
    );
    
    // Check if already claimed
    const hasClaimed = await contract.hasClaimedPOAP(claimer);
    if (hasClaimed) {
      return {
        success: false,
        error: 'POAP already claimed by this address'
      };
    }
    
    const tx = await contract.claimPOAP(claimer, nfticketContract, ticketId);
    const receipt = await tx.wait();
    
    // Extract token ID from events
    const claimEvent = receipt.events.find(e => e.event === 'POAPClaimed');
    const newTokenId = claimEvent.args.tokenId;
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      tokenId: newTokenId.toString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Parameters:**
- `claimer` (string): Address claiming the POAP
- `nfticketContract` (string): NFTicket contract address
- `ticketId` (string): Ticket token ID for verification

**Returns:**
- `success` (boolean): Whether claim was successful
- `transactionHash` (string): Transaction hash
- `tokenId` (string): New POAP token ID
- `error` (string): Error message if failed

#### `scanToAirdrop(qrData)`

Processes a scanned QR code for POAP airdrop.

```javascript
async function scanToAirdrop(qrData) {
  try {
    const verificationData = JSON.parse(qrData);
    
    // Verify QR code signature
    const isValid = await verifyQRSignature(verificationData);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid QR code signature'
      };
    }
    
    // Check if ticket is valid and used
    const contract = new ethers.Contract(
      verificationData.nfticketContract || NFTICKET_ADDRESS,
      NFTICKET_ABI,
      provider
    );
    
    const ticketInfo = await contract.getTicketInfo(verificationData.tokenId);
    
    if (!ticketInfo.used) {
      return {
        success: false,
        error: 'Ticket must be used before claiming POAP'
      };
    }
    
    // Claim POAP
    return await claimPOAP(
      verificationData.owner,
      verificationData.nfticketContract || NFTICKET_ADDRESS,
      verificationData.tokenId
    );
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Parameters:**
- `qrData` (string): JSON string from scanned QR code

**Returns:**
- `success` (boolean): Whether airdrop was successful
- `transactionHash` (string): Transaction hash if successful
- `tokenId` (string): New POAP token ID if successful
- `error` (string): Error message if failed

## Dashboard APIs

### Event Management

#### `GET /api/events`

Retrieves all events for the authenticated user.

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "1",
      "name": "Web3 Conference 2024",
      "description": "The premier Web3 and blockchain conference",
      "date": "2024-08-15T00:00:00Z",
      "venue": "Convention Center, San Francisco",
      "contractAddress": "0x1234567890123456789012345678901234567890",
      "ticketsTotal": 1000,
      "ticketsSold": 750,
      "ticketsUsed": 650,
      "royaltyCap": 5,
      "maxPrice": "1.0",
      "status": "active"
    }
  ],
  "count": 1
}
```

#### `POST /api/events`

Creates a new event and deploys the NFTicket contract.

**Request Body:**
```json
{
  "name": "DeFi Summit 2024",
  "description": "Decentralized finance summit and networking",
  "date": "2024-09-10T00:00:00Z",
  "venue": "Tech Hub, London",
  "royaltyCap": 7.5,
  "maxPrice": "0.8"
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "2",
    "name": "DeFi Summit 2024",
    "contractAddress": "0x9876543210987654321098765432109876543210",
    "deploymentTx": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }
}
```

#### `GET /api/events/:id`

Retrieves details for a specific event.

**Parameters:**
- `id` (string): Event ID

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "1",
    "name": "Web3 Conference 2024",
    "description": "The premier Web3 and blockchain conference",
    "date": "2024-08-15T00:00:00Z",
    "venue": "Convention Center, San Francisco",
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "analytics": {
      "ticketsTotal": 1000,
      "ticketsSold": 750,
      "ticketsUsed": 650,
      "revenue": "75.0",
      "royaltiesEarned": "3.75",
      "secondaryMarketVolume": "15.0"
    }
  }
}
```

#### `PUT /api/events/:id`

Updates event settings.

**Parameters:**
- `id` (string): Event ID

**Request Body:**
```json
{
  "royaltyCap": 10,
  "maxPrice": "1.5"
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "1",
    "royaltyCap": 10,
    "maxPrice": "1.5",
    "updatedAt": "2024-07-24T01:00:00Z"
  }
}
```

### Ticket Management

#### `GET /api/events/:eventId/tickets`

Retrieves all tickets for an event.

**Parameters:**
- `eventId` (string): Event ID

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `status` (string): Filter by status ('minted', 'used', 'transferred')

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "tokenId": "1",
      "owner": "0x1234567890123456789012345678901234567890",
      "originalPrice": "0.1",
      "currentPrice": "0.15",
      "used": false,
      "mintedAt": "2024-07-20T10:00:00Z",
      "metadata": {
        "name": "Web3 Conference 2024 - Ticket #1",
        "description": "General admission ticket",
        "image": "https://api.example.com/images/ticket1.png"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 750,
    "pages": 15
  }
}
```

#### `POST /api/events/:eventId/tickets/mint`

Mints new tickets for an event.

**Parameters:**
- `eventId` (string): Event ID

**Request Body:**
```json
{
  "recipients": [
    {
      "address": "0x1234567890123456789012345678901234567890",
      "price": "0.1",
      "metadata": {
        "name": "Web3 Conference 2024 - VIP Ticket",
        "description": "VIP access with networking session",
        "attributes": [
          {"trait_type": "Tier", "value": "VIP"},
          {"trait_type": "Section", "value": "A"}
        ]
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "tokenId": "751",
      "recipient": "0x1234567890123456789012345678901234567890",
      "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
  ]
}
```

#### `POST /api/tickets/:tokenId/use`

Marks a ticket as used.

**Parameters:**
- `tokenId` (string): Token ID

**Response:**
```json
{
  "success": true,
  "ticket": {
    "tokenId": "1",
    "used": true,
    "usedAt": "2024-08-15T18:00:00Z",
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }
}
```

### POAP Management

#### `GET /api/events/:eventId/poaps`

Retrieves POAP information for an event.

**Parameters:**
- `eventId` (string): Event ID

**Response:**
```json
{
  "success": true,
  "poap": {
    "contractAddress": "0x9876543210987654321098765432109876543210",
    "eventName": "Web3 Conference 2024 POAP",
    "maxSupply": 1000,
    "claimed": 650,
    "remaining": 350,
    "distributionActive": true,
    "metadata": {
      "name": "Web3 Conference 2024 Attendance",
      "description": "Proof of attendance for Web3 Conference 2024",
      "image": "https://api.example.com/images/poap.png"
    }
  }
}
```

#### `POST /api/events/:eventId/poaps/deploy`

Deploys a POAP contract for an event.

**Parameters:**
- `eventId` (string): Event ID

**Request Body:**
```json
{
  "eventName": "Web3 Conference 2024 POAP",
  "description": "Proof of attendance for Web3 Conference 2024",
  "maxSupply": 1000,
  "baseTokenURI": "https://api.example.com/poap/metadata/"
}
```

**Response:**
```json
{
  "success": true,
  "poap": {
    "contractAddress": "0x9876543210987654321098765432109876543210",
    "deploymentTx": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }
}
```

#### `POST /api/poaps/:contractAddress/claim`

Claims a POAP for a user.

**Parameters:**
- `contractAddress` (string): POAP contract address

**Request Body:**
```json
{
  "claimer": "0x1234567890123456789012345678901234567890",
  "nfticketContract": "0x1234567890123456789012345678901234567890",
  "ticketId": "1"
}
```

**Response:**
```json
{
  "success": true,
  "claim": {
    "tokenId": "651",
    "claimer": "0x1234567890123456789012345678901234567890",
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }
}
```

### Analytics

#### `GET /api/events/:eventId/analytics`

Retrieves analytics data for an event.

**Parameters:**
- `eventId` (string): Event ID

**Query Parameters:**
- `period` (string): Time period ('7d', '30d', '90d', 'all')

**Response:**
```json
{
  "success": true,
  "analytics": {
    "overview": {
      "ticketsTotal": 1000,
      "ticketsSold": 750,
      "ticketsUsed": 650,
      "revenue": "75.0",
      "royaltiesEarned": "3.75",
      "secondaryMarketVolume": "15.0"
    },
    "salesData": [
      {
        "date": "2024-07-20",
        "ticketsSold": 50,
        "revenue": "5.0"
      }
    ],
    "priceData": [
      {
        "date": "2024-07-20",
        "averagePrice": "0.1",
        "minPrice": "0.1",
        "maxPrice": "0.1"
      }
    ],
    "transferData": [
      {
        "date": "2024-07-21",
        "transfers": 5,
        "volume": "0.75",
        "averagePrice": "0.15"
      }
    ]
  }
}
```

#### `GET /api/analytics/dashboard`

Retrieves overall dashboard analytics.

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalEvents": 3,
    "totalTickets": 2500,
    "totalRevenue": "250.0",
    "totalRoyalties": "12.5",
    "activeEvents": 2,
    "recentActivity": [
      {
        "type": "ticket_minted",
        "description": "New ticket minted for Web3 Conference 2024",
        "timestamp": "2024-07-24T01:00:00Z",
        "eventId": "1"
      }
    ]
  }
}
```

## Web3 Integration

### Wagmi Configuration

```javascript
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, polygon],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId: 'your-project-id' }),
  ],
  transports: {
    [mainnet.id]: http('https://rpc.ankr.com/eth'),
    [sepolia.id]: http('https://rpc.ankr.com/eth_sepolia'),
    [polygon.id]: http('https://rpc.ankr.com/polygon'),
  },
})
```

### Contract Interaction Hooks

#### `useNFTicketContract`

Custom hook for interacting with NFTicket contracts.

```javascript
import { useContract, useProvider, useSigner } from 'wagmi'
import { NFTICKET_ABI, CONTRACT_ADDRESSES } from '../lib/wagmi'

export function useNFTicketContract(contractAddress) {
  const provider = useProvider()
  const { data: signer } = useSigner()
  
  const contract = useContract({
    address: contractAddress,
    abi: NFTICKET_ABI,
    signerOrProvider: signer || provider,
  })
  
  return contract
}
```

#### `usePOAPContract`

Custom hook for interacting with POAP contracts.

```javascript
import { useContract, useProvider, useSigner } from 'wagmi'
import { POAP_DISTRIBUTOR_ABI } from '../lib/wagmi'

export function usePOAPContract(contractAddress) {
  const provider = useProvider()
  const { data: signer } = useSigner()
  
  const contract = useContract({
    address: contractAddress,
    abi: POAP_DISTRIBUTOR_ABI,
    signerOrProvider: signer || provider,
  })
  
  return contract
}
```

### Event Listening

```javascript
import { useContractEvent } from 'wagmi'

export function useTicketEvents(contractAddress) {
  // Listen for ticket minting
  useContractEvent({
    address: contractAddress,
    abi: NFTICKET_ABI,
    eventName: 'TicketMinted',
    listener: (tokenId, to, uri) => {
      console.log(`Ticket ${tokenId} minted to ${to}`)
      // Update UI, send notifications, etc.
    },
  })
  
  // Listen for ticket transfers
  useContractEvent({
    address: contractAddress,
    abi: NFTICKET_ABI,
    eventName: 'TicketTransferred',
    listener: (tokenId, from, to, price, royalty) => {
      console.log(`Ticket ${tokenId} transferred for ${ethers.utils.formatEther(price)} ETH`)
      // Update analytics, send notifications, etc.
    },
  })
}
```

## Error Handling

### Standard Error Responses

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "address",
      "reason": "Invalid Ethereum address format"
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input parameters |
| `AUTHENTICATION_ERROR` | Authentication required or failed |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `CONTRACT_ERROR` | Smart contract interaction failed |
| `NETWORK_ERROR` | Blockchain network error |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server internal error |

### Smart Contract Error Handling

```javascript
async function handleContractCall(contractFunction) {
  try {
    const result = await contractFunction();
    return { success: true, data: result };
  } catch (error) {
    // Parse contract revert reasons
    if (error.reason) {
      return {
        success: false,
        error: {
          code: 'CONTRACT_ERROR',
          message: error.reason,
          type: 'revert'
        }
      };
    }
    
    // Handle gas estimation errors
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return {
        success: false,
        error: {
          code: 'CONTRACT_ERROR',
          message: 'Transaction would fail',
          type: 'gas_estimation'
        }
      };
    }
    
    // Handle user rejection
    if (error.code === 4001) {
      return {
        success: false,
        error: {
          code: 'USER_REJECTED',
          message: 'Transaction rejected by user',
          type: 'user_action'
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        type: 'unknown'
      }
    };
  }
}
```

## Rate Limiting

### API Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Read Operations | 100 requests | 1 minute |
| Write Operations | 20 requests | 1 minute |
| Contract Deployment | 5 requests | 1 hour |

### Rate Limit Headers

All API responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1627846261
```

### Handling Rate Limits

```javascript
async function apiCall(endpoint, options) {
  const response = await fetch(endpoint, options);
  
  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    const waitTime = (resetTime * 1000) - Date.now();
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return apiCall(endpoint, options);
  }
  
  return response.json();
}
```

## Authentication

### JWT Token Authentication

The dashboard API uses JWT tokens for authentication:

```javascript
// Login request
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    address: '0x1234567890123456789012345678901234567890',
    signature: 'signed_message'
  })
});

const { token } = await response.json();

// Use token in subsequent requests
const apiResponse = await fetch('/api/events', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});
```

### Wallet Signature Authentication

```javascript
async function authenticateWithWallet(address, signer) {
  // Get nonce from server
  const nonceResponse = await fetch(`/api/auth/nonce/${address}`);
  const { nonce } = await nonceResponse.json();
  
  // Sign message
  const message = `Sign this message to authenticate: ${nonce}`;
  const signature = await signer.signMessage(message);
  
  // Submit signature
  const authResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, nonce })
  });
  
  return authResponse.json();
}
```

---

This API reference provides comprehensive documentation for all components of the NFTicket Anti-Scalping Protocol. For additional examples and integration guides, refer to the main documentation and code samples in the repository.

