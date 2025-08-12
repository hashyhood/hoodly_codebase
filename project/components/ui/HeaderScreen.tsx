import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, getSpacing, getColor } from '../../lib/theme';

interface HeaderScreenProps {
  title: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
}

export const HeaderScreen: React.FC<HeaderScreenProps> = ({
  title,
  subtitle,
  rightActions
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightActions && (
          <View style={styles.actions}>
            {rightActions}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: getSpacing('xl'),
    paddingBottom: getSpacing('lg'),
    paddingHorizontal: getSpacing('lg'),
    backgroundColor: getColor('bg'),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: getSpacing('md'),
  },
  title: {
    fontSize: theme.typography.titleXL.size,
    fontWeight: theme.typography.titleXL.weight as any,
    lineHeight: theme.typography.titleXL.lineHeight,
    color: getColor('textPrimary'),
    marginBottom: getSpacing('xs'),
  },
  subtitle: {
    fontSize: theme.typography.subtitle.size,
    fontWeight: theme.typography.subtitle.weight as any,
    lineHeight: theme.typography.subtitle.lineHeight,
    color: getColor('textSecondary'),
    opacity: theme.typography.subtitle.opacity,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
});
