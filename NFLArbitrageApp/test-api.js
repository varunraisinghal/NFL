// Test script to debug API responses
// Run with: node test-api.js

console.log('🧪 Starting API Debug Test...\n');

// Test Polymarket API
async function testPolymarket() {
  console.log('='.repeat(60));
  console.log('📊 TESTING POLYMARKET API');
  console.log('='.repeat(60));

  const endpoints = [
    'https://clob.polymarket.com/markets',
    'https://gamma-api.polymarket.com/markets',
    'https://api.polymarket.com/markets',
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint}`);

    try {
      // Try with parameters
      const urlWithParams = `${endpoint}?active=true&closed=false&limit=5`;
      console.log(`   URL: ${urlWithParams}`);

      const response = await fetch(urlWithParams, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ArbitrageApp/1.0',
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();

        // Analyze response structure
        console.log(`   ✅ SUCCESS!`);
        console.log(`   Response Type: ${Array.isArray(data) ? 'Array' : 'Object'}`);

        if (Array.isArray(data)) {
          console.log(`   Items Count: ${data.length}`);
          if (data.length > 0) {
            console.log(`\n   📋 Sample Item Structure:`);
            console.log(JSON.stringify(data[0], null, 2).split('\n').slice(0, 30).join('\n'));
          }
        } else {
          console.log(`   Keys: ${Object.keys(data).join(', ')}`);

          if (data.markets) {
            console.log(`   Markets Count: ${data.markets.length}`);
            if (data.markets.length > 0) {
              console.log(`\n   📋 Sample Market Structure:`);
              console.log(JSON.stringify(data.markets[0], null, 2).split('\n').slice(0, 30).join('\n'));
            }
          } else if (data.data) {
            console.log(`   Data Count: ${data.data.length}`);
            if (data.data.length > 0) {
              console.log(`\n   📋 Sample Data Structure:`);
              console.log(JSON.stringify(data.data[0], null, 2).split('\n').slice(0, 30).join('\n'));
            }
          }
        }

        // This endpoint worked, so we can break
        console.log(`\n   🎉 Found working endpoint!`);
        return;
      } else {
        console.log(`   ❌ Failed with status ${response.status}`);

        // Try without parameters
        console.log(`\n   🔄 Trying without parameters: ${endpoint}`);
        const simpleResponse = await fetch(endpoint);
        console.log(`   Status: ${simpleResponse.status} ${simpleResponse.statusText}`);

        if (simpleResponse.ok) {
          const data = await simpleResponse.json();
          console.log(`   ✅ SUCCESS without parameters!`);
          console.log(`   Response Type: ${Array.isArray(data) ? 'Array' : 'Object'}`);

          if (Array.isArray(data)) {
            console.log(`   Items Count: ${data.length}`);
          } else {
            console.log(`   Keys: ${Object.keys(data).join(', ')}`);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n');
}

// Test Kalshi API
async function testKalshi() {
  console.log('='.repeat(60));
  console.log('📊 TESTING KALSHI API');
  console.log('='.repeat(60));

  const endpoints = [
    'https://api.elections.kalshi.com/trade-api/v2/markets',
    'https://trading-api.kalshi.com/trade-api/v2/markets',
    'https://api.kalshi.com/trade-api/v2/markets',
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint}`);

    try {
      // Try with parameters
      const urlWithParams = `${endpoint}?status=open&limit=5`;
      console.log(`   URL: ${urlWithParams}`);

      const response = await fetch(urlWithParams, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ArbitrageApp/1.0',
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();

        // Analyze response structure
        console.log(`   ✅ SUCCESS!`);
        console.log(`   Response Type: ${Array.isArray(data) ? 'Array' : 'Object'}`);

        if (Array.isArray(data)) {
          console.log(`   Items Count: ${data.length}`);
          if (data.length > 0) {
            console.log(`\n   📋 Sample Item Structure:`);
            console.log(JSON.stringify(data[0], null, 2).split('\n').slice(0, 30).join('\n'));
          }
        } else {
          console.log(`   Keys: ${Object.keys(data).join(', ')}`);

          if (data.markets) {
            console.log(`   Markets Count: ${data.markets.length}`);
            if (data.markets.length > 0) {
              console.log(`\n   📋 Sample Market Structure:`);
              console.log(JSON.stringify(data.markets[0], null, 2).split('\n').slice(0, 30).join('\n'));

              // Specifically check for price fields
              const market = data.markets[0];
              console.log(`\n   💰 Price Fields Available:`);
              console.log(`      - yes_price: ${market.yes_price}`);
              console.log(`      - no_price: ${market.no_price}`);
              console.log(`      - yes_ask: ${market.yes_ask}`);
              console.log(`      - no_ask: ${market.no_ask}`);
              console.log(`      - last_price: ${market.last_price}`);
            }
          }
        }

        // This endpoint worked
        console.log(`\n   🎉 Found working endpoint!`);
        return;
      } else {
        console.log(`   ❌ Failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n');
}

// Run tests
async function runAllTests() {
  try {
    await testPolymarket();
    await testKalshi();

    console.log('='.repeat(60));
    console.log('✅ API DEBUG TEST COMPLETE');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

runAllTests();
