import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface StatItem {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface StatPillsRowProps {
  items: StatItem[];
}

export const StatPillsRow: React.FC<StatPillsRowProps> = ({ items }) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {items.map((item, index) => (
        <View key={index} style={styles.statPill}>
          <View style={styles.statContent}>
            {item.icon && (
              <Ionicons 
                name={item.icon} 
                size={16} 
                color={getColor('textSecondary')} 
                style={styles.statIcon}
              />
            )}
            <View style={styles.statText}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getSpacing('lg'),
    gap: getSpacing('md'),
  },
  statPill: {
    backgroundColor: getColor('surface'),
    borderRadius: getRadius('md'),
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    minWidth: 80,
    alignItems: 'center',
  },
  statContent: {
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: getSpacing('xs'),
  },
  statText: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.title.size,
    fontWeight: theme.typography.title.weight as any,
    color: getColor('textPrimary'),
    lineHeight: theme.typography.title.lineHeight,
  },
  statLabel: {
    fontSize: theme.typography.caption.size,
    color: getColor('textSecondary'),
    lineHeight: theme.typography.caption.lineHeight,
    opacity: theme.typography.caption.opacity,
    textAlign: 'center',
  },
});
