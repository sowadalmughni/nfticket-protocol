/**
 * Wagmi Configuration
 * Web3 configuration using viem and wagmi for NFTicket dashboard
 * Multi-chain support: Polygon (primary), Ethereum, Base, Arbitrum
 * @author Sowad Al-Mughni
 */

import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon, polygonAmoy, base, arbitrum, baseSepolia, arbitrumSepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// WalletConnect project ID - get from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''
if (!projectId) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID not set - WalletConnect will not work')
}

// Supported chains - Polygon is primary (lowest gas + fast finality)
export const SUPPORTED_CHAINS = [
  // Mainnets - Polygon first as recommended chain
  polygon,    // Primary chain - low gas, fast
  base,       // Coinbase L2 - very low gas
  arbitrum,   // Arbitrum One - popular L2
  mainnet,    // Ethereum L1 - high gas, use sparingly
  // Testnets
  polygonAmoy,   // Polygon testnet (replacing Mumbai)
  sepolia,
  baseSepolia,
  arbitrumSepolia,
]

export const config = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    injected(),
    metaMask(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    // Mainnets
    [polygon.id]: http(import.meta.env.VITE_RPC_POLYGON || 'https://rpc.ankr.com/polygon'),
    [base.id]: http(import.meta.env.VITE_RPC_BASE || 'https://mainnet.base.org'),
    [arbitrum.id]: http(import.meta.env.VITE_RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc'),
    [mainnet.id]: http(import.meta.env.VITE_RPC_MAINNET || 'https://rpc.ankr.com/eth'),
    // Testnets
    [polygonAmoy.id]: http(import.meta.env.VITE_RPC_POLYGON_AMOY || 'https://rpc-amoy.polygon.technology'),
    [sepolia.id]: http(import.meta.env.VITE_RPC_SEPOLIA || 'https://rpc.ankr.com/eth_sepolia'),
    [baseSepolia.id]: http(import.meta.env.VITE_RPC_BASE_SEPOLIA || 'https://sepolia.base.org'),
    [arbitrumSepolia.id]: http(import.meta.env.VITE_RPC_ARBITRUM_SEPOLIA || 'https://sepolia-rollup.arbitrum.io/rpc'),
  },
})

// Chain metadata for UI
export const CHAIN_INFO = {
  [polygon.id]: { name: 'Polygon', icon: '🟣', color: '#8247E5', gasEstimate: 'low', recommended: true },
  [base.id]: { name: 'Base', icon: '🔵', color: '#0052FF', gasEstimate: 'very-low' },
  [arbitrum.id]: { name: 'Arbitrum', icon: '🔷', color: '#28A0F0', gasEstimate: 'low' },
  [mainnet.id]: { name: 'Ethereum', icon: '⟠', color: '#627EEA', gasEstimate: 'high' },
  [polygonAmoy.id]: { name: 'Polygon Amoy', icon: '🧪', color: '#8247E5', gasEstimate: 'free', testnet: true },
  [sepolia.id]: { name: 'Sepolia', icon: '🧪', color: '#CFB5F0', gasEstimate: 'free', testnet: true },
  [baseSepolia.id]: { name: 'Base Sepolia', icon: '🧪', color: '#0052FF', gasEstimate: 'free', testnet: true },
  [arbitrumSepolia.id]: { name: 'Arbitrum Sepolia', icon: '🧪', color: '#28A0F0', gasEstimate: 'free', testnet: true },
}

