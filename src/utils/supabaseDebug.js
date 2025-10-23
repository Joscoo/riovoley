// src/utils/supabaseDebug.js
import { createClient } from '@supabase/supabase-js';

export const debugSupabaseAuth = async () => {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  console.log('🔍 Starting Supabase Auth Debug...');
  console.log('URL:', url);
  console.log('Key (first 50 chars):', key?.substring(0, 50));

  const results = {
    envVars: {
      url,
      keyLength: key?.length,
      urlValid: url?.includes('supabase.co'),
      keyValid: key?.startsWith('eyJ')
    }
  };

  try {
    // Test 1: Crear cliente
    const client = createClient(url, key);
    results.clientCreation = { success: true };

    // Test 2: Verificar configuración del proyecto con endpoint directo
    try {
      const projectResponse = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      results.projectAccess = {
        status: projectResponse.status,
        ok: projectResponse.ok,
        statusText: projectResponse.statusText,
        headers: Object.fromEntries(projectResponse.headers.entries())
      };

      if (projectResponse.ok) {
        console.log('✅ Project access OK');
      } else {
        console.log('❌ Project access failed:', projectResponse.status);
      }
    } catch (err) {
      results.projectAccess = { error: err.message };
    }

    // Test 3: Test específico del endpoint de auth
    try {
      const authResponse = await fetch(`${url}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      results.authEndpoint = {
        status: authResponse.status,
        ok: authResponse.ok,
        statusText: authResponse.statusText
      };

      if (authResponse.ok) {
        const authSettings = await authResponse.json();
        results.authSettings = authSettings;
        console.log('✅ Auth endpoint OK, settings:', authSettings);
      } else {
        const errorText = await authResponse.text();
        results.authEndpoint.errorBody = errorText;
        console.log('❌ Auth endpoint failed:', authResponse.status, errorText);
      }
    } catch (err) {
      results.authEndpoint = { error: err.message };
    }

    // Test 4: Test de login con datos específicos del error
    try {
      console.log('🔐 Testing auth login directly...');
      
      const loginResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@riovoley.com',
          password: 'wrongpassword'
        })
      });

      results.directLogin = {
        status: loginResponse.status,
        ok: loginResponse.ok,
        statusText: loginResponse.statusText,
        headers: Object.fromEntries(loginResponse.headers.entries())
      };

      const responseText = await loginResponse.text();
      results.directLogin.body = responseText;

      if (!loginResponse.ok) {
        console.log('❌ Direct login failed (expected):', loginResponse.status);
        console.log('Response body:', responseText);
        
        // Analizar el tipo de error
        try {
          const errorJson = JSON.parse(responseText);
          results.directLogin.errorDetails = errorJson;
        } catch (parseError) {
          console.log('Response is not valid JSON:', parseError.message);
          results.directLogin.parseError = parseError.message;
        }
      }
    } catch (err) {
      results.directLogin = { error: err.message };
      console.log('❌ Direct login test failed:', err.message);
    }

    // Test 5: Test con el cliente de Supabase
    try {
      console.log('🔧 Testing with Supabase client...');
      
      const { data, error } = await client.auth.signInWithPassword({
        email: 'admin@riovoley.com',
        password: 'wrongpassword'
      });

      results.supabaseClientLogin = {
        success: !error,
        error: error?.message,
        data,
        errorCode: error?.status,
        errorDetails: error
      };

      if (error) {
        console.log('❌ Supabase client login failed:', error);
      } else {
        console.log('✅ Supabase client login successful (unexpected)');
      }
    } catch (err) {
      results.supabaseClientLogin = { error: err.message };
      console.log('❌ Supabase client test failed:', err.message);
    }

  } catch (err) {
    results.clientCreation = { success: false, error: err.message };
    console.error('❌ Failed to create Supabase client:', err);
  }

  console.log('🔍 Debug results:', results);
  return results;
};