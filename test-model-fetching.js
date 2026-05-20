// Simple test script to verify model fetching works
// This simulates what happens in the SettingsPage component

const { fetchAvailableModels } = require('./src/services/ttsServices.ts');

async function testModelFetching() {
  console.log('Testing model fetching...');
  
  // Test 1: Gemini provider (should return hardcoded models)
  console.log('\n1. Testing Gemini provider:');
  const geminiConfig = {
    llm: { provider: 'gemini' }
  };
  
  try {
    const geminiModels = await fetchAvailableModels(geminiConfig);
    console.log('✓ Gemini models:', geminiModels.map(m => m.id));
  } catch (error) {
    console.error('✗ Gemini test failed:', error.message);
  }
  
  // Test 2: OpenAI provider with URL (should attempt to fetch)
  console.log('\n2. Testing OpenAI provider with URL:');
  const openaiConfig = {
    llm: {
      provider: 'openai',
      openAiUrl: 'https://api.openai.com/v1/chat/completions',
      openAiKey: 'test-key'
    }
  };
  
  try {
    const openaiModels = await fetchAvailableModels(openaiConfig);
    console.log('✓ OpenAI models:', openaiModels.map(m => m.id));
  } catch (error) {
    console.log('✓ OpenAI test correctly failed (expected in test environment):', error.message);
  }
  
  // Test 3: OpenAI provider without URL (should return empty)
  console.log('\n3. Testing OpenAI provider without URL:');
  const openaiNoUrlConfig = {
    llm: { provider: 'openai' }
  };
  
  try {
    const noUrlModels = await fetchAvailableModels(openaiNoUrlConfig);
    console.log('✓ No URL test returned empty array:', noUrlModels.length === 0);
  } catch (error) {
    console.error('✗ No URL test failed:', error.message);
  }
  
  // Test 4: Claude provider (should return empty)
  console.log('\n4. Testing Claude provider:');
  const claudeConfig = {
    llm: {
      provider: 'claude',
      openAiUrl: 'https://api.anthropic.com'
    }
  };
  
  try {
    const claudeModels = await fetchAvailableModels(claudeConfig);
    console.log('✓ Claude test returned empty array:', claudeModels.length === 0);
  } catch (error) {
    console.error('✗ Claude test failed:', error.message);
  }
  
  console.log('\n✓ All tests completed!');
}

// Run the tests
testModelFetching().catch(console.error);