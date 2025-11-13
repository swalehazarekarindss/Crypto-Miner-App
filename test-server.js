// Quick test to check if server is accessible
const axios = require('axios');

const API_URL = 'http://192.168.1.5:5000';

async function testServer() {
  try {
    console.log('Testing server connection...');
    const response = await axios.get(API_URL);
    console.log('✅ Server is running!');
    console.log('Response:', response.data);
    
    // Test registration
    console.log('\nTesting registration...');
    const testWallet = 'testuser' + Date.now();
    const regResponse = await axios.post(`${API_URL}/api/user/register`, {
      walletId: testWallet,
      password: 'Test1234'
    });
    console.log('✅ Registration successful!');
    console.log('Token:', regResponse.data.token);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Server responded with:', error.response.data);
    } else if (error.request) {
      console.error('No response from server. Is it running?');
    }
  }
}

testServer();
