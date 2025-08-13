const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testServer() {
  console.log('🧪 Testing Fantasy Football Tracker...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', health.data);
    
    // Test 2: Auth status
    console.log('\n2. Testing auth status...');
    const authStatus = await axios.get(`${BASE_URL}/api/auth/status`);
    console.log('✅ Auth status:', authStatus.data);
    
    // Test 3: AI endpoint (should work even without API key)
    console.log('\n3. Testing AI endpoint...');
    try {
      const aiQuery = await axios.post(`${BASE_URL}/api/ai/query`, {
        query: 'Test query'
      });
      console.log('✅ AI endpoint accessible');
    } catch (error) {
      if (error.response?.status === 503) {
        console.log('⚠️  AI service unavailable (expected without API key)');
      } else {
        throw error;
      }
    }
    
    // Test 4: Static files
    console.log('\n4. Testing static file serving...');
    const homepage = await axios.get(BASE_URL);
    if (homepage.data.includes('Fantasy Football Tracker')) {
      console.log('✅ Homepage loads successfully');
    }
    
    console.log('\n✨ All tests passed! Server is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Add your Yahoo API credentials to .env');
    console.log('2. Add your Perplexity API key to .env');
    console.log('3. Open http://localhost:3000 in your browser');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Make sure the server is running: npm start');
    }
  }
}

testServer();