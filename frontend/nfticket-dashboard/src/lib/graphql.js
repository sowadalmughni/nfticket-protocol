/**
 * GraphQL Client Configuration
 * Apollo Client setup for querying the NFTicket subgraph
 * Multi-chain support: Ethereum, Polygon, Base, Arbitrum
 * @author Sowad Al-Mughni
 */

import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

// Chain IDs
const CHAIN_IDS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  POLYGON: 137,
  BASE: 8453,
  ARBITRUM: 42161,
  BASE_SEPOLIA: 84532,
  ARBITRUM_SEPOLIA: 421614,
  LOCAL: 31337,
}

// Subgraph endpoints for different networks
// Update YOUR_ID with your actual Graph Studio deployment IDs
const SUBGRAPH_URLS = {
  // Mainnets
  [CHAIN_IDS.MAINNET]: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-mainnet/version/latest',
  [CHAIN_IDS.POLYGON]: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-polygon/version/latest',
  [CHAIN_IDS.BASE]: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-base/version/latest',
  [CHAIN_IDS.ARBITRUM]: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-arbitrum/version/latest',
  // Testnets
  [CHAIN_IDS.SEPOLIA]: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-sepolia/version/latest',
  [CHAIN_IDS.BASE_SEPOLIA]: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-base-sepolia/version/latest',
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-arbitrum-sepolia/version/latest',
  // Local development
  [CHAIN_IDS.LOCAL]: 'http://localhost:8000/subgraphs/name/nfticket-protocol',
}

// Check if subgraph is available for a chain
export function isSubgraphAvailable(chainId) {
  return chainId in SUBGRAPH_URLS
}

// Get all supported chain IDs
export function getSupportedChainIds() {
  return Object.keys(SUBGRAPH_URLS).map(id => parseInt(id))
}

// Create Apollo Client for a specific chain
export function createGraphClient(chainId) {
  const uri = SUBGRAPH_URLS[chainId] || SUBGRAPH_URLS[CHAIN_IDS.LOCAL]
  
  return new ApolloClient({
    uri,
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'network-only',
      },
    },
  })
}

// Multi-chain client manager
class MultiChainGraphClient {
  constructor() {
    this.clients = new Map()
  }

  getClient(chainId) {
    if (!this.clients.has(chainId)) {
      this.clients.set(chainId, createGraphClient(chainId))
    }
    return this.clients.get(chainId)
  }

  // Query across multiple chains
  async queryAllChains(query, variables = {}) {
    const chainIds = getSupportedChainIds().filter(id => id !== CHAIN_IDS.LOCAL)
    const results = await Promise.allSettled(
      chainIds.map(async (chainId) => {
        const client = this.getClient(chainId)
        const result = await client.query({ query, variables })
        return { chainId, data: result.data }
      })
    )
    
    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
  }
}

export const multiChainClient = new MultiChainGraphClient()

// GraphQL Queries

// Get tickets owned by an address
export const GET_MY_TICKETS = gql`
  query GetMyTickets($owner: String!) {
    tickets(where: { owner: $owner }, orderBy: tokenId, orderDirection: desc) {
      id
      tokenId
      owner {
        id
      }
      uri
      isUsed
      originalPrice
      price
      transfers {
        id
        price
        timestamp
      }
    }
  }
`

// Get all tickets with pagination
export const GET_ALL_TICKETS = gql`
  query GetAllTickets($first: Int!, $skip: Int!) {
    tickets(first: $first, skip: $skip, orderBy: tokenId, orderDirection: desc) {
      id
      tokenId
      owner {
        id
      }
      uri
      isUsed
      originalPrice
      price
    }
  }
`

// Get protocol statistics
export const GET_PROTOCOL_STATS = gql`
  query GetProtocolStats {
    protocolStats(id: "protocol") {
      totalTicketsMinted
      totalTicketsUsed
      totalVolume
      totalRoyalties
    }
  }
`

// Get recent transfers
export const GET_RECENT_TRANSFERS = gql`
  query GetRecentTransfers($first: Int!) {
    transfers(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      ticket {
        tokenId
      }
      from {
        id
      }
      to {
        id
      }
      price
      royaltyAmount
      timestamp
      transactionHash
    }
  }
`

// Get ticket by ID
export const GET_TICKET = gql`
  query GetTicket($tokenId: BigInt!) {
    tickets(where: { tokenId: $tokenId }) {
      id
      tokenId
      owner {
        id
      }
      uri
      isUsed
      originalPrice
      price
      transfers(orderBy: timestamp, orderDirection: desc) {
        id
        from {
          id
        }
        to {
          id
        }
        price
        royaltyAmount
        timestamp
        transactionHash
      }
    }
  }
`

// Get account info with tickets
export const GET_ACCOUNT = gql`
  query GetAccount($id: ID!) {
    account(id: $id) {
      id
      tickets {
        id
        tokenId
        isUsed
        originalPrice
      }
      marketplacesApproved {
        id
        marketplace
        isApproved
      }
    }
  }
`

// Search tickets by criteria
export const SEARCH_TICKETS = gql`
  query SearchTickets($isUsed: Boolean, $minPrice: BigInt, $maxPrice: BigInt) {
    tickets(
      where: { 
        isUsed: $isUsed,
        originalPrice_gte: $minPrice,
        originalPrice_lte: $maxPrice
      }
      orderBy: tokenId
      orderDirection: desc
      first: 100
    ) {
      id
      tokenId
      owner {
        id
      }
      uri
      isUsed
      originalPrice
      price
    }
  }
`

export default createGraphClient
