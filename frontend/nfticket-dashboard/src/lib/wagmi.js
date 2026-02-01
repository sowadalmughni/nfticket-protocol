/**
 * Wagmi Configuration
 * Web3 configuration using viem and wagmi for NFTicket dashboard
 * Multi-chain support: Ethereum, Polygon, Base, Arbitrum
 * @author Sowad Al-Mughni
 */

import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon, base, arbitrum, baseSepolia, arbitrumSepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// WalletConnect project ID (you would get this from WalletConnect Cloud)
const projectId = process.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-walletconnect-project-id'

// Supported chains - prioritize L2s for lower gas fees
export const SUPPORTED_CHAINS = [
  // Mainnets
  mainnet,
  polygon,
  base,       // Coinbase L2 - very low gas
  arbitrum,   // Arbitrum One - popular L2
  // Testnets
  sepolia,
  baseSepolia,
  arbitrumSepolia,
]

export const config = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    // Mainnets
    [mainnet.id]: http('https://rpc.ankr.com/eth'),
    [polygon.id]: http('https://rpc.ankr.com/polygon'),
    [base.id]: http('https://mainnet.base.org'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    // Testnets
    [sepolia.id]: http('https://rpc.ankr.com/eth_sepolia'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
  },
})

// Chain metadata for UI
export const CHAIN_INFO = {
  [mainnet.id]: { name: 'Ethereum', icon: '⟠', color: '#627EEA', gasEstimate: 'high' },
  [polygon.id]: { name: 'Polygon', icon: '🟣', color: '#8247E5', gasEstimate: 'low' },
  [base.id]: { name: 'Base', icon: '🔵', color: '#0052FF', gasEstimate: 'very-low' },
  [arbitrum.id]: { name: 'Arbitrum', icon: '🔷', color: '#28A0F0', gasEstimate: 'low' },
  [sepolia.id]: { name: 'Sepolia', icon: '🧪', color: '#CFB5F0', gasEstimate: 'free' },
  [baseSepolia.id]: { name: 'Base Sepolia', icon: '🧪', color: '#0052FF', gasEstimate: 'free' },
  [arbitrumSepolia.id]: { name: 'Arbitrum Sepolia', icon: '🧪', color: '#28A0F0', gasEstimate: 'free' },
}

// Contract addresses for different networks
// Update these after deploying contracts to each chain
export const CONTRACT_ADDRESSES = {
  [mainnet.id]: {
    nfticket: '0x...', // Replace with actual deployed contract address
    poapDistributor: '0x...', // Replace with actual deployed contract address
  },
  [polygon.id]: {
    nfticket: '0x...', // Replace with actual deployed contract address
    poapDistributor: '0x...', // Replace with actual deployed contract address
  },
  [base.id]: {
    nfticket: '0x...', // Deploy to Base for lowest gas
    poapDistributor: '0x...',
  },
  [arbitrum.id]: {
    nfticket: '0x...', // Deploy to Arbitrum
    poapDistributor: '0x...',
  },
  [sepolia.id]: {
    nfticket: '0x...', // Replace with actual deployed contract address
    poapDistributor: '0x...', // Replace with actual deployed contract address
  },
  [baseSepolia.id]: {
    nfticket: '0x...', // Deploy to Base Sepolia for testing
    poapDistributor: '0x...',
  },
  [arbitrumSepolia.id]: {
    nfticket: '0x...', // Deploy to Arbitrum Sepolia for testing
    poapDistributor: '0x...',
  },
}

/**
 * Get contract address for current chain
 */
export function getContractAddress(chainId, contractName) {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) {
    console.warn(`No contract addresses configured for chain ${chainId}`)
    return null
  }
  return addresses[contractName] || null
}

/**
 * Check if a chain is a testnet
 */
export function isTestnet(chainId) {
  return [sepolia.id, baseSepolia.id, arbitrumSepolia.id].includes(chainId)
}

/**
 * Get recommended chain for new users (lowest gas)
 */
export function getRecommendedChain() {
  return base // Base has very low gas fees
}

// Contract ABIs
export const NFTICKET_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function getTicketInfo(uint256 tokenId) view returns (address owner, string uri, bool used, uint256 origPrice)',
  'function getEventInfo() view returns (string name, string description, uint256 date, string venue)',
  'function mintTicket(address to, string uri, uint256 price) returns (uint256)',
  'function useTicket(uint256 tokenId)',
  'function transferWithPrice(address from, address to, uint256 tokenId, uint256 salePrice) payable',
  'function setRoyaltyCap(uint256 _royaltyCap)',
  'function setMaxPrice(uint256 _maxPrice)',
  'function setRoyaltyRecipient(address _royaltyRecipient)',
  'function royaltyCap() view returns (uint256)',
  'function maxPrice() view returns (uint256)',
  'function royaltyRecipient() view returns (address)',
  'event TicketMinted(uint256 indexed tokenId, address indexed to, string uri)',
  'event TicketTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price, uint256 royaltyAmount)',
  'event TicketUsed(uint256 indexed tokenId, address indexed owner)',
]

export const POAP_DISTRIBUTOR_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function getEventInfo() view returns (string name, string description, uint256 date, string location, uint256 claimed, uint256 maxSup, bool active)',
  'function hasClaimedPOAP(address claimer) view returns (bool)',
  'function claimPOAP(address claimer, address nfticketContract, uint256 ticketId)',
  'function claimPOAPDirect(address claimer)',
  'function batchClaimPOAP(address[] claimers)',
  'function setDistributionActive(bool active)',
  'function setMaxSupply(uint256 _maxSupply)',
  'function setBaseTokenURI(string _baseTokenURI)',
  'function remainingSupply() view returns (uint256)',
  'function totalClaimed() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function distributionActive() view returns (bool)',
  'event POAPClaimed(address indexed claimer, uint256 indexed tokenId)',
  'event DistributionStatusChanged(bool active)',
  'event MaxSupplyUpdated(uint256 newMaxSupply)',
]

export default config

