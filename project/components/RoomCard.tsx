import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Room {
  name: string;
  emoji: string;
  activeUsers: number;
  lastMessage?: string;
  neighborhood?: string;
}

interface RoomCardProps {
  room: Room;
  neighborhood: string;
  onPress: () => void;
}

export function RoomCard({ room, neighborhood, onPress }: RoomCardProps) {
  const getMoodGradient = (emoji: string) => {
    switch (emoji) {
      case '💔':
        return ['#4A90E2', '#7B68EE'];
      case '🔥':
        return ['#FF6B9D', '#FF8E53'];
      case '🧠':
        return ['#A8E6CF', '#88D8C0'];
      case '😎':
        return ['#FFD93D', '#FF6B9D'];
      case '🎮':
        return ['#6C5CE7', '#A29BFE'];
      default:
        return ['#667eea', '#764ba2'];
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={getMoodGradient(room.emoji) as [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={20} style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.emoji}>{room.emoji}</Text>
            <View style={styles.info}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.neighborhood}>{neighborhood}</Text>
            </View>
            <View style={styles.activeIndicator}>
              <View style={styles.activeDot} />
              <Text style={styles.activeCount}>{room.activeUsers}</Text>
            </View>
          </View>
          
          {room.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {room.lastMessage}
            </Text>
          )}
        </BlurView>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 20,
  },
  content: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  neighborhood: {
    fontSize: 14,
    color: '#FFFFFF80',
    marginTop: 2,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
    marginRight: 6,
  },
  activeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lastMessage: {
    fontSize: 14,
    color: '#FFFFFF70',
    marginTop: 12,
    fontStyle: 'italic',
  },
});