/**
 * POAPCard Component
 * Displays a POAP (Proof of Attendance Protocol) NFT
 * @author Sowad Al-Mughni
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const POAPCard = ({ poap, onPress }) => {
  const {
    tokenId,
    eventName,
    eventDate,
    eventLocation,
    imageUri,
    description,
  } = poap;

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.card}>
        {/* POAP Image */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>POAP</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>#{tokenId}</Text>
          </View>
        </View>

        {/* Event Information */}
        <View style={styles.content}>
          <Text style={styles.eventName} numberOfLines={2}>
            {eventName}
          </Text>
          
          <Text style={styles.eventDate}>
            {formatDate(eventDate)}
          </Text>
          
          <Text style={styles.eventLocation} numberOfLines={1}>
            📍 {eventLocation}
          </Text>

          {description && (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          )}

          {/* Soulbound Badge */}
          <View style={styles.soulboundBadge}>
            <Text style={styles.soulboundText}>🔒 Soulbound</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: (width - 48) / 2, // Two cards per row with margins
    marginHorizontal: 8,
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 20,
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
    marginBottom: 8,
  },
  soulboundBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  soulboundText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
});

export default POAPCard;

