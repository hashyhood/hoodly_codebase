import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Search, Mic, Filter, X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  onFilter?: () => void;
  onVoice?: () => void;
  showFilter?: boolean;
  showVoice?: boolean;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onSearch,
  onFilter,
  onVoice,
  showFilter = false,
  showVoice = false,
  autoFocus = false,
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnimation = new Animated.Value(0);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={20} style={[
        styles.searchContainer,
        {
          backgroundColor: theme.colors.glass.primary,
          borderColor: isFocused ? theme.colors.neural.primary : theme.colors.glass.border,
        }
      ]}>
        <Search size={20} color={theme.colors.text.tertiary} style={styles.searchIcon} />
        
        <TextInput
          style={[
            styles.input,
            { color: theme.colors.text.primary }
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          autoFocus={autoFocus}
        />
        
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={16} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
        
        {showVoice && (
          <TouchableOpacity onPress={onVoice} style={styles.actionButton}>
            <Mic size={18} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
        
        {showFilter && (
          <TouchableOpacity onPress={onFilter} style={styles.actionButton}>
            <Filter size={18} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
}); 