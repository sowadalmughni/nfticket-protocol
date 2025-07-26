/**
 * Wagmi Configuration
 * Web3 configuration using viem and wagmi for NFTicket dashboard
 * @author Sowad Al-Mughni
 */

import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// WalletConnect project ID (you would get this from WalletConnect Cloud)
const projectId = 'your-walletconnect-project-id'

export const config = createConfig({
  chains: [mainnet, sepolia, polygon],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http('https://rpc.ankr.com/eth'),
    [sepolia.id]: http('https://rpc.ankr.com/eth_sepolia'),
    [polygon.id]: http('https://rpc.ankr.com/polygon'),
  },
})

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  [mainnet.id]: {
    nfticket: '0x...', // Replace with actual deployed contract address
    poapDistributor: '0x...', // Replace with actual deployed contract address
  },
  [sepolia.id]: {
    nfticket: '0x...', // Replace with actual deployed contract address
    poapDistributor: '0x...', // Replace with actual deployed contract address
  },
  [polygon.id]: {
    nfticket: '0x...', // Replace with actual deployed contract address
    poapDistributor: '0x...', // Replace with actual deployed contract address
  },
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

