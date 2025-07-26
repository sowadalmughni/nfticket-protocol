/**
 * POAPService
 * Manages POAP (Proof of Attendance Protocol) interactions and data
 * @author Sowad Al-Mughni
 */

import React, { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletService';

// POAPDistributor contract ABI (simplified for mobile app)
const POAP_DISTRIBUTOR_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function getEventInfo() view returns (string name, string description, uint256 date, string location, uint256 claimed, uint256 maxSup, bool active)',
  'function hasClaimedPOAP(address claimer) view returns (bool)',
  'function claimPOAP(address claimer, address nfticketContract, uint256 ticketId)',
  'function claimPOAPDirect(address claimer)',
  'function remainingSupply() view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

const POAPContext = createContext();

export const usePOAP = () => {
  const context = useContext(POAPContext);
  if (!context) {
    throw new Error('usePOAP must be used within a POAPProvider');
  }
  return context;
};

export const POAPProvider = ({ children }) => {
  const { signer, address, provider } = useWallet();
  const [poaps, setPOAPs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Contract addresses (these would be deployed contract addresses)
  const POAP_CONTRACT_ADDRESSES = {
    ethereum: '0x...', // Replace with actual deployed contract address
    polygon: '0x...', // Replace with actual deployed contract address
    sepolia: '0x...', // Replace with actual deployed contract address
  };

  const getContract = (contractAddress) => {
    if (!provider) {
      throw new Error('Provider not available');
    }
    return new ethers.Contract(contractAddress, POAP_DISTRIBUTOR_ABI, signer || provider);
  };

  const refreshPOAPs = async () => {
    if (!address || !provider) {
      return;
    }

    try {
      setLoading(true);
      const allPOAPs = [];

      // For demo purposes, we'll use a mock contract address
      // In production, you'd iterate through known POAP contract addresses
      const mockContractAddress = POAP_CONTRACT_ADDRESSES.sepolia || '0x9876543210987654321098765432109876543210';
      
      try {
        const contract = getContract(mockContractAddress);
        const balance = await contract.balanceOf(address);
        
        for (let i = 0; i < balance.toNumber(); i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i);
          const tokenURI = await contract.tokenURI(tokenId);
          const eventInfo = await contract.getEventInfo();
          
          const poap = {
            tokenId: tokenId.toNumber(),
            contractAddress: mockContractAddress,
            owner: address,
            uri: tokenURI,
            eventName: eventInfo.name,
            eventDescription: eventInfo.description,
            eventDate: eventInfo.date.toNumber(),
            eventLocation: eventInfo.location,
            imageUri: `https://example.com/poap/${tokenId.toNumber()}.png`,
          };
          
          allPOAPs.push(poap);
        }
      } catch (error) {
        console.log('POAP contract not found or error fetching POAPs:', error.message);
        // For demo purposes, add mock POAPs
        allPOAPs.push(...getMockPOAPs());
      }

      setPOAPs(allPOAPs);
    } catch (error) {
      console.error('Error refreshing POAPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockPOAPs = () => {
    return [
      {
        tokenId: 1,
        contractAddress: '0x9876543210987654321098765432109876543210',
        owner: address,
        uri: 'https://example.com/poap/1',
        eventName: 'Web3 Conference 2024',
        eventDescription: 'Attended the premier Web3 and blockchain conference',
        eventDate: Math.floor(Date.now() / 1000) - 86400, // Yesterday
        eventLocation: 'San Francisco, CA',
        imageUri: 'https://example.com/poap/1.png',
      },
      {
        tokenId: 2,
        contractAddress: '0x9876543210987654321098765432109876543210',
        owner: address,
        uri: 'https://example.com/poap/2',
        eventName: 'NFT Art Gallery Opening',
        eventDescription: 'Participated in exclusive NFT art exhibition opening',
        eventDate: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
        eventLocation: 'New York, NY',
        imageUri: 'https://example.com/poap/2.png',
      },
      {
        tokenId: 3,
        contractAddress: '0x9876543210987654321098765432109876543210',
        owner: address,
        uri: 'https://example.com/poap/3',
        eventName: 'DeFi Summit 2024',
        eventDescription: 'Attended the decentralized finance summit',
        eventDate: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
        eventLocation: 'London, UK',
        imageUri: 'https://example.com/poap/3.png',
      },
    ];
  };

  const claimPOAP = async (contractAddress, nfticketContract = null, ticketId = null) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const contract = getContract(contractAddress);
      
      let tx;
      if (nfticketContract && ticketId !== null) {
        // Claim with NFTicket verification
        tx = await contract.claimPOAP(address, nfticketContract, ticketId);
      } else {
        // Direct claim (for special cases)
        tx = await contract.claimPOAPDirect(address);
      }
      
      await tx.wait();

      // Refresh POAPs after claiming
      await refreshPOAPs();

      return tx;
    } catch (error) {
      console.error('Error claiming POAP:', error);
      throw error;
    }
  };

  const checkClaimEligibility = async (contractAddress) => {
    if (!address || !provider) {
      return false;
    }

    try {
      const contract = getContract(contractAddress);
      const hasClaimed = await contract.hasClaimedPOAP(address);
      const eventInfo = await contract.getEventInfo();
      const remainingSupply = await contract.remainingSupply();

      return {
        eligible: !hasClaimed && eventInfo.active && remainingSupply.gt(0),
        hasClaimed,
        isActive: eventInfo.active,
        remainingSupply: remainingSupply.toNumber(),
        eventInfo: {
          name: eventInfo.name,
          description: eventInfo.description,
          date: eventInfo.date.toNumber(),
          location: eventInfo.location,
          claimed: eventInfo.claimed.toNumber(),
          maxSupply: eventInfo.maxSup.toNumber(),
        },
      };
    } catch (error) {
      console.error('Error checking claim eligibility:', error);
      return false;
    }
  };

  const getPOAPMetadata = async (uri) => {
    try {
      const response = await fetch(uri);
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Error fetching POAP metadata:', error);
      return null;
    }
  };

  const scanToAirdrop = async (qrData) => {
    try {
      // Parse QR data to extract contract address and claim parameters
      const url = new URL(qrData);
      const contractAddress = url.searchParams.get('contract');
      const eventId = url.searchParams.get('event');
      
      if (!contractAddress) {
        throw new Error('Invalid QR code');
      }

      // Check eligibility first
      const eligibility = await checkClaimEligibility(contractAddress);
      if (!eligibility.eligible) {
        throw new Error('Not eligible to claim this POAP');
      }

      // Claim the POAP
      const tx = await claimPOAP(contractAddress);
      
      return {
        success: true,
        transaction: tx,
        eventInfo: eligibility.eventInfo,
      };
    } catch (error) {
      console.error('Error in scan-to-airdrop:', error);
      throw error;
    }
  };

  const getAvailablePOAPs = async () => {
    // This would typically fetch from a backend API or IPFS
    // For demo purposes, return mock available POAPs
    return [
      {
        contractAddress: '0x9876543210987654321098765432109876543210',
        eventName: 'Blockchain Meetup #42',
        eventDescription: 'Monthly blockchain developer meetup',
        eventDate: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
        eventLocation: 'Virtual Event',
        qrCode: 'poap://claim?contract=0x9876543210987654321098765432109876543210&event=42',
        isActive: true,
        remainingSupply: 50,
      },
    ];
  };

  const value = {
    poaps,
    loading,
    refreshPOAPs,
    claimPOAP,
    checkClaimEligibility,
    getPOAPMetadata,
    scanToAirdrop,
    getAvailablePOAPs,
  };

  return (
    <POAPContext.Provider value={value}>
      {children}
    </POAPContext.Provider>
  );
};

export default POAPService;

