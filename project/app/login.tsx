import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { signIn, signInWithOAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Missing Information', 'Please fill in your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        Alert.alert('Login Failed', error.message || 'Invalid email or password.');
        return;
      }

      if (data?.user) {
        // Navigation will be handled by AuthWrapper automatically
        console.log('Login successful:', data.user.email);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
      <LinearGradient
        colors={theme.colors.gradients.neural as [string, string]}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <BlurView intensity={30} style={[styles.header, { borderBottomColor: theme.colors.glass.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.glass.secondary }]}>
            <ArrowLeft color={theme.colors.text.primary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Welcome Back</Text>
          <View style={styles.headerSpacer} />
        </BlurView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.formContainer}>
            {/* Welcome Text */}
            <View style={styles.welcomeSection}>
              <Text style={[styles.welcomeTitle, { color: theme.colors.text.primary }]}>
                Welcome to Hoodly
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.colors.text.secondary }]}>
                Connect with your community and discover amazing people around you
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formSection}>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }]}>
                <Mail color={theme.colors.text.secondary} size={20} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text.primary }]}
                  placeholder="Email Address"
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }]}>
                <Lock color={theme.colors.text.secondary} size={20} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text.primary }]}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff color={theme.colors.text.secondary} size={20} />
                  ) : (
                    <Eye color={theme.colors.text.secondary} size={20} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: theme.colors.text.secondary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && { opacity: 0.7 }
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={theme.colors.gradients.neural as [string, string]}
                style={styles.loginGradient}
              >
                <Text style={[styles.loginText, { color: theme.colors.text.inverse }]}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.colors.glass.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.text.tertiary }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: theme.colors.glass.border }]} />
            </View>

            {/* OAuth Buttons */}
            <View style={styles.oauthSection}>
              <TouchableOpacity
                style={[styles.oauthButton, { backgroundColor: theme.colors.glass.secondary, borderColor: theme.colors.glass.border }]}
                onPress={() => signInWithOAuth('google')}
              >
                <Text style={[styles.oauthText, { color: theme.colors.text.primary }]}>
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <TouchableOpacity
              style={[styles.registerLink, { backgroundColor: theme.colors.glass.secondary, borderColor: theme.colors.glass.border }]}
              onPress={() => router.push('/register')}
            >
              <Text style={[styles.registerText, { color: theme.colors.text.primary }]}>
                Don&apos;t have an account? Create one
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 32,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  oauthSection: {
    marginBottom: 24,
  },
  oauthButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  oauthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 