/**
 * GraphQL Client Configuration
 * Apollo Client setup for querying the NFTicket subgraph
 * @author Sowad Al-Mughni
 */

import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

// Subgraph endpoints for different networks
const SUBGRAPH_URLS = {
  1: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-mainnet/version/latest',
  11155111: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-sepolia/version/latest',
  137: 'https://api.studio.thegraph.com/query/YOUR_ID/nfticket-polygon/version/latest',
  31337: 'http://localhost:8000/subgraphs/name/nfticket-protocol', // Local Graph Node
}

// Create Apollo Client for a specific chain
export function createGraphClient(chainId) {
  const uri = SUBGRAPH_URLS[chainId] || SUBGRAPH_URLS[31337]
  
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
