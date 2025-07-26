/**
 * TicketService
 * Manages NFT ticket interactions and data
 * @author Sowad Al-Mughni
 */

import React, { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletService';

// NFTicket contract ABI (simplified for mobile app)
const NFT_TICKET_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function getTicketInfo(uint256 tokenId) view returns (address owner, string uri, bool used, uint256 origPrice)',
  'function getEventInfo() view returns (string name, string description, uint256 date, string venue)',
  'function useTicket(uint256 tokenId)',
  'function transferWithPrice(address from, address to, uint256 tokenId, uint256 salePrice) payable',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function ticketUsed(uint256 tokenId) view returns (bool)',
];

const TicketContext = createContext();

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};

export const TicketProvider = ({ children }) => {
  const { signer, address, provider } = useWallet();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Contract addresses (these would be deployed contract addresses)
  const CONTRACT_ADDRESSES = {
    ethereum: '0x...', // Replace with actual deployed contract address
    polygon: '0x...', // Replace with actual deployed contract address
    sepolia: '0x...', // Replace with actual deployed contract address
  };

  const getContract = (contractAddress) => {
    if (!provider) {
      throw new Error('Provider not available');
    }
    return new ethers.Contract(contractAddress, NFT_TICKET_ABI, signer || provider);
  };

  const refreshTickets = async () => {
    if (!address || !provider) {
      return;
    }

    try {
      setLoading(true);
      const allTickets = [];

      // For demo purposes, we'll use a mock contract address
      // In production, you'd iterate through known contract addresses
      const mockContractAddress = CONTRACT_ADDRESSES.sepolia || '0x1234567890123456789012345678901234567890';
      
      try {
        const contract = getContract(mockContractAddress);
        const balance = await contract.balanceOf(address);
        
        for (let i = 0; i < balance.toNumber(); i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i);
          const ticketInfo = await contract.getTicketInfo(tokenId);
          const eventInfo = await contract.getEventInfo();
          
          const ticket = {
            tokenId: tokenId.toNumber(),
            contractAddress: mockContractAddress,
            owner: ticketInfo.owner,
            uri: ticketInfo.uri,
            isUsed: ticketInfo.used,
            originalPrice: ethers.utils.formatEther(ticketInfo.origPrice),
            eventName: eventInfo.name,
            eventDescription: eventInfo.description,
            eventDate: eventInfo.date.toNumber(),
            eventVenue: eventInfo.venue,
            qrData: `nfticket://${mockContractAddress}/${tokenId.toNumber()}`,
          };
          
          allTickets.push(ticket);
        }
      } catch (error) {
        console.log('Contract not found or error fetching tickets:', error.message);
        // For demo purposes, add mock tickets
        allTickets.push(...getMockTickets());
      }

      setTickets(allTickets);
    } catch (error) {
      console.error('Error refreshing tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockTickets = () => {
    return [
      {
        tokenId: 1,
        contractAddress: '0x1234567890123456789012345678901234567890',
        owner: address,
        uri: 'https://example.com/ticket/1',
        isUsed: false,
        originalPrice: '0.1',
        eventName: 'Web3 Conference 2024',
        eventDescription: 'The premier Web3 and blockchain conference',
        eventDate: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
        eventVenue: 'Convention Center, San Francisco',
        qrData: 'nfticket://0x1234567890123456789012345678901234567890/1',
      },
      {
        tokenId: 2,
        contractAddress: '0x1234567890123456789012345678901234567890',
        owner: address,
        uri: 'https://example.com/ticket/2',
        isUsed: true,
        originalPrice: '0.05',
        eventName: 'NFT Art Gallery Opening',
        eventDescription: 'Exclusive NFT art exhibition opening night',
        eventDate: Math.floor(Date.now() / 1000) - 86400, // Yesterday
        eventVenue: 'Modern Art Museum, New York',
        qrData: 'nfticket://0x1234567890123456789012345678901234567890/2',
      },
    ];
  };

  const useTicket = async (tokenId) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const ticket = tickets.find(t => t.tokenId === tokenId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const contract = getContract(ticket.contractAddress);
      const tx = await contract.useTicket(tokenId);
      await tx.wait();

      // Update local state
      setTickets(prevTickets =>
        prevTickets.map(t =>
          t.tokenId === tokenId ? { ...t, isUsed: true } : t
        )
      );

      return tx;
    } catch (error) {
      console.error('Error using ticket:', error);
      throw error;
    }
  };

  const transferTicket = async (tokenId, toAddress, salePrice = 0) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const ticket = tickets.find(t => t.tokenId === tokenId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const contract = getContract(ticket.contractAddress);
      const tx = await contract.transferWithPrice(
        address,
        toAddress,
        tokenId,
        ethers.utils.parseEther(salePrice.toString()),
        { value: ethers.utils.parseEther(salePrice.toString()) }
      );
      await tx.wait();

      // Refresh tickets after transfer
      await refreshTickets();

      return tx;
    } catch (error) {
      console.error('Error transferring ticket:', error);
      throw error;
    }
  };

  const getTicketMetadata = async (uri) => {
    try {
      const response = await fetch(uri);
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Error fetching ticket metadata:', error);
      return null;
    }
  };

  const generateOfflineSignature = async (ticketId, timestamp) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const message = `Use ticket ${ticketId} at ${timestamp}`;
      const signature = await signer.signMessage(message);
      
      return {
        message,
        signature,
        timestamp,
        ticketId,
        address,
      };
    } catch (error) {
      console.error('Error generating offline signature:', error);
      throw error;
    }
  };

  const value = {
    tickets,
    loading,
    refreshTickets,
    useTicket,
    transferTicket,
    getTicketMetadata,
    generateOfflineSignature,
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};

export default TicketService;

