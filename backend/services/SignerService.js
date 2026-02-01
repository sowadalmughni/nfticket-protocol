const { ethers } = require("ethers");

// Configuration - should be environment variables in production
const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123"; 
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const NFTICKET_CONTRACT_ADDRESS = process.env.NFTICKET_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "31337");

const wallet = new ethers.Wallet(PRIVATE_KEY);

// Provider for on-chain verification
const provider = new ethers.JsonRpcProvider(RPC_URL);

// NFTicket contract ABI (minimal for ownership verification)
const NFTICKET_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function isTicketUsed(uint256 tokenId) view returns (bool)",
  "function getEventInfo() view returns (string name, string description, uint256 date, string venue, uint256 royaltyCap, uint256 maxPrice, address royaltyRecipient)"
];

const DOMAIN = {
  name: "NFTicket",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: NFTICKET_CONTRACT_ADDRESS
};

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
    this.contract = null;
  }

  /**
   * Get or create the NFTicket contract instance
   */
  getContract() {
    if (!this.contract && NFTICKET_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      this.contract = new ethers.Contract(NFTICKET_CONTRACT_ADDRESS, NFTICKET_ABI, provider);
    }
    return this.contract;
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
   * Verify on-chain ownership of a ticket
   */
  async verifyOnChainOwnership(tokenId, expectedOwner) {
    const contract = this.getContract();
    
    if (!contract) {
      // Contract not configured - skip on-chain verification in dev mode
      console.warn("NFTicket contract not configured - skipping on-chain verification");
      return { valid: true, reason: "dev-mode" };
    }

    try {
      // Check if the ticket exists and get owner
      const actualOwner = await contract.ownerOf(tokenId);
      
      if (actualOwner.toLowerCase() !== expectedOwner.toLowerCase()) {
        return { 
          valid: false, 
          reason: `Token ${tokenId} is not owned by ${expectedOwner}` 
        };
      }

      // Check if the ticket has been used
      const isUsed = await contract.isTicketUsed(tokenId);
      
      if (isUsed) {
        return { 
          valid: false, 
          reason: `Token ${tokenId} has already been used` 
        };
      }

      return { valid: true, actualOwner };
    } catch (error) {
      // Token might not exist
      if (error.message.includes("nonexistent token") || error.message.includes("invalid token")) {
        return { valid: false, reason: `Token ${tokenId} does not exist` };
      }
      
      console.error("On-chain verification error:", error);
      return { valid: false, reason: "Failed to verify on-chain ownership" };
    }
  }

  /**
   * Generate a signed ticket proof
   */
  async generateTicketProof(tokenId, ownerAddress) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1000000);

    const value = {
      tokenId: BigInt(tokenId),
      owner: ownerAddress,
      timestamp,
      nonce
    };

    const signature = await wallet.signTypedData(DOMAIN, TYPES, value);

    return {
      data: {
        tokenId: Number(tokenId),
        owner: ownerAddress,
        timestamp,
        nonce
      },
      signature,
      expiresAt: timestamp + 60 // Proof valid for 60 seconds
    };
  }

  /**
   * Verify a ticket proof signature and expiration
   */
  verifyTicketProof(value, signature) {
    try {
      const recoveredAddress = ethers.verifyTypedData(DOMAIN, TYPES, value, signature);
      
      // Check 1: Signature is valid (recovered address matches our signer)
      if (recoveredAddress.toLowerCase() !== wallet.address.toLowerCase()) {
        return { valid: false, reason: "Invalid signature" };
      }

      // Check 2: Timestamp is within acceptable window (60 seconds)
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (currentTimestamp - value.timestamp > 60) {
        return { valid: false, reason: "Proof expired" };
      }

      return { valid: true, signer: recoveredAddress };
    } catch (error) {
      console.error("Proof verification error:", error);
      return { valid: false, reason: "Invalid proof format" };
    }
  }

  /**
   * Get the signer's address (for debugging)
   */
  getSignerAddress() {
    return wallet.address;
  }
}

module.exports = new SignerService();
