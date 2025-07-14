import { supabase } from './supabase';

// Test Supabase connection
export const testSupabaseConnection = async () => {
  console.log('Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection test
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Test storage bucket access
    console.log('2. Testing storage bucket access...');
    const { data: storageData, error: storageError } = await supabase.storage
      .from('uploads')
      .list('', { limit: 1 });
    
    if (storageError) {
      console.error('Storage test failed:', storageError);
      return { success: false, error: storageError };
    }
    
    console.log('✅ Storage bucket access successful');
    
    // Test 3: Test auth endpoints
    console.log('3. Testing auth endpoints...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth test failed:', authError);
      return { success: false, error: authError };
    }
    
    console.log('✅ Auth endpoints successful');
    
    console.log('🎉 All tests passed! Supabase connection is working correctly.');
    return { success: true };
    
  } catch (error) {
    console.error('Test failed with exception:', error);
    return { success: false, error };
  }
};

// Test specific API calls
export const testSpecificAPIs = async () => {
  console.log('Testing specific API calls...');
  
  try {
    // Test profiles table
    console.log('Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('Profiles table error:', profilesError);
    } else {
      console.log('✅ Profiles table accessible');
    }
    
    // Test posts table
    console.log('Testing posts table...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
    
    if (postsError) {
      console.error('Posts table error:', postsError);
    } else {
      console.log('✅ Posts table accessible');
    }
    
    // Test storage upload path
    console.log('Testing storage upload path...');
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload('test/test.txt', testFile);
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
    } else {
      console.log('✅ Storage upload successful');
      
      // Clean up test file
      await supabase.storage.from('uploads').remove(['test/test.txt']);
    }
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}; 