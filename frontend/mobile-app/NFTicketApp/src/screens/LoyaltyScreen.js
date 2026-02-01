/**
 * LoyaltyScreen
 * Display user's loyalty points, tier, and earning history
 * @author Sowad Al-Mughni
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useWallet } from '../services/WalletService';

const API_BASE = process.env.API_URL || 'http://localhost:3001';

// Tier colors
const TIER_COLORS = {
  Bronze: { bg: '#FEF3C7', text: '#92400E' },
  Silver: { bg: '#F3F4F6', text: '#374151' },
  Gold: { bg: '#FEF08A', text: '#854D0E' },
  Platinum: { bg: '#DBEAFE', text: '#1E40AF' },
  Diamond: { bg: '#E9D5FF', text: '#7C3AED' },
};

const LoyaltyScreen = () => {
  const { address, authToken, isConnected } = useWallet();
  const [balance, setBalance] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [history, setHistory] = useState({ earnings: [], redemptions: [] });
  const [earningRates, setEarningRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      // Fetch tiers and rates (public)
      const [tiersRes, ratesRes] = await Promise.all([
        fetch(`${API_BASE}/loyalty/tiers`),
        fetch(`${API_BASE}/loyalty/earning-rates`),
      ]);

      if (tiersRes.ok) {
        const data = await tiersRes.json();
        setTiers(data.tiers || []);
      }

      if (ratesRes.ok) {
        const data = await ratesRes.json();
        setEarningRates(data);
      }

      // Fetch user balance and history (authenticated)
      if (authToken) {
        const [balanceRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/loyalty/balance`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch(`${API_BASE}/loyalty/history?limit=20`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        if (balanceRes.ok) {
          const data = await balanceRes.json();
          setBalance(data);
        }

        if (historyRes.ok) {
          const data = await historyRes.json();
          setHistory(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Redeem points
  const handleRedeem = (amount, reward) => {
    Alert.alert(
      'Redeem Points',
      `Redeem ${amount} points for ${reward}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE}/loyalty/redeem`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ amount, reward }),
              });

              if (response.ok) {
                Alert.alert('Success! 🎉', `You redeemed ${amount} points for ${reward}`);
                fetchData();
              } else {
                const error = await response.json();
                Alert.alert('Error', error.error || 'Failed to redeem points');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to redeem points');
            }
          },
        },
      ]
    );
  };

  // Not connected state
  if (!isConnected) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💎</Text>
        <Text style={styles.emptyTitle}>Connect Wallet</Text>
        <Text style={styles.emptyText}>
          Connect your wallet to view your loyalty points and rewards.
        </Text>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading loyalty data...</Text>
      </View>
    );
  }

  const tierColors = TIER_COLORS[balance?.tier?.name] || TIER_COLORS.Bronze;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Points Card */}
        <View style={[styles.pointsCard, { backgroundColor: tierColors.bg }]}>
          <View style={styles.tierBadge}>
            <Text style={[styles.tierText, { color: tierColors.text }]}>
              {balance?.tier?.name || 'Bronze'}
            </Text>
          </View>
          <Text style={[styles.pointsValue, { color: tierColors.text }]}>
            {(balance?.points || 0).toLocaleString()}
          </Text>
          <Text style={[styles.pointsLabel, { color: tierColors.text }]}>
            Loyalty Points
          </Text>
          {balance?.tier?.discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {balance.tier.discountPercent}% Member Discount
              </Text>
            </View>
          )}
          {balance?.nextTier && (
            <Text style={[styles.nextTierText, { color: tierColors.text }]}>
              {balance.nextTier.pointsNeeded.toLocaleString()} points to {balance.nextTier.name}
            </Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              How to Earn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'redeem' && styles.activeTab]}
            onPress={() => setActiveTab('redeem')}
          >
            <Text style={[styles.tabText, activeTab === 'redeem' && styles.activeTabText]}>
              Redeem
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ways to Earn</Text>
            <View style={styles.earningList}>
              <View style={styles.earningItem}>
                <Text style={styles.earningIcon}>🎫</Text>
                <View style={styles.earningInfo}>
                  <Text style={styles.earningAction}>Buy a Ticket</Text>
                  <Text style={styles.earningPoints}>
                    +{earningRates?.ticketPurchase || 100} points
                  </Text>
                </View>
              </View>
              <View style={styles.earningItem}>
                <Text style={styles.earningIcon}>✓</Text>
                <View style={styles.earningInfo}>
                  <Text style={styles.earningAction}>Attend an Event</Text>
                  <Text style={styles.earningPoints}>
                    +{earningRates?.attendance || 50} points
                  </Text>
                </View>
              </View>
              <View style={styles.earningItem}>
                <Text style={styles.earningIcon}>🏆</Text>
                <View style={styles.earningInfo}>
                  <Text style={styles.earningAction}>Claim a POAP</Text>
                  <Text style={styles.earningPoints}>
                    +{earningRates?.poap || 25} points
                  </Text>
                </View>
              </View>
              <View style={styles.earningItem}>
                <Text style={styles.earningIcon}>👥</Text>
                <View style={styles.earningInfo}>
                  <Text style={styles.earningAction}>Refer a Friend</Text>
                  <Text style={styles.earningPoints}>
                    +{earningRates?.referral || 200} points
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Tiers</Text>
            <View style={styles.tierList}>
              {tiers.map(tier => {
                const colors = TIER_COLORS[tier.name] || TIER_COLORS.Bronze;
                const isCurrentTier = tier.name === balance?.tier?.name;
                
                return (
                  <View 
                    key={tier.name}
                    style={[
                      styles.tierItem,
                      { backgroundColor: colors.bg },
                      isCurrentTier && styles.currentTierItem,
                    ]}
                  >
                    <Text style={[styles.tierName, { color: colors.text }]}>
                      {tier.name}
                    </Text>
                    <Text style={[styles.tierThreshold, { color: colors.text }]}>
                      {tier.threshold.toLocaleString()}+ pts
                    </Text>
                    {tier.discountPercent > 0 && (
                      <Text style={[styles.tierDiscount, { color: colors.text }]}>
                        {tier.discountPercent}% off
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {history.earnings.length === 0 && history.redemptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No Activity Yet</Text>
                <Text style={styles.emptyText}>
                  Start earning points by purchasing tickets!
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {[...history.earnings, ...history.redemptions]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .slice(0, 20)
                  .map((item, index) => {
                    const isEarning = 'reason' in item;
                    return (
                      <View key={index} style={styles.historyItem}>
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyReason}>
                            {isEarning ? item.reason : item.reward}
                          </Text>
                          <Text style={styles.historyDate}>
                            {new Date(item.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={[
                          styles.historyAmount,
                          isEarning ? styles.earnedAmount : styles.redeemedAmount,
                        ]}>
                          {isEarning ? '+' : '-'}{item.amount}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'redeem' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Redeem Points</Text>
            <View style={styles.redeemList}>
              <TouchableOpacity
                style={styles.redeemItem}
                onPress={() => handleRedeem(500, '10% Discount Code')}
                disabled={(balance?.points || 0) < 500}
              >
                <View style={styles.redeemInfo}>
                  <Text style={styles.redeemName}>10% Discount Code</Text>
                  <Text style={styles.redeemDesc}>Use on any ticket purchase</Text>
                </View>
                <View style={styles.redeemCost}>
                  <Text style={styles.redeemPoints}>500 pts</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.redeemItem}
                onPress={() => handleRedeem(1000, 'Priority Entry')}
                disabled={(balance?.points || 0) < 1000}
              >
                <View style={styles.redeemInfo}>
                  <Text style={styles.redeemName}>Priority Entry</Text>
                  <Text style={styles.redeemDesc}>Skip the line at your next event</Text>
                </View>
                <View style={styles.redeemCost}>
                  <Text style={styles.redeemPoints}>1,000 pts</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.redeemItem}
                onPress={() => handleRedeem(2500, 'VIP Upgrade')}
                disabled={(balance?.points || 0) < 2500}
              >
                <View style={styles.redeemInfo}>
                  <Text style={styles.redeemName}>VIP Upgrade</Text>
                  <Text style={styles.redeemDesc}>Upgrade to VIP for any event</Text>
                </View>
                <View style={styles.redeemCost}>
                  <Text style={styles.redeemPoints}>2,500 pts</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.redeemItem}
                onPress={() => handleRedeem(5000, 'Free Ticket')}
                disabled={(balance?.points || 0) < 5000}
              >
                <View style={styles.redeemInfo}>
                  <Text style={styles.redeemName}>Free Ticket</Text>
                  <Text style={styles.redeemDesc}>One free general admission ticket</Text>
                </View>
                <View style={styles.redeemCost}>
                  <Text style={styles.redeemPoints}>5,000 pts</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  pointsCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  discountBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  nextTierText: {
    fontSize: 12,
    marginTop: 12,
    opacity: 0.8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  earningList: {
    gap: 12,
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  earningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  earningInfo: {
    flex: 1,
  },
  earningAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  earningPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  tierList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tierItem: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  currentTierItem: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  tierName: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierThreshold: {
    fontSize: 10,
    marginTop: 4,
  },
  tierDiscount: {
    fontSize: 10,
    marginTop: 2,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyInfo: {
    flex: 1,
  },
  historyReason: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  earnedAmount: {
    color: '#059669',
  },
  redeemedAmount: {
    color: '#DC2626',
  },
  redeemList: {
    gap: 12,
  },
  redeemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  redeemInfo: {
    flex: 1,
  },
  redeemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  redeemDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  redeemCost: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  redeemPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LoyaltyScreen;
