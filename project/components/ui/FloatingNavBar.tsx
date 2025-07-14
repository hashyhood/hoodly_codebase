import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../lib/theme';

const icons = ['🏠', '💬', '📍', '👤'];

export const FloatingNavBar: React.FC<{ active: number; onTab: (i: number) => void }> = ({
  active,
  onTab,
}) => (
  <BlurView intensity={30} tint="light" style={styles.navBar}>
    {icons.map((icon, i) => (
      <TouchableOpacity
        key={icon}
        style={[styles.navItem, active === i && styles.active]}
        onPress={() => onTab(i)}
      >
        <Text style={[styles.icon, active === i && styles.activeIcon]}>{icon}</Text>
      </TouchableOpacity>
    ))}
  </BlurView>
);

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors.glass.primary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  navItem: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: theme.colors.neural.primary,
  },
  icon: {
    fontSize: 24,
    color: theme.colors.text.tertiary,
  },
  activeIcon: {
    color: theme.colors.text.primary,
  },
}); 