import { supabase } from './supabase';
import { CONFIG } from './config';
import websocketManager from './websocket';

interface ConnectionTestResult {
  supabase: {
    connected: boolean;
    error?: string;
  };
  websocket: {
    connected: boolean;
    error?: string;
  };
  database: {
    connected: boolean;
    error?: string;
  };
  auth: {
    working: boolean;
    error?: string;
  };
}

export class ConnectionTester {
  private results: ConnectionTestResult = {
    supabase: { connected: false },
    websocket: { connected: false },
    database: { connected: false },
    auth: { working: false }
  };

  async testAllConnections(): Promise<ConnectionTestResult> {
    console.log('🔍 Testing Hoodly App Connections...\n');

    // Test Supabase connection
    await this.testSupabaseConnection();
    
    // Test WebSocket connection
    await this.testWebSocketConnection();
    
    // Test database operations
    await this.testDatabaseConnection();
    
    // Test authentication
    await this.testAuthentication();

    this.printResults();
    return this.results;
  }

  private async testSupabaseConnection() {
    try {
      console.log('📡 Testing Supabase connection...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        this.results.supabase = {
          connected: false,
          error: error.message
        };
        console.log('❌ Supabase connection failed:', error.message);
      } else {
        this.results.supabase = { connected: true };
        console.log('✅ Supabase connection successful');
      }
    } catch (error: any) {
      this.results.supabase = {
        connected: false,
        error: error.message
      };
      console.log('❌ Supabase connection failed:', error.message);
    }
  }

  private async testWebSocketConnection() {
    try {
      console.log('🔌 Testing WebSocket connection...');
      
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          this.results.websocket = {
            connected: false,
            error: 'Connection timeout'
          };
          console.log('❌ WebSocket connection timeout');
          resolve();
        }, 5000);

        websocketManager.setHandlers({
          onConnect: () => {
            clearTimeout(timeout);
            this.results.websocket = { connected: true };
            console.log('✅ WebSocket connection successful');
            resolve();
          },
          onError: (error) => {
            clearTimeout(timeout);
            this.results.websocket = {
              connected: false,
              error: error.message || 'Connection failed'
            };
            console.log('❌ WebSocket connection failed:', error);
            resolve();
          }
        });

        websocketManager.connect();
      });
    } catch (error: any) {
      this.results.websocket = {
        connected: false,
        error: error.message
      };
      console.log('❌ WebSocket connection failed:', error.message);
    }
  }

  private async testDatabaseConnection() {
    try {
      console.log('🗄️ Testing database operations...');
      
      // Test basic CRUD operations
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Test read operation
        const { data: profile, error: readError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (readError) {
          this.results.database = {
            connected: false,
            error: `Read operation failed: ${readError.message}`
          };
          console.log('❌ Database read operation failed:', readError.message);
        } else {
          this.results.database = { connected: true };
          console.log('✅ Database operations successful');
        }
      } else {
        // Test without user (public data)
        const { data: rooms, error: readError } = await supabase
          .from('rooms')
          .select('count')
          .limit(1);

        if (readError) {
          this.results.database = {
            connected: false,
            error: `Public read operation failed: ${readError.message}`
          };
          console.log('❌ Database public read operation failed:', readError.message);
        } else {
          this.results.database = { connected: true };
          console.log('✅ Database operations successful');
        }
      }
    } catch (error: any) {
      this.results.database = {
        connected: false,
        error: error.message
      };
      console.log('❌ Database connection failed:', error.message);
    }
  }

  private async testAuthentication() {
    try {
      console.log('🔐 Testing authentication...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.results.auth = {
          working: false,
          error: error.message
        };
        console.log('❌ Authentication failed:', error.message);
      } else if (session) {
        this.results.auth = { working: true };
        console.log('✅ Authentication working (user logged in)');
      } else {
        this.results.auth = { working: true };
        console.log('✅ Authentication working (no user logged in)');
      }
    } catch (error: any) {
      this.results.auth = {
        working: false,
        error: error.message
      };
      console.log('❌ Authentication failed:', error.message);
    }
  }

  private printResults() {
    console.log('\n📊 Connection Test Results:');
    console.log('========================');
    
    Object.entries(this.results).forEach(([service, result]) => {
      const status = result.connected || result.working ? '✅' : '❌';
      const serviceName = service.charAt(0).toUpperCase() + service.slice(1);
      console.log(`${status} ${serviceName}: ${result.connected || result.working ? 'Connected' : 'Failed'}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const allWorking = Object.values(this.results).every(result => 
      result.connected || result.working
    );

    console.log('\n🎯 Overall Status:', allWorking ? '✅ ALL SYSTEMS OPERATIONAL' : '⚠️ SOME ISSUES DETECTED');
    
    if (!allWorking) {
      console.log('\n🔧 Recommended Actions:');
      if (!this.results.supabase.connected) {
        console.log('   - Check Supabase configuration in .env file');
        console.log('   - Verify Supabase project is active');
      }
      if (!this.results.websocket.connected) {
        console.log('   - Check backend server is running (npm run dev:backend)');
        console.log('   - Verify WebSocket URL in config.ts');
      }
      if (!this.results.database.connected) {
        console.log('   - Check database migrations are applied');
        console.log('   - Verify RLS policies are configured');
      }
      if (!this.results.auth.working) {
        console.log('   - Check authentication configuration');
        console.log('   - Verify JWT settings');
      }
    }
  }

  async testRealTimeFeatures() {
    console.log('\n🚀 Testing Real-time Features...');
    
    if (!this.results.websocket.connected) {
      console.log('❌ WebSocket not connected, skipping real-time tests');
      return;
    }

    // Test room joining
    console.log('   Testing room join...');
    websocketManager.joinRoom('test-room-1');
    
    // Test message sending
    console.log('   Testing message sending...');
    websocketManager.sendMessage('test-room-1', {
      text: 'Test message from connection tester',
      user: 'Connection Tester',
      userId: 'test-user',
      emoji: '🧪'
    });

    // Test typing indicators
    console.log('   Testing typing indicators...');
    websocketManager.startTyping('test-room-1');
    setTimeout(() => {
      websocketManager.stopTyping('test-room-1');
    }, 1000);

    console.log('✅ Real-time feature tests completed');
  }
}

// Export singleton instance
export const connectionTester = new ConnectionTester();

// Test function for easy access
export const testConnections = () => connectionTester.testAllConnections();
export const testRealTime = () => connectionTester.testRealTimeFeatures(); 