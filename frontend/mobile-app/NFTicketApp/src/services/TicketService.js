/**
 * TicketService
 * Manages NFT ticket interactions and data
 * Includes rotating QR code generation for anti-screenshot protection
 * @author Sowad Al-Mughni
 */

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletService';
import {
  API_CONFIG,
  getNFTicketAddress,
  areContractsConfigured,
  DEFAULT_NETWORK,
} from '../config';

// API Configuration
const API_BASE_URL = API_CONFIG.baseUrl;

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
  const { signer, address, provider, authToken } = useWallet();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Rotating QR state
  const [activeQRProof, setActiveQRProof] = useState(null);
  const [qrRefreshing, setQrRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);
  const lastProofTimestampRef = useRef(null);

  // Get contract address from centralized config
  const getContractAddress = () => {
    return getNFTicketAddress(DEFAULT_NETWORK);
  };

  // Check if contracts are configured
  const isConfigured = areContractsConfigured(DEFAULT_NETWORK);

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

      // Get configured contract address, fall back to demo mode if not configured
      const contractAddress = getContractAddress();
      
      if (!contractAddress) {
        // Demo mode - use mock tickets when no contracts configured
        console.log('No contracts configured - running in demo mode');
        allTickets.push(...getMockTickets());
      } else {
        try {
          const contract = getContract(contractAddress);
          const balance = await contract.balanceOf(address);
          
          for (let i = 0; i < balance.toNumber(); i++) {
            const tokenId = await contract.tokenOfOwnerByIndex(address, i);
            const ticketInfo = await contract.getTicketInfo(tokenId);
            const eventInfo = await contract.getEventInfo();
            
            const ticket = {
              tokenId: tokenId.toNumber(),
              contractAddress: contractAddress,
              owner: ticketInfo.owner,
              uri: ticketInfo.uri,
              isUsed: ticketInfo.used,
              originalPrice: ethers.utils.formatEther(ticketInfo.origPrice),
              eventName: eventInfo.name,
              eventDescription: eventInfo.description,
              eventDate: eventInfo.date.toNumber(),
              eventVenue: eventInfo.venue,
              qrData: `nfticket://${contractAddress}/${tokenId.toNumber()}`,
            };
            
            allTickets.push(ticket);
          }
        } catch (error) {
          console.log('Error fetching tickets from contract:', error.message);
          // Fall back to demo mode on error
          allTickets.push(...getMockTickets());
        }
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

  // ==========================================
  // ROTATING QR CODE METHODS (Anti-Screenshot)
  // ==========================================

  /**
   * Generate a fresh QR proof from the backend
   * Proofs expire in ~15 seconds for security
   */
  const generateQRProof = useCallback(async (tokenId, isRefresh = false) => {
    if (!authToken) {
      throw new Error('Not authenticated - please login first');
    }

    try {
      setQrRefreshing(true);
      
      const endpoint = isRefresh ? '/generate-proof/refresh' : '/generate-proof';
      const body = { 
        tokenId,
        ...(isRefresh && lastProofTimestampRef.current 
          ? { lastProofTimestamp: lastProofTimestampRef.current } 
          : {})
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.reason || error.error || 'Failed to generate proof');
      }

      const proof = await response.json();
      lastProofTimestampRef.current = proof.data.timestamp;
      setActiveQRProof(proof);
      
      return proof;
    } catch (error) {
      console.error('QR proof generation error:', error);
      throw error;
    } finally {
      setQrRefreshing(false);
    }
  }, [authToken]);

  /**
   * Start auto-refreshing QR code for a ticket
   * Refreshes every (expiration - 3) seconds to ensure smooth transition
   */
  const startQRRotation = useCallback(async (tokenId) => {
    // Stop any existing rotation
    stopQRRotation();

    try {
      // Get initial proof
      const proof = await generateQRProof(tokenId, false);
      
      // Calculate refresh interval (refresh 3 seconds before expiry)
      const refreshMs = (proof.refreshIn || 12) * 1000;

      // Set up auto-refresh interval
      refreshIntervalRef.current = setInterval(async () => {
        try {
          await generateQRProof(tokenId, true);
        } catch (error) {
          console.error('QR auto-refresh failed:', error);
          // Stop rotation on error - user needs to re-authenticate
          stopQRRotation();
        }
      }, refreshMs);

      console.log(`QR rotation started for token ${tokenId}, refreshing every ${refreshMs}ms`);
      return proof;
    } catch (error) {
      console.error('Failed to start QR rotation:', error);
      throw error;
    }
  }, [generateQRProof]);

  /**
   * Stop the QR code auto-refresh
   */
  const stopQRRotation = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    setActiveQRProof(null);
    lastProofTimestampRef.current = null;
    console.log('QR rotation stopped');
  }, []);

  /**
   * Get the current QR proof data as a string for QR code display
   */
  const getQRCodeData = useCallback(() => {
    if (!activeQRProof) return null;
    
    // Encode proof as JSON string for QR code
    return JSON.stringify({
      data: activeQRProof.data,
      signature: activeQRProof.signature,
    });
  }, [activeQRProof]);

  /**
   * Check if QR proof is about to expire (within 3 seconds)
   */
  const isQRExpiringSoon = useCallback(() => {
    if (!activeQRProof) return true;
    const now = Math.floor(Date.now() / 1000);
    return (activeQRProof.expiresAt - now) < 3;
  }, [activeQRProof]);

  const value = {
    tickets,
    loading,
    refreshTickets,
    useTicket,
    transferTicket,
    getTicketMetadata,
    generateOfflineSignature,
    // Rotating QR methods
    activeQRProof,
    qrRefreshing,
    generateQRProof,
    startQRRotation,
    stopQRRotation,
    getQRCodeData,
    isQRExpiringSoon,
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};

export default TicketService;