// Contract addresses for different networks
// These will be populated after deployment - run `npm run deploy:sepolia` first
export const CONTRACT_ADDRESSES = {
  // Mainnets - Deploy to Polygon first (primary chain)
  [polygon.id]: {
    nfticket: import.meta.env.VITE_CONTRACT_POLYGON_NFTICKET || null,
    poapDistributor: import.meta.env.VITE_CONTRACT_POLYGON_POAP || null,
    loyaltyPoints: import.meta.env.VITE_CONTRACT_POLYGON_LOYALTY || null,
  },
  [base.id]: {
    nfticket: import.meta.env.VITE_CONTRACT_BASE_NFTICKET || null,
    poapDistributor: import.meta.env.VITE_CONTRACT_BASE_POAP || null,
    loyaltyPoints: import.meta.env.VITE_CONTRACT_BASE_LOYALTY || null,
  },
  [arbitrum.id]: {
    nfticket: import.meta.env.VITE_CONTRACT_ARBITRUM_NFTICKET || null,
    poapDistributor: import.meta.env.VITE_CONTRACT_ARBITRUM_POAP || null,
    loyaltyPoints: import.meta.env.VITE_CONTRACT_ARBITRUM_LOYALTY || null,
  },
  [mainnet.id]: {
    nfticket: import.meta.env.VITE_CONTRACT_MAINNET_NFTICKET || null,
    poapDistributor: import.meta.env.VITE_CONTRACT_MAINNET_POAP || null,
    loyaltyPoints: import.meta.env.VITE_CONTRACT_MAINNET_LOYALTY || null,
  },
  // Testnets - Deploy here first for testing
  [polygonAmoy.id]: {
    nfticket: import.meta.env.VITE_CONTRACT_AMOY_NFTICKET || null,
    poapDistributor: import.meta.env.VITE_CONTRACT_AMOY_POAP || null,
    loyaltyPoints: import.meta.env.VITE_CONTRACT_AMOY_LOYALTY || null,
  },
  [sepolia.id]: {
    nfticket: import.meta.env.VITE_CONTRACT_SEPOLIA_NFTICKET || null,
    poapDistributor: import.meta.env.VITE_CONTRACT_SEPOLIA_POAP || null,
    loyaltyPoints: import.meta.env.VITE_CONTRACT_SEPOLIA_LOYALTY || null,
  },
  [baseSepolia.id]: {
    nfticket: import.meta.env.VITE_CONTRACT_BASE_SEPOLIA_NFTICKET || null,
    poapDistributor: import.meta.env.VITE_CONTRACT_BASE_SEPOLIA_POAP || null,
    loyaltyPoints: import.meta.env.VITE_CONTRACT_BASE_SEPOLIA_LOYALTY || null,
  },
  [arbitrumSepolia.id]: {
    nfticket: import.meta.env.VITE_CONTRACT_ARBITRUM_SEPOLIA_NFTICKET || null,
    poapDistributor: import.meta.env.VITE_CONTRACT_ARBITRUM_SEPOLIA_POAP || null,
    loyaltyPoints: import.meta.env.VITE_CONTRACT_ARBITRUM_SEPOLIA_LOYALTY || null,
  },
}

/**
 * Get contract address for current chain
 * @param {number} chainId - The chain ID
 * @param {string} contractName - 'nfticket' | 'poapDistributor' | 'loyaltyPoints'
 * @returns {string|null} Contract address or null if not deployed
 */
export function getContractAddress(chainId, contractName) {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) {
    console.warn(`No contract addresses configured for chain ${chainId}`)
    return null
  }
  const address = addresses[contractName]
  if (!address) {
    console.warn(`Contract ${contractName} not deployed on chain ${chainId}`)
    return null
  }
  return address
}

/**
 * Check if contracts are deployed on a chain
 */
export function isChainDeployed(chainId) {
  const addresses = CONTRACT_ADDRESSES[chainId]
  return addresses && addresses.nfticket && addresses.nfticket !== null
}

/**
 * Check if a chain is a testnet
 */
export function isTestnet(chainId) {
  return [sepolia.id, polygonAmoy.id, baseSepolia.id, arbitrumSepolia.id].includes(chainId)
}

/**
 * Get recommended chain for new users (Polygon - low gas + fast)
 */
export function getRecommendedChain() {
  return polygon
}

/**
 * Get recommended testnet for development
 */
export function getRecommendedTestnet() {
  return polygonAmoy // Polygon's current testnet
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

