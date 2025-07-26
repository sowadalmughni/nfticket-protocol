/**
 * POAPScreen Component
 * Displays user's POAP (Proof of Attendance Protocol) collection
 * @author Sowad Al-Mughni
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import POAPCard from '../components/POAPCard';
import { useWallet } from '../services/WalletService';
import { usePOAP } from '../services/POAPService';

const POAPScreen = ({ navigation }) => {
  const { isConnected, address } = useWallet();
  const { poaps, loading, refreshPOAPs, claimPOAP } = usePOAP();

  useEffect(() => {
    if (isConnected && address) {
      refreshPOAPs();
    }
  }, [isConnected, address]);

  const handlePOAPPress = (poap) => {
    navigation.navigate('POAPDetail', { poap });
  };

  const handleClaimPOAP = () => {
    navigation.navigate('ClaimPOAP');
  };

  const renderPOAP = ({ item }) => (
    <POAPCard
      poap={item}
      onPress={() => handlePOAPPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No POAPs Found</Text>
      <Text style={styles.emptyStateText}>
        {!isConnected
          ? 'Connect your wallet to view your POAP collection'
          : 'You haven\'t collected any POAPs yet. Attend events to earn proof of attendance!'}
      </Text>
      {!isConnected ? (
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Text style={styles.connectButtonText}>Connect Wallet</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.claimButton}
          onPress={handleClaimPOAP}
        >
          <Text style={styles.claimButtonText}>Claim POAP</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Text style={styles.subtitle}>
        Proof of Attendance Protocol (POAP) NFTs commemorate your participation in events.
        These soulbound tokens cannot be transferred and serve as permanent proof of your attendance.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My POAPs</Text>
        {isConnected && (
          <TouchableOpacity
            style={styles.claimHeaderButton}
            onPress={handleClaimPOAP}
          >
            <Text style={styles.claimHeaderButtonText}>+ Claim</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* POAPs Count */}
      {isConnected && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {poaps.length} POAP{poaps.length !== 1 ? 's' : ''} collected
          </Text>
        </View>
      )}

      {/* POAPs Grid */}
      <FlatList
        data={poaps}
        renderItem={renderPOAP}
        keyExtractor={(item) => item.tokenId.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshPOAPs}
            colors={['#3B82F6']}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  claimHeaderButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default POAPScreen;

