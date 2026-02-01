/**
 * ExclusiveScreen
 * Display token-gated exclusive content and perks
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
  Linking,
  Alert,
} from 'react-native';
import { useWallet } from '../services/WalletService';

const API_BASE = process.env.API_URL || 'http://localhost:3001';

// Perk type icons
const PERK_ICONS = {
  access: '🔓',
  discount: '💰',
  badge: '🏅',
  download: '📥',
  default: '🎁',
};

const ExclusiveScreen = () => {
  const { address, authToken, isConnected } = useWallet();
  const [perks, setPerks] = useState([]);
  const [allRules, setAllRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('unlocked');

  // Fetch perks and rules
  const fetchData = useCallback(async () => {
    if (!isConnected || !address) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all available rules
      const rulesResponse = await fetch(`${API_BASE}/gated/rules`);
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setAllRules(rulesData.rules || []);
      }

      // Fetch user's unlocked perks
      if (authToken) {
        const perksResponse = await fetch(`${API_BASE}/gated/my-perks`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (perksResponse.ok) {
          const perksData = await perksResponse.json();
          setPerks(perksData.perks || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch exclusive content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isConnected, address, authToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Access gated content
  const handleAccessContent = async (perk) => {
    if (!authToken) {
      Alert.alert('Authentication Required', 'Please sign in to access exclusive content.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/gated/access/${perk.ruleId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.reward?.contentUrl) {
          // Open content URL
          const canOpen = await Linking.canOpenURL(data.reward.contentUrl);
          if (canOpen) {
            Linking.openURL(data.reward.contentUrl);
          } else {
            Alert.alert('Content Available', `Access granted to: ${data.reward.name}`);
          }
        } else if (data.reward?.discountPercent) {
          Alert.alert(
            'Discount Unlocked! 🎉',
            `You've unlocked ${data.reward.discountPercent}% off!\n\nUse code: NFT${perk.ruleId.toUpperCase()}`
          );
        } else {
          Alert.alert('Access Granted', data.reward?.name || 'Content unlocked!');
        }
      } else {
        const error = await response.json();
        Alert.alert('Access Denied', error.error || 'You do not have access to this content.');
      }
    } catch (error) {
      console.error('Access error:', error);
      Alert.alert('Error', 'Failed to access content. Please try again.');
    }
  };

  // Render perk card
  const renderPerkCard = (perk, isUnlocked = true) => {
    const icon = PERK_ICONS[perk.reward?.type] || PERK_ICONS.default;

    return (
      <TouchableOpacity
        key={perk.ruleId || perk.id}
        style={[styles.perkCard, !isUnlocked && styles.lockedCard]}
        onPress={() => isUnlocked ? handleAccessContent(perk) : null}
        disabled={!isUnlocked}
      >
        <View style={styles.perkIcon}>
          <Text style={styles.perkIconText}>{icon}</Text>
        </View>
        <View style={styles.perkInfo}>
          <Text style={styles.perkName}>{perk.name}</Text>
          <Text style={styles.perkReward}>
            {perk.reward?.name || 'Exclusive Content'}
          </Text>
          {perk.reward?.discountPercent && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {perk.reward.discountPercent}% OFF
              </Text>
            </View>
          )}
        </View>
        <View style={styles.perkAction}>
          {isUnlocked ? (
            <Text style={styles.unlockedBadge}>✓ Unlocked</Text>
          ) : (
            <Text style={styles.lockedBadge}>🔒 Locked</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Not connected state
  if (!isConnected) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔐</Text>
        <Text style={styles.emptyTitle}>Connect Wallet</Text>
        <Text style={styles.emptyText}>
          Connect your wallet to view exclusive content and perks.
        </Text>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading exclusive content...</Text>
      </View>
    );
  }

  // Get locked perks (rules user doesn't have access to)
  const unlockedIds = new Set(perks.map(p => p.ruleId));
  const lockedPerks = allRules.filter(r => !unlockedIds.has(r.id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exclusive Content</Text>
        <Text style={styles.subtitle}>
          {perks.length} perk{perks.length !== 1 ? 's' : ''} unlocked
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unlocked' && styles.activeTab]}
          onPress={() => setActiveTab('unlocked')}
        >
          <Text style={[styles.tabText, activeTab === 'unlocked' && styles.activeTabText]}>
            Unlocked ({perks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'locked' && styles.activeTab]}
          onPress={() => setActiveTab('locked')}
        >
          <Text style={[styles.tabText, activeTab === 'locked' && styles.activeTabText]}>
            Locked ({lockedPerks.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'unlocked' ? (
          perks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎫</Text>
              <Text style={styles.emptyTitle}>No Perks Yet</Text>
              <Text style={styles.emptyText}>
                Collect NFT tickets and POAPs to unlock exclusive content!
              </Text>
            </View>
          ) : (
            perks.map(perk => renderPerkCard(perk, true))
          )
        ) : (
          lockedPerks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>All Unlocked!</Text>
              <Text style={styles.emptyText}>
                You've unlocked all available perks. Amazing!
              </Text>
            </View>
          ) : (
            lockedPerks.map(perk => renderPerkCard({
              ruleId: perk.id,
              name: perk.name,
              reward: perk.reward,
            }, false))
          )
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedCard: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  perkIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  perkIconText: {
    fontSize: 24,
  },
  perkInfo: {
    flex: 1,
  },
  perkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  perkReward: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  discountBadge: {
    marginTop: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  perkAction: {
    marginLeft: 12,
  },
  unlockedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  lockedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
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
    paddingVertical: 60,
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

export default ExclusiveScreen;
