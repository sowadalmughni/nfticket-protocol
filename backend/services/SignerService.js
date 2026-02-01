const { ethers } = require("ethers");
const nonceStorage = require("./NonceStorage");

// Configuration - REQUIRED environment variables
if (!process.env.SIGNER_PRIVATE_KEY) {
  throw new Error('SIGNER_PRIVATE_KEY environment variable is required');
}
const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const DEFAULT_CHAIN_ID = parseInt(process.env.CHAIN_ID || "11155111"); // Default to Sepolia

// Initialize Redis connection (async, falls back to in-memory)
nonceStorage.initRedis().then(connected => {
  if (connected) {
    console.log('[SignerService] Using Redis for nonce storage');
  } else {
    console.log('[SignerService] Using in-memory nonce storage (development mode)');
  }
});

// Multi-chain RPC Configuration
const RPC_URLS = {
  1: process.env.RPC_URL_MAINNET || 'https://rpc.ankr.com/eth',
  137: process.env.RPC_URL_POLYGON || 'https://rpc.ankr.com/polygon',
  8453: process.env.RPC_URL_BASE || 'https://mainnet.base.org',
  42161: process.env.RPC_URL_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
  11155111: process.env.RPC_URL_SEPOLIA || 'https://rpc.ankr.com/eth_sepolia',
  84532: process.env.RPC_URL_BASE_SEPOLIA || 'https://sepolia.base.org',
  421614: process.env.RPC_URL_ARBITRUM_SEPOLIA || 'https://sepolia-rollup.arbitrum.io/rpc',
  31337: process.env.RPC_URL || 'http://127.0.0.1:8545', // Local
};

// Multi-chain Contract Addresses
const CONTRACT_ADDRESSES = {
  1: process.env.CONTRACT_MAINNET || '0x0000000000000000000000000000000000000000',
  137: process.env.CONTRACT_POLYGON || '0x0000000000000000000000000000000000000000',
  8453: process.env.CONTRACT_BASE || '0x0000000000000000000000000000000000000000',
  42161: process.env.CONTRACT_ARBITRUM || '0x0000000000000000000000000000000000000000',
  11155111: process.env.CONTRACT_SEPOLIA || '0x0000000000000000000000000000000000000000',
  84532: process.env.CONTRACT_BASE_SEPOLIA || '0x0000000000000000000000000000000000000000',
  421614: process.env.CONTRACT_ARBITRUM_SEPOLIA || '0x0000000000000000000000000000000000000000',
  31337: process.env.NFTICKET_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
};

// Rotating QR Configuration
const PROOF_EXPIRATION_SECONDS = parseInt(process.env.PROOF_EXPIRATION || "15"); // 15 seconds for rotating QR

const wallet = new ethers.Wallet(PRIVATE_KEY);

// Provider cache for multi-chain
const providers = new Map();

// Get or create provider for a chain
function getProvider(chainId) {
  if (!providers.has(chainId)) {
    const rpcUrl = RPC_URLS[chainId] || RPC_URLS[31337];
    providers.set(chainId, new ethers.JsonRpcProvider(rpcUrl));
  }
  return providers.get(chainId);
}

// NFTicket contract ABI (minimal for ownership verification)
const NFTICKET_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function isTicketUsed(uint256 tokenId) view returns (bool)",
  "function getEventInfo() view returns (string name, string description, uint256 date, string venue, uint256 royaltyCap, uint256 maxPrice, address royaltyRecipient)"
];

// Create domain for a specific chain
function createDomain(chainId, contractAddress) {
  return {
    name: "NFTicket",
    version: "1",
    chainId: chainId,
    verifyingContract: contractAddress
  };
}

// Default domain (for backward compatibility)
const DOMAIN = createDomain(DEFAULT_CHAIN_ID, CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID]);

