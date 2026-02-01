const { ethers } = require("ethers");

// Simulation: In a real app, this would be the wallet of the user wishing to prove ownership,
// or a dedicated "Validator Oracle" key if we are doing server-side signing.
// For "Rotating QR", the SERVER (or TEE) signs a short-lived proof that the user owns the ticket.
const PRIVATE_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123"; 
const wallet = new ethers.Wallet(PRIVATE_KEY);

const DOMAIN = {
  name: "NFTicket",
  version: "1",
  chainId: 31337, // Hardhat Localhost
  verifyingContract: "0x0000000000000000000000000000000000000000" // Placeholder
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
  async generateTicketProof(tokenId, ownerAddress) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1000000);

    const value = {
      tokenId,
      owner: ownerAddress,
      timestamp,
      nonce
    };

    const signature = await wallet.signTypedData(DOMAIN, TYPES, value);

    return {
      data: value,
      signature
    };
  }

  verifyTicketProof(value, signature) {
    const recoveredAddress = ethers.verifyTypedData(DOMAIN, TYPES, value, signature);
    
    // Check 1: Signature is valid (recovered address matches our signer)
    // In a real user-signed scenario, we would check if recoveredAddress == value.owner
    // and if value.owner actually owns the token on-chain.
    if (recoveredAddress !== wallet.address) {
      return { valid: false, reason: "Invalid signature" };
    }

    // Check 2: Timestamp is within acceptable window (e.g., 60 seconds)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - value.timestamp > 60) {
      return { valid: false, reason: "Proof expired" };
    }

    return { valid: true, signer: recoveredAddress };
  }
}

module.exports = new SignerService();
