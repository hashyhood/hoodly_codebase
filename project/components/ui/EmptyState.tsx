import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gradient } from './Gradient';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface EmptyStateProps {
  emoji?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  cta?: {
    text: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  icon,
  title,
  subtitle,
  cta
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : icon ? (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={48} color={getColor('textSecondary')} />
          </View>
        ) : null}
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        
        {cta && (
          <TouchableOpacity onPress={cta.onPress} style={styles.ctaContainer}>
            <Gradient type="primary" style={styles.ctaButton}>
              <Text style={styles.ctaText}>{cta.text}</Text>
            </Gradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getSpacing('xl'),
  },
  content: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emoji: {
    fontSize: 64,
    marginBottom: getSpacing('lg'),
  },
  iconContainer: {
    marginBottom: getSpacing('lg'),
    padding: getSpacing('md'),
    backgroundColor: getColor('surface'),
    borderRadius: getRadius('xl'),
  },
  title: {
    fontSize: theme.typography.title.size,
    fontWeight: theme.typography.title.weight as any,
    color: getColor('textPrimary'),
    lineHeight: theme.typography.title.lineHeight,
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
  },
  subtitle: {
    fontSize: theme.typography.body.size,
    color: getColor('textSecondary'),
    lineHeight: theme.typography.body.lineHeight,
    textAlign: 'center',
    marginBottom: getSpacing('xl'),
  },
  ctaContainer: {
    marginTop: getSpacing('lg'),
  },
  ctaButton: {
    paddingHorizontal: getSpacing('xl'),
    paddingVertical: getSpacing('md'),
    borderRadius: getRadius('pill'),
  },
  ctaText: {
    fontSize: theme.typography.body.size,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
});
