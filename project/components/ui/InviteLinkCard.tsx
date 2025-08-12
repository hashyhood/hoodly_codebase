import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Share2, Copy, Users, Calendar } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

interface InviteLinkCardProps {
  title: string;
  description?: string;
  inviteLink: string;
  memberCount?: number;
  expiryDate?: string;
  onShare?: () => void;
  onCopy?: () => void;
}

const InviteLinkCard: React.FC<InviteLinkCardProps> = ({
  title,
  description,
  inviteLink,
  memberCount,
  expiryDate,
  onShare,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(inviteLink);
      setCopied(true);
      onCopy?.();
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link to clipboard');
    }
  };

  const handleShare = () => {
    onShare?.();
    // You can implement native sharing here
    Alert.alert('Share', `Share this link: ${inviteLink}`);
  };

  const formatExpiryDate = (date: string) => {
    const expiry = new Date(date);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {memberCount !== undefined && (
            <View style={styles.memberCount}>
              <Users size={16} color="#6B7280" />
              <Text style={styles.memberCountText}>{memberCount}</Text>
            </View>
          )}
        </View>
        {expiryDate && (
          <View style={styles.expiryContainer}>
            <Calendar size={14} color="#F59E0B" />
            <Text style={styles.expiryText}>{formatExpiryDate(expiryDate)}</Text>
          </View>
        )}
      </View>

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      <View style={styles.linkContainer}>
        <Text style={styles.linkText} numberOfLines={1}>
          {inviteLink}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, copied && styles.actionButtonActive]}
          onPress={handleCopy}
        >
          <Copy size={18} color={copied ? '#10B981' : '#6B7280'} />
          <Text style={[styles.actionText, copied && styles.actionTextActive]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={18} color="#6B7280" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCountText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkText: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  actionTextActive: {
    color: '#10B981',
  },
});

export default InviteLinkCard; 