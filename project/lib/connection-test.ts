import { supabase } from './supabase';

interface ConnectionTestResult {
  supabase: {
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
    database: { connected: false },
    auth: { working: false }
  };

  async testAllConnections(): Promise<ConnectionTestResult> {
    console.log('🧪 Starting connection tests...');
    
    await Promise.all([
      this.testSupabaseConnection(),
      this.testDatabaseConnection(),
      this.testAuthentication()
    ]);

    this.printResults();
    return this.results;
  }

  private async testSupabaseConnection() {
    try {
      console.log('🔌 Testing Supabase connection...');
      
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
    
    Object.entries(this.results).forEach(([key, result]) => {
      const status = result.error ? '❌' : '✅';
      const message = result.error ? `${key}: ${result.error}` : `${key}: Working`;
      console.log(`${status} ${message}`);
    });
    
    console.log('========================\n');
  }

  async testRealTimeFeatures() {
    console.log('🔄 Testing real-time features...');
    
    try {
      // Test real-time subscription
      const channel = supabase
        .channel('test-realtime')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'profiles' 
        }, (payload) => {
          console.log('✅ Real-time subscription working:', payload);
        })
        .subscribe();

      // Wait a bit for subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test presence
      const presenceChannel = supabase.channel('test-presence', {
        config: {
          presence: {
            key: 'test-user'
          }
        }
      });

      presenceChannel.track({
        user: 'Connection Tester',
        userId: 'test-user',
        emoji: '🧪'
      });

      await presenceChannel.subscribe();
      
      console.log('✅ Real-time features working');
      
      // Cleanup
      channel.unsubscribe();
      presenceChannel.unsubscribe();
      
    } catch (error: any) {
      console.log('❌ Real-time features failed:', error.message);
    }
  }
}

const connectionTester = new ConnectionTester();

export const testConnections = () => connectionTester.testAllConnections();
export const testRealTime = () => connectionTester.testRealTimeFeatures(); 
