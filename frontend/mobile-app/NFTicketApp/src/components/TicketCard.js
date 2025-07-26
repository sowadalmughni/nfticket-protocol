/**
 * TicketCard Component
 * Displays an NFT ticket with QR code and ticket information
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
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

const TicketCard = ({ ticket, onPress, onUse }) => {
  const {
    tokenId,
    eventName,
    eventDate,
    eventVenue,
    isUsed,
    qrData,
    imageUri,
  } = ticket;

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.card, isUsed && styles.usedCard]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eventName}>{eventName}</Text>
          <Text style={styles.tokenId}>#{tokenId}</Text>
        </View>

        {/* Event Details */}
        <View style={styles.eventDetails}>
          <Text style={styles.eventDate}>{formatDate(eventDate)}</Text>
          <Text style={styles.eventVenue}>{eventVenue}</Text>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={120}
              backgroundColor="white"
              color="black"
            />
          </View>
          <View style={styles.qrInfo}>
            <Text style={styles.qrLabel}>Scan for Entry</Text>
            <Text style={styles.qrSubtext}>
              Present this QR code at the venue
            </Text>
          </View>
        </View>

        {/* Status and Actions */}
        <View style={styles.footer}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, isUsed ? styles.usedDot : styles.validDot]} />
            <Text style={[styles.statusText, isUsed && styles.usedText]}>
              {isUsed ? 'Used' : 'Valid'}
            </Text>
          </View>

          {!isUsed && (
            <TouchableOpacity
              style={styles.useButton}
              onPress={() => onUse(tokenId)}
            >
              <Text style={styles.useButtonText}>Mark as Used</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Used Overlay */}
        {isUsed && (
          <View style={styles.usedOverlay}>
            <Text style={styles.usedOverlayText}>USED</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  usedCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  tokenId: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  eventDetails: {
    marginBottom: 20,
  },
  eventDate: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 14,
    color: '#6B7280',
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  qrContainer: {
    marginRight: 16,
  },
  qrInfo: {
    flex: 1,
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  qrSubtext: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  validDot: {
    backgroundColor: '#10B981',
  },
  usedDot: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  usedText: {
    color: '#EF4444',
  },
  useButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  useButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  usedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedOverlayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EF4444',
    transform: [{ rotate: '-15deg' }],
  },
});

export default TicketCard;

