/**
 * WalletService
 * Manages wallet connections and Web3 interactions
 * @author Sowad Al-Mughni
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  // Storage keys
  const WALLET_ADDRESS_KEY = 'wallet_address';
  const WALLET_PRIVATE_KEY = 'wallet_private_key';

  useEffect(() => {
    loadWalletFromStorage();
  }, []);

  const loadWalletFromStorage = async () => {
    try {
      const storedAddress = await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
      const storedPrivateKey = await AsyncStorage.getItem(WALLET_PRIVATE_KEY);
      
      if (storedAddress && storedPrivateKey) {
        await connectWithPrivateKey(storedPrivateKey);
      }
    } catch (error) {
      console.error('Error loading wallet from storage:', error);
    }
  };

  const connectWithPrivateKey = async (privateKey) => {
    try {
      setLoading(true);
      
      // Create provider (using a public RPC endpoint)
      const rpcProvider = new ethers.providers.JsonRpcProvider(
        'https://rpc.ankr.com/eth' // Ethereum mainnet
      );
      
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, rpcProvider);
      
      setProvider(rpcProvider);
      setSigner(wallet);
      setAddress(wallet.address);
      setIsConnected(true);
      
      // Get balance
      const balance = await wallet.getBalance();
      setBalance(ethers.utils.formatEther(balance));
      
      // Store in AsyncStorage
      await AsyncStorage.setItem(WALLET_ADDRESS_KEY, wallet.address);
      await AsyncStorage.setItem(WALLET_PRIVATE_KEY, privateKey);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    try {
      setLoading(true);
      
      // Create a new random wallet
      const wallet = ethers.Wallet.createRandom();
      
      await connectWithPrivateKey(wallet.privateKey);
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase,
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const importWallet = async (privateKeyOrMnemonic) => {
    try {
      setLoading(true);
      
      let wallet;
      
      if (privateKeyOrMnemonic.includes(' ')) {
        // It's a mnemonic phrase
        wallet = ethers.Wallet.fromMnemonic(privateKeyOrMnemonic);
      } else {
        // It's a private key
        wallet = new ethers.Wallet(privateKeyOrMnemonic);
      }
      
      await connectWithPrivateKey(wallet.privateKey);
      
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsConnected(false);
      setAddress(null);
      setProvider(null);
      setSigner(null);
      setBalance('0');
      
      // Clear from AsyncStorage
      await AsyncStorage.removeItem(WALLET_ADDRESS_KEY);
      await AsyncStorage.removeItem(WALLET_PRIVATE_KEY);
      
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const refreshBalance = async () => {
    if (signer) {
      try {
        const balance = await signer.getBalance();
        setBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error('Error refreshing balance:', error);
      }
    }
  };

  const switchNetwork = async (networkConfig) => {
    try {
      setLoading(true);
      
      const newProvider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
      const newSigner = signer.connect(newProvider);
      
      setProvider(newProvider);
      setSigner(newSigner);
      
      await refreshBalance();
      
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signMessage = async (message) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await signer.signMessage(message);
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  };

  const sendTransaction = async (transaction) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const tx = await signer.sendTransaction(transaction);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  const value = {
    isConnected,
    address,
    provider,
    signer,
    balance,
    loading,
    connectWithPrivateKey,
    createWallet,
    importWallet,
    disconnect,
    refreshBalance,
    switchNetwork,
    signMessage,
    sendTransaction,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Network configurations
export const NETWORKS = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://rpc.ankr.com/eth',
    blockExplorer: 'https://etherscan.io',
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://rpc.ankr.com/polygon',
    blockExplorer: 'https://polygonscan.com',
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://rpc.ankr.com/eth_sepolia',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
};

export default WalletService;