const TYPES = {
  TicketProof: [
    { name: "tokenId", type: "uint256" },
    { name: "owner", type: "address" },
    { name: "timestamp", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ]
};

class SignerService {
  constructor() {
    this.contracts = new Map(); // Cache contracts per chain
  }

  /**
   * Get supported chain IDs
   */
  getSupportedChains() {
    return Object.keys(CONTRACT_ADDRESSES).map(id => parseInt(id));
  }

  /**
   * Get or create the NFTicket contract instance for a specific chain
   */
  getContract(chainId = DEFAULT_CHAIN_ID) {
    const contractAddress = CONTRACT_ADDRESSES[chainId];
    
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    const cacheKey = `${chainId}-${contractAddress}`;
    
    if (!this.contracts.has(cacheKey)) {
      const provider = getProvider(chainId);
      this.contracts.set(cacheKey, new ethers.Contract(contractAddress, NFTICKET_ABI, provider));
    }
    
    return this.contracts.get(cacheKey);
  }

  /**
   * Verify wallet signature for authentication
   */
  async verifyWalletSignature(address, message, signature) {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Verify on-chain ownership of a ticket (multi-chain support)
   * @param {number} tokenId - The token ID to verify
   * @param {string} expectedOwner - Expected owner address
   * @param {number} chainId - Chain ID to verify on
   */
  async verifyOnChainOwnership(tokenId, expectedOwner, chainId = DEFAULT_CHAIN_ID) {
    const contract = this.getContract(chainId);
    
    if (!contract) {
      // Contract not configured - skip on-chain verification in dev mode
      console.warn(`NFTicket contract not configured for chain ${chainId} - skipping on-chain verification`);
      return { valid: true, reason: "dev-mode", chainId };
    }

    try {
      // Check if the ticket exists and get owner
      const actualOwner = await contract.ownerOf(tokenId);
      
      if (actualOwner.toLowerCase() !== expectedOwner.toLowerCase()) {
        return { 
          valid: false, 
          reason: `Token ${tokenId} is not owned by ${expectedOwner}`,
          chainId
        };
      }

      // Check if the ticket has been used
      const isUsed = await contract.isTicketUsed(tokenId);
      
      if (isUsed) {
        return { 
          valid: false, 
          reason: `Token ${tokenId} has already been used`,
          chainId
        };
      }

      return { valid: true, actualOwner, chainId };
    } catch (error) {
      // Token might not exist
      if (error.message.includes("nonexistent token") || error.message.includes("invalid token")) {
        return { valid: false, reason: `Token ${tokenId} does not exist`, chainId };
      }
      
      console.error("On-chain verification error:", error);
      return { valid: false, reason: "Failed to verify on-chain ownership", chainId };
    }
  }

  /**
   * Generate a signed ticket proof with rotating nonce (multi-chain support)
   * Proofs expire in 15 seconds (configurable via PROOF_EXPIRATION)
   * @param {number} tokenId - The token ID
   * @param {string} ownerAddress - Owner's address
   * @param {number} chainId - Chain ID for the proof domain
   */
  async generateTicketProof(tokenId, ownerAddress, chainId = DEFAULT_CHAIN_ID) {
    const timestamp = Math.floor(Date.now() / 1000);
    // Cryptographically secure nonce to prevent guessing
    const nonce = parseInt(ethers.hexlify(ethers.randomBytes(4)), 16);

    const contractAddress = CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];
    const domain = createDomain(chainId, contractAddress);

    const value = {
      tokenId: BigInt(tokenId),
      owner: ownerAddress,
      timestamp,
      nonce
    };

    const signature = await wallet.signTypedData(domain, TYPES, value);
    const expiresAt = timestamp + PROOF_EXPIRATION_SECONDS;

    return {
      data: {
        tokenId: Number(tokenId),
        owner: ownerAddress,
        timestamp,
        nonce,
        chainId // Include chain ID in proof data
      },
      signature,
      expiresAt,
      chainId,
      // Client hint: refresh before expiration
      refreshIn: Math.max(PROOF_EXPIRATION_SECONDS - 3, 5) // Refresh 3 seconds before expiry
    };
  }

  /**
   * Verify a ticket proof signature, expiration, and nonce (replay prevention)
   * Now uses persistent NonceStorage (Redis or in-memory fallback)
   */
  async verifyTicketProof(value, signature) {
    try {
      const recoveredAddress = ethers.verifyTypedData(DOMAIN, TYPES, value, signature);
      
      // Check 1: Signature is valid (recovered address matches our signer)
      if (recoveredAddress.toLowerCase() !== wallet.address.toLowerCase()) {
        return { valid: false, reason: "Invalid signature" };
      }

      // Check 2: Timestamp is within acceptable window
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (currentTimestamp - value.timestamp > PROOF_EXPIRATION_SECONDS) {
        return { valid: false, reason: "Proof expired" };
      }

      // Check 3: Nonce has not been used (replay attack prevention)
      const nonceKey = `${value.tokenId}-${value.nonce}`;
      const alreadyUsed = await nonceStorage.isNonceUsed(nonceKey);
      if (alreadyUsed) {
        return { valid: false, reason: "Proof already used (replay detected)" };
      }

      // Mark nonce as used with expiration time
      const expiresAt = currentTimestamp + PROOF_EXPIRATION_SECONDS + 60; // Keep for 60s after expiry
      await nonceStorage.markNonceUsed(nonceKey, expiresAt);

      return { 
        valid: true, 
        signer: recoveredAddress,
        tokenId: value.tokenId,
        owner: value.owner
      };
    } catch (error) {
      console.error("Proof verification error:", error);
      return { valid: false, reason: "Invalid proof format" };
    }
  }

  /**
   * Get current proof expiration setting
   */
  getProofExpiration() {
    return PROOF_EXPIRATION_SECONDS;
  }

  /**
   * Get nonce storage stats (for monitoring)
   */
  async getNonceStats() {
    const stats = await nonceStorage.getStats();
    return {
      ...stats,
      expirationSeconds: PROOF_EXPIRATION_SECONDS
    };
  }

  /**
   * Get the signer's address (for debugging)
   */
  getSignerAddress() {
    return wallet.address;
  }
}

module.exports = new SignerService();
