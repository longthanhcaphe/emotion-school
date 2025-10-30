// backend/testRateLimit.js
const axios = require('axios');

const testGeneralLimit = async () => {
  console.log('🧪 Testing general rate limit (100 req/15min)...\n');
  
  const url = 'http://localhost:5000/api/health';
  let successCount = 0;
  let limitReached = false;
  let firstError = null;

  console.log(`📡 Testing endpoint: ${url}`);
  console.log(`🕐 Started at: ${new Date().toLocaleTimeString()}\n`);

  for (let i = 1; i <= 110; i++) {
    try {
      const response = await axios.get(url);
      successCount++;
      
      // Log every 10 requests
      if (i % 10 === 0) {
        console.log(`✓ ${i} requests successful (Status: ${response.status})`);
      }
      
      // Log rate limit headers
      if (i === 1) {
        const headers = response.headers;
        console.log(`\n📊 Rate Limit Headers:`);
        console.log(`   Limit: ${headers['ratelimit-limit']}`);
        console.log(`   Remaining: ${headers['ratelimit-remaining']}`);
        console.log(`   Reset: ${headers['ratelimit-reset']}\n`);
      }
      
    } catch (error) {
      // Capture first error
      if (!firstError) {
        firstError = error;
      }

      if (error.response) {
        // Server responded with error
        if (error.response.status === 429) {
          console.log(`\n🚨 Rate limit reached at request ${i}`);
          console.log(`Status: ${error.response.status}`);
          console.log(`Response:`, JSON.stringify(error.response.data, null, 2));
          
          const headers = error.response.headers;
          console.log(`\n📊 Rate Limit Headers:`);
          console.log(`   Limit: ${headers['ratelimit-limit']}`);
          console.log(`   Remaining: ${headers['ratelimit-remaining']}`);
          console.log(`   Reset: ${headers['ratelimit-reset']}`);
          
          limitReached = true;
          break;
        } else {
          console.log(`❌ Request ${i} failed with status ${error.response.status}`);
          console.log(`   Message:`, error.response.data);
        }
      } else if (error.request) {
        // Request made but no response
        console.log(`❌ No response from server at request ${i}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Make sure server is running on http://localhost:5000`);
        break;
      } else {
        // Error setting up request
        console.log(`❌ Error setting up request ${i}: ${error.message}`);
        break;
      }
    }

    // Small delay to avoid overwhelming (optional)
    // await new Promise(resolve => setTimeout(resolve, 10));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`🚨 Rate limit triggered: ${limitReached ? 'YES ✓' : 'NO ✗'}`);
  
  if (successCount === 0 && firstError) {
    console.log(`\n❌ NO REQUESTS SUCCEEDED!`);
    console.log(`\nFirst error details:`);
    if (firstError.response) {
      console.log(`   Status: ${firstError.response.status}`);
      console.log(`   Data:`, firstError.response.data);
    } else if (firstError.request) {
      console.log(`   Error: ${firstError.message}`);
      console.log(`   Code: ${firstError.code}`);
      console.log(`\n💡 SOLUTION: Make sure server is running!`);
      console.log(`   Run in another terminal: npm run dev`);
    } else {
      console.log(`   Error: ${firstError.message}`);
    }
  } else if (limitReached) {
    console.log(`\n✅ Rate limiting is working correctly!`);
  } else {
    console.log(`\n⚠️  Warning: Rate limit was not triggered within 110 requests`);
  }
  
  console.log(`${'='.repeat(60)}\n`);
};

// Run test
console.log('Starting rate limit test...\n');
testGeneralLimit().catch(error => {
  console.error('\n❌ Test failed with error:', error.message);
  process.exit(1);
});