/**
 * AI Systems Diagnostic Script
 * Checks OpenAI and Supabase API key configurations
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const envPath = join(__dirname, '..', '.env');
let envVars = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch (error) {
  console.log('⚠️  .env file not found or cannot be read');
}

console.log('🔍 AI Systems Diagnostic Report\n');
console.log('='.repeat(50));

// Check OpenAI Configuration
console.log('\n📡 OpenAI Configuration:');
console.log('-'.repeat(50));

const openaiKey = envVars.VITE_OPENAI_API_KEY;
if (openaiKey) {
  console.log('✅ OpenAI API Key: Found');
  console.log(`   Key Preview: ${openaiKey.substring(0, 10)}...${openaiKey.substring(openaiKey.length - 4)}`);
  console.log(`   Key Length: ${openaiKey.length} characters`);
  
  // Test OpenAI API
  console.log('\n   Testing OpenAI API connection...');
  try {
    const openai = new OpenAI({
      apiKey: openaiKey,
      dangerouslyAllowBrowser: true
    });
    
    // Test with a simple completion
    const testResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "API test successful" and nothing else.' }],
      max_tokens: 10
    });
    
    const responseText = testResponse.choices[0]?.message?.content?.trim();
    if (responseText) {
      console.log('   ✅ OpenAI API: Working');
      console.log(`   ✅ Test Response: "${responseText}"`);
      console.log(`   ✅ Model: gpt-4o-mini`);
      console.log(`   ✅ Tokens Used: ${testResponse.usage?.total_tokens || 'N/A'}`);
    } else {
      console.log('   ⚠️  OpenAI API: Connected but no response');
    }
  } catch (error) {
    console.log('   ❌ OpenAI API: Error');
    console.log(`   Error Type: ${error.constructor.name}`);
    if (error.message) {
      console.log(`   Error Message: ${error.message}`);
    }
    if (error.status) {
      console.log(`   HTTP Status: ${error.status}`);
    }
    if (error.status === 401) {
      console.log('   💡 Suggestion: Invalid API key. Check your key at https://platform.openai.com/api-keys');
    } else if (error.status === 429) {
      console.log('   💡 Suggestion: Rate limit exceeded. Check your usage at https://platform.openai.com/usage');
    } else if (error.status === 402) {
      console.log('   💡 Suggestion: Payment required. Add billing at https://platform.openai.com/account/billing');
    }
  }
} else {
  console.log('❌ OpenAI API Key: Not found');
  console.log('   💡 Add VITE_OPENAI_API_KEY to your .env file');
  console.log('   💡 Get your key from: https://platform.openai.com/api-keys');
}

// Check Supabase Configuration
console.log('\n🗄️  Supabase Configuration:');
console.log('-'.repeat(50));

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl) {
  console.log('✅ Supabase URL: Found');
  console.log(`   URL: ${supabaseUrl}`);
} else {
  console.log('❌ Supabase URL: Not found');
  console.log('   💡 Add VITE_SUPABASE_URL to your .env file');
}

if (supabaseKey) {
  console.log('✅ Supabase Anon Key: Found');
  console.log(`   Key Preview: ${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 4)}`);
  console.log(`   Key Length: ${supabaseKey.length} characters`);
  
  // Test Supabase connection
  if (supabaseUrl) {
    console.log('\n   Testing Supabase connection...');
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test connection with a simple query
      const { data, error } = await supabase
        .from('milestones')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('   ✅ Supabase: Connected (table may not exist yet, which is OK)');
        } else {
          console.log('   ⚠️  Supabase: Connected but query error');
          console.log(`   Error: ${error.message}`);
        }
      } else {
        console.log('   ✅ Supabase: Connected and working');
        console.log(`   ✅ Database: Accessible`);
      }
    } catch (error) {
      console.log('   ❌ Supabase: Connection error');
      console.log(`   Error: ${error.message}`);
    }
  }
} else {
  console.log('❌ Supabase Anon Key: Not found');
  console.log('   💡 Add VITE_SUPABASE_ANON_KEY to your .env file');
}

// Summary
console.log('\n📊 Summary:');
console.log('-'.repeat(50));

const openaiStatus = openaiKey ? '✅ Configured' : '❌ Not Configured';
const supabaseStatus = (supabaseUrl && supabaseKey) ? '✅ Configured' : '❌ Not Configured';

console.log(`OpenAI: ${openaiStatus}`);
console.log(`Supabase: ${supabaseStatus}`);

if (!openaiKey && !supabaseUrl && !supabaseKey) {
  console.log('\n⚠️  No API keys found. Please configure your .env file.');
  console.log('   See README.md or OPENAI_SETUP.md for instructions.');
}

console.log('\n' + '='.repeat(50));
console.log('Diagnostic complete!\n');






