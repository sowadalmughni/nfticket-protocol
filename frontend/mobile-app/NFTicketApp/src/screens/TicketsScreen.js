/**
 * TicketsScreen Component
 * Displays user's NFT tickets with filtering and management options
 * @author Sowad Al-Mughni
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import TicketCard from '../components/TicketCard';
import { useWallet } from '../services/WalletService';
import { useTickets } from '../services/TicketService';

const TicketsScreen = ({ navigation }) => {
  const { isConnected, address } = useWallet();
  const { tickets, loading, refreshTickets, useTicket } = useTickets();
  const [filter, setFilter] = useState('all'); // 'all', 'valid', 'used'

  useEffect(() => {
    if (isConnected && address) {
      refreshTickets();
    }
  }, [isConnected, address]);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'valid') return !ticket.isUsed;
    if (filter === 'used') return ticket.isUsed;
    return true;
  });

  const handleTicketPress = (ticket) => {
    navigation.navigate('TicketDetail', { ticket });
  };

  const handleUseTicket = async (tokenId) => {
    Alert.alert(
      'Use Ticket',
      'Are you sure you want to mark this ticket as used? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Use Ticket',
          style: 'destructive',
          onPress: async () => {
            try {
              await useTicket(tokenId);
              Alert.alert('Success', 'Ticket has been marked as used.');
              refreshTickets();
            } catch (error) {
              Alert.alert('Error', 'Failed to use ticket. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderFilterButton = (filterType, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTicket = ({ item }) => (
    <TicketCard
      ticket={item}
      onPress={() => handleTicketPress(item)}
      onUse={handleUseTicket}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Tickets Found</Text>
      <Text style={styles.emptyStateText}>
        {!isConnected
          ? 'Connect your wallet to view your tickets'
          : filter === 'valid'
          ? 'You have no valid tickets'
          : filter === 'used'
          ? 'You have no used tickets'
          : 'You don\'t have any tickets yet'}
      </Text>
      {!isConnected && (
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Text style={styles.connectButtonText}>Connect Wallet</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Text style={styles.scanButtonText}>📱 Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('valid', 'Valid')}
        {renderFilterButton('used', 'Used')}
      </View>

      {/* Tickets Count */}
      {isConnected && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Tickets List */}
      <FlatList
        data={filteredTickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.tokenId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshTickets}
            colors={['#3B82F6']}
          />
        }
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
  scanButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
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
    paddingBottom: 20,
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
});

export default TicketsScreen;

