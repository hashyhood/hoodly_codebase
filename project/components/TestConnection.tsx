import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function TestConnection() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testBasicConnection = async () => {
    setIsLoading(true);
    addResult('Testing basic Supabase connection...');
    
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        addResult(`❌ Connection failed: ${error.message}`);
        console.error('Connection error:', error);
      } else {
        addResult('✅ Basic connection successful');
      }
    } catch (error: any) {
      addResult(`❌ Exception: ${error.message}`);
      console.error('Exception:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testStorage = async () => {
    setIsLoading(true);
    addResult('Testing storage bucket...');
    
    try {
      const { data, error } = await supabase.storage.from('uploads').list('', { limit: 1 });
      
      if (error) {
        addResult(`❌ Storage error: ${error.message}`);
        console.error('Storage error:', error);
      } else {
        addResult('✅ Storage bucket accessible');
      }
    } catch (error: any) {
      addResult(`❌ Storage exception: ${error.message}`);
      console.error('Storage exception:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuth = async () => {
    setIsLoading(true);
    addResult('Testing auth endpoints...');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addResult(`❌ Auth error: ${error.message}`);
        console.error('Auth error:', error);
      } else {
        addResult('✅ Auth endpoints accessible');
      }
    } catch (error: any) {
      addResult(`❌ Auth exception: ${error.message}`);
      console.error('Auth exception:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testSignUp = async () => {
    setIsLoading(true);
    addResult('Testing sign up...');
    
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123',
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      });
      
      if (error) {
        addResult(`❌ Sign up error: ${error.message}`);
        console.error('Sign up error:', error);
      } else {
        addResult('✅ Sign up successful (check your email)');
      }
    } catch (error: any) {
      addResult(`❌ Sign up exception: ${error.message}`);
      console.error('Sign up exception:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAll = async () => {
    clearResults();
    addResult('Starting comprehensive connection test...');
    
    await testBasicConnection();
    await testStorage();
    await testAuth();
    await testSignUp();
    
    addResult('Test completed!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testAll}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testBasicConnection}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testStorage}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Storage</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testSignUp}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Sign Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearResults}
        >
          <Text style={styles.clearButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6B9D',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    padding: 15,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
}); 