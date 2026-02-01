/**
 * NFTicket Mobile App - Centralized Configuration
 * All network and contract configuration in one place
 * Reads from environment variables for easy customization
 * @author Sowad Al-Mughni
 */

import Config from 'react-native-config';

// ==================
// Network Definitions
// ==================

export const NETWORKS = {
  polygon: {
    chainId: 137,
    name: 'Polygon',
    displayName: 'Polygon Mainnet',
    rpcUrl: Config.RPC_URL_POLYGON || 'https://rpc.ankr.com/polygon',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    isTestnet: false,
  },
  polygon_amoy: {
    chainId: 80002,
    name: 'Polygon Amoy',
    displayName: 'Polygon Amoy Testnet',
    rpcUrl: Config.RPC_URL_POLYGON_AMOY || 'https://rpc-amoy.polygon.technology',
    blockExplorer: 'https://amoy.polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    isTestnet: true,
  },
  mainnet: {
    chainId: 1,
    name: 'Ethereum',
    displayName: 'Ethereum Mainnet',
    rpcUrl: Config.RPC_URL_MAINNET || 'https://rpc.ankr.com/eth',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    displayName: 'Sepolia Testnet',
    rpcUrl: Config.RPC_URL_SEPOLIA || 'https://rpc.ankr.com/eth_sepolia',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
  },
};

// ==================
// Contract Addresses
// ==================

/**
 * Contract addresses per network
 * Set via environment variables or update directly after deployment
 */
export const CONTRACT_ADDRESSES = {
  polygon: {
    nfticket: Config.CONTRACT_POLYGON_NFTICKET || null,
    poap: Config.CONTRACT_POLYGON_POAP || null,
    loyalty: Config.CONTRACT_POLYGON_LOYALTY || null,
  },
  polygon_amoy: {
    nfticket: Config.CONTRACT_AMOY_NFTICKET || null,
    poap: Config.CONTRACT_AMOY_POAP || null,
    loyalty: Config.CONTRACT_AMOY_LOYALTY || null,
  },
  mainnet: {
    nfticket: Config.CONTRACT_MAINNET_NFTICKET || null,
    poap: Config.CONTRACT_MAINNET_POAP || null,
    loyalty: Config.CONTRACT_MAINNET_LOYALTY || null,
  },
  sepolia: {
    nfticket: Config.CONTRACT_SEPOLIA_NFTICKET || null,
    poap: Config.CONTRACT_SEPOLIA_POAP || null,
    loyalty: Config.CONTRACT_SEPOLIA_LOYALTY || null,
  },
};

// ==================
// API Configuration
// ==================

export const API_CONFIG = {
  baseUrl: Config.API_URL || 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
};

// ==================
// WalletConnect
// ==================

export const WALLETCONNECT_CONFIG = {
  projectId: Config.WALLETCONNECT_PROJECT_ID || '',
  metadata: {
    name: 'NFTicket',
    description: 'Decentralized Event Ticketing',
    url: 'https://nfticket.io',
    icons: ['https://nfticket.io/icon.png'],
  },
};

// ==================
// Default Settings
// ==================

export const DEFAULT_NETWORK = Config.DEFAULT_NETWORK || 'polygon_amoy';

// ==================
// Helper Functions
// ==================

/**
 * Get the current network configuration
 */
export function getDefaultNetwork() {
  return NETWORKS[DEFAULT_NETWORK] || NETWORKS.polygon_amoy;
}

/**
 * Get contract addresses for a specific network
 * @param {string} networkKey - Network key (e.g., 'polygon', 'polygon_amoy')
 */
export function getContractAddresses(networkKey = DEFAULT_NETWORK) {
  return CONTRACT_ADDRESSES[networkKey] || CONTRACT_ADDRESSES.polygon_amoy;
}

/**
 * Get the NFTicket contract address for current network
 */
export function getNFTicketAddress(networkKey = DEFAULT_NETWORK) {
  const addresses = getContractAddresses(networkKey);
  return addresses?.nfticket;
}

/**
 * Get the POAP contract address for current network
 */
export function getPOAPAddress(networkKey = DEFAULT_NETWORK) {
  const addresses = getContractAddresses(networkKey);
  return addresses?.poap;
}

/**
 * Get the Loyalty contract address for current network
 */
export function getLoyaltyAddress(networkKey = DEFAULT_NETWORK) {
  const addresses = getContractAddresses(networkKey);
  return addresses?.loyalty;
}

/**
 * Check if contracts are configured for a network
 */
export function areContractsConfigured(networkKey = DEFAULT_NETWORK) {
  const addresses = getContractAddresses(networkKey);
  return !!(addresses?.nfticket && addresses?.poap);
}

/**
 * Get network by chain ID
 */
export function getNetworkByChainId(chainId) {
  return Object.values(NETWORKS).find(n => n.chainId === chainId);
}

/**
 * Get network key by chain ID
 */
export function getNetworkKeyByChainId(chainId) {
  return Object.keys(NETWORKS).find(key => NETWORKS[key].chainId === chainId);
}

/**
 * Get all available networks (with configured contracts only)
 */
export function getAvailableNetworks(onlyConfigured = false) {
  if (!onlyConfigured) {
    return Object.entries(NETWORKS).map(([key, network]) => ({
      key,
      ...network,
      hasContracts: areContractsConfigured(key),
    }));
  }
  
  return Object.entries(NETWORKS)
    .filter(([key]) => areContractsConfigured(key))
    .map(([key, network]) => ({ key, ...network, hasContracts: true }));
}

// ==================
// Validation
// ==================

/**
 * Validate configuration on app startup
 */
export function validateConfig() {
  const warnings = [];
  const errors = [];
  
  // Check WalletConnect
  if (!WALLETCONNECT_CONFIG.projectId) {
    warnings.push('WALLETCONNECT_PROJECT_ID not set - wallet connections may not work');
  }
  
  // Check default network contracts
  if (!areContractsConfigured(DEFAULT_NETWORK)) {
    warnings.push(`No contracts configured for ${DEFAULT_NETWORK} - app will run in demo mode`);
  }
  
  // Check API
  if (API_CONFIG.baseUrl === 'http://localhost:3001') {
    warnings.push('Using localhost API - update API_URL for production');
  }
  
  return { warnings, errors, isValid: errors.length === 0 };
}

export default {
  NETWORKS,
  CONTRACT_ADDRESSES,
  API_CONFIG,
  WALLETCONNECT_CONFIG,
  DEFAULT_NETWORK,
  getDefaultNetwork,
  getContractAddresses,
  getNFTicketAddress,
  getPOAPAddress,
  getLoyaltyAddress,
  areContractsConfigured,
  getNetworkByChainId,
  getNetworkKeyByChainId,
  getAvailableNetworks,
  validateConfig,
};
