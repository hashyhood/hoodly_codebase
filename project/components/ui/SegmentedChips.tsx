import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gradient } from './Gradient';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface ChipItem {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SegmentedChipsProps {
  items: ChipItem[];
  value: string;
  onChange: (key: string) => void;
}

export const SegmentedChips: React.FC<SegmentedChipsProps> = ({
  items,
  value,
  onChange
}) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {items.map((item) => {
        const isActive = value === item.key;
        
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.chipContainer}
            onPress={() => onChange(item.key)}
            activeOpacity={0.8}
          >
            {isActive ? (
              <Gradient type="chipActive" style={styles.activeChip}>
                <View style={styles.chipContent}>
                  {item.icon && (
                    <Ionicons 
                      name={item.icon} 
                      size={16} 
                      color={getColor('textPrimary')} 
                      style={styles.chipIcon}
                    />
                  )}
                  <Text style={styles.activeChipText}>{item.label}</Text>
                </View>
              </Gradient>
            ) : (
              <View style={styles.inactiveChip}>
                <View style={styles.chipContent}>
                  {item.icon && (
                    <Ionicons 
                      name={item.icon} 
                      size={16} 
                      color={getColor('textSecondary')} 
                      style={styles.chipIcon}
                    />
                  )}
                  <Text style={styles.inactiveChipText}>{item.label}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getSpacing('lg'),
    gap: getSpacing('sm'),
  },
  chipContainer: {
    marginRight: getSpacing('sm'),
  },
  activeChip: {
    height: theme.components.chip.height,
    paddingHorizontal: theme.components.chip.padH,
    borderRadius: getRadius('pill'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveChip: {
    height: theme.components.chip.height,
    paddingHorizontal: theme.components.chip.padH,
    borderRadius: getRadius('pill'),
    backgroundColor: theme.components.chip.inactiveBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIcon: {
    marginRight: getSpacing('xs'),
  },
  activeChipText: {
    fontSize: theme.typography.body.size,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
  inactiveChipText: {
    fontSize: theme.typography.body.size,
    fontWeight: '500',
    color: theme.components.chip.inactiveText,
  },
});
