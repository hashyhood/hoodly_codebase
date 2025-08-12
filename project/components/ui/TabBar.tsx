import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gradient } from './Gradient';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface TabItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface TabBarProps {
  items: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  items,
  activeTab,
  onTabPress
}) => {
  const pointerPosition = useSharedValue(0);

  React.useEffect(() => {
    const activeIndex = items.findIndex(item => item.key === activeTab);
    if (activeIndex !== -1) {
      const position = (activeIndex * 100) / items.length;
      pointerPosition.value = withSpring(position, { damping: 15, stiffness: 150 });
    }
  }, [activeTab, items]);

  const pointerStyle = useAnimatedStyle(() => ({
    left: `${pointerPosition.value}%`,
    transform: [{ translateX: -theme.components.tabbar.pointer.size / 2 }],
  }));

  return (
    <View style={styles.container}>
      <BlurView intensity={theme.blur.bar} style={styles.blurContainer}>
        {/* Pointer indicator */}
        <Animated.View style={[styles.pointer, pointerStyle]}>
          <Gradient type="primary" style={styles.pointerGradient} />
        </Animated.View>

        {/* Tab items */}
        <View style={styles.tabsContainer}>
          {items.map((item) => {
            const isActive = activeTab === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => onTabPress(item.key)}
                activeOpacity={0.8}
              >
                <View style={styles.tabContent}>
                  <View style={styles.iconContainer}>
                    {isActive ? (
                      <Gradient type="primary" style={styles.activeIconContainer}>
                        <Ionicons
                          name={item.icon}
                          size={24}
                          color={getColor('textPrimary')}
                        />
                      </Gradient>
                    ) : (
                      <Ionicons
                        name={item.icon}
                        size={24}
                        color={getColor('textSecondary')}
                      />
                    )}
                  </View>
                  <Animated.Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.activeTabLabel
                    ]}
                  >
                    {item.label}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    height: theme.components.tabbar.height,
    backgroundColor: theme.components.tabbar.bg,
    borderTopWidth: 1,
    borderTopColor: getColor('divider'),
  },
  pointer: {
    position: 'absolute',
    top: theme.components.tabbar.pointer.offset,
    width: theme.components.tabbar.pointer.size,
    height: theme.components.tabbar.pointer.size,
    borderRadius: theme.components.tabbar.pointer.size / 2,
    zIndex: 1,
  },
  pointerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: theme.components.tabbar.pointer.size / 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: getSpacing('md'),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing('sm'),
  },
  tabContent: {
    alignItems: 'center',
    gap: getSpacing('xs'),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: theme.typography.caption.size,
    color: getColor('textSecondary'),
    opacity: theme.typography.caption.opacity,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: getColor('textPrimary'),
    opacity: 1,
    fontWeight: '600',
  },
});
