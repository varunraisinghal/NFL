// Test the Gamma API with proper parameters
// Run with: node test-gamma-api.js

console.log('🧪 TESTING POLYMARKET GAMMA API\n');

async function testGammaAPI() {
  const baseURL = 'https://gamma-api.polymarket.com/markets';

  // Test 1: Active markets only
  console.log('='.repeat(70));
  console.log('Test 1: Active markets (active=true, closed=false)');
  console.log('='.repeat(70));

  const url1 = `${baseURL}?active=true&closed=false&limit=100`;
  console.log(`URL: ${url1}\n`);

  try {
    const response = await fetch(url1);
    const markets = await response.json();

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Markets returned: ${markets.length}`);

    if (markets.length > 0) {
      // Check dates
      const now = new Date();
      const currentMarkets = markets.filter(m => {
        if (!m.endDate) return true;
        return new Date(m.endDate) > now;
      });

      console.log(`✅ Current/future markets: ${currentMarkets.length}`);

      // Sample markets
      console.log(`\n📋 Sample markets (first 5):`);
      currentMarkets.slice(0, 5).forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.question || m.title}`);
        console.log(`      End Date: ${m.endDate || 'N/A'}`);
        console.log(`      Volume: $${m.volumeNum?.toLocaleString() || 0}`);
        console.log(`      Active: ${m.active}, Closed: ${m.closed}`);

        if (m.outcomePrices) {
          console.log(`      Prices: ${m.outcomePrices.join(', ')}`);
        }
      });
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 2: With pagination
  console.log('\n\n' + '='.repeat(70));
  console.log('Test 2: Pagination test (multiple pages)');
  console.log('='.repeat(70) + '\n');

  let allMarkets = [];
  const limit = 100;
  const maxPages = 3;

  for (let page = 0; page < maxPages; page++) {
    const offset = page * limit;
    const url = `${baseURL}?active=true&closed=false&limit=${limit}&offset=${offset}`;
    console.log(`Fetching page ${page + 1} (offset=${offset})...`);

    try {
      const response = await fetch(url);
      const markets = await response.json();

      if (markets.length === 0) {
        console.log('   No more markets\n');
        break;
      }

      allMarkets.push(...markets);
      console.log(`   Got ${markets.length} markets (total: ${allMarkets.length})`);

      if (markets.length < limit) {
        console.log('   Last page reached\n');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      break;
    }
  }

  console.log(`\n✅ Total markets from Gamma API: ${allMarkets.length}`);

  // Analyze the markets
  if (allMarkets.length > 0) {
    const now = new Date();
    const futureMarkets = allMarkets.filter(m => {
      if (!m.endDate) return true;
      return new Date(m.endDate) > now;
    });

    const recent2024 = allMarkets.filter(m => {
      if (!m.endDate) return true;
      return new Date(m.endDate) > new Date('2024-01-01');
    });

    const recent2025 = allMarkets.filter(m => {
      if (!m.endDate) return true;
      return new Date(m.endDate) > new Date('2025-01-01');
    });

    console.log(`\n📊 Market Analysis:`);
    console.log(`   Future markets (end date > now): ${futureMarkets.length}`);
    console.log(`   2024+ markets: ${recent2024.length}`);
    console.log(`   2025+ markets: ${recent2025.length}`);

    // Categories
    const categories = [...new Set(allMarkets.flatMap(m => m.tags || []))];
    console.log(`\n📂 Categories/Tags: ${categories.length}`);
    if (categories.length > 0) {
      console.log(`   ${categories.slice(0, 10).join(', ')}${categories.length > 10 ? '...' : ''}`);
    }

    // Sports
    const sportsKeywords = ['nfl', 'football', 'nba', 'mlb', 'nhl', 'super bowl'];
    const sportsMarkets = futureMarkets.filter(m => {
      const title = (m.question || '').toLowerCase();
      return sportsKeywords.some(keyword => title.includes(keyword));
    });

    console.log(`\n🏈 Sports markets (current): ${sportsMarkets.length}`);
    if (sportsMarkets.length > 0) {
      console.log(`   Sample sports markets:`);
      sportsMarkets.slice(0, 5).forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.question.substring(0, 70)}`);
      });
    }
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('🎯 RECOMMENDATION');
  console.log('='.repeat(70));
  console.log(`\nGamma API is ${allMarkets.length > 0 ? 'WORKING' : 'NOT WORKING'} with active=true&closed=false`);
  console.log(`Total active markets: ${allMarkets.length}`);
  console.log(`\nThis should be used instead of CLOB API for current markets!`);
}

testGammaAPI();
