/**
 * WalletScreen Component
 * Manages wallet connection, creation, and import
 * @author Sowad Al-Mughni
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useWallet } from '../services/WalletService';

const WalletScreen = () => {
  const {
    isConnected,
    address,
    balance,
    loading,
    createWallet,
    importWallet,
    disconnect,
    refreshBalance,
  } = useWallet();

  const [showImportModal, setShowImportModal] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWalletInfo, setNewWalletInfo] = useState(null);

  const handleCreateWallet = async () => {
    try {
      const walletInfo = await createWallet();
      setNewWalletInfo(walletInfo);
      setShowCreateModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
    }
  };

  const handleImportWallet = async () => {
    if (!importInput.trim()) {
      Alert.alert('Error', 'Please enter a private key or mnemonic phrase.');
      return;
    }

    try {
      await importWallet(importInput.trim());
      setShowImportModal(false);
      setImportInput('');
      Alert.alert('Success', 'Wallet imported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to import wallet. Please check your input.');
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: disconnect,
        },
      ]
    );
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    // In a real app, you'd use react-native-clipboard
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect Wallet</Text>
            <Text style={styles.subtitle}>
              Create a new wallet or import an existing one to get started
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateWallet}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating...' : 'Create New Wallet'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowImportModal(true)}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Import Wallet</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>🔒 Security Notice</Text>
            <Text style={styles.infoText}>
              Your private keys are stored securely on your device and never shared.
              Make sure to backup your wallet information safely.
            </Text>
          </View>
        </View>

        {/* Import Modal */}
        <Modal
          visible={showImportModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Import Wallet</Text>
              <TouchableOpacity onPress={handleImportWallet} disabled={loading}>
                <Text style={[styles.doneButton, loading && styles.disabledButton]}>
                  {loading ? 'Importing...' : 'Import'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Private Key or Mnemonic Phrase</Text>
              <TextInput
                style={styles.textInput}
                value={importInput}
                onChangeText={setImportInput}
                placeholder="Enter your private key or 12-word mnemonic phrase"
                multiline
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Your private key should start with "0x" or your mnemonic should be 12 words separated by spaces.
              </Text>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Create Wallet Success Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View />
              <Text style={styles.modalTitle}>Wallet Created</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.doneButton}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>✅ Success!</Text>
                <Text style={styles.successText}>
                  Your new wallet has been created successfully.
                </Text>
              </View>

              {newWalletInfo && (
                <View style={styles.walletInfoBox}>
                  <Text style={styles.walletInfoTitle}>Wallet Information</Text>
                  
                  <View style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>Address:</Text>
                    <Text style={styles.infoItemValue}>{newWalletInfo.address}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>Mnemonic Phrase:</Text>
                    <Text style={styles.infoItemValue}>{newWalletInfo.mnemonic}</Text>
                  </View>

                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ Important</Text>
                    <Text style={styles.warningText}>
                      Save your mnemonic phrase in a secure location. This is the only way to recover your wallet if you lose access to your device.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Info */}
        <View style={styles.walletCard}>
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Address</Text>
            <TouchableOpacity onPress={() => copyToClipboard(address)}>
              <Text style={styles.addressText}>{formatAddress(address)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceText}>{parseFloat(balance).toFixed(4)} ETH</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshBalance}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Network Info */}
        <View style={styles.networkCard}>
          <Text style={styles.networkTitle}>Network</Text>
          <Text style={styles.networkName}>Ethereum Mainnet</Text>
          <Text style={styles.networkStatus}>🟢 Connected</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  networkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  networkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  networkName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  networkStatus: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  doneButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: '#065F46',
  },
  walletInfoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  walletInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoItemLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoItemValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
});

export default WalletScreen;

