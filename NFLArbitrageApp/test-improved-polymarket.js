// Test the improved Polymarket API logic
// Run with: node test-improved-polymarket.js

console.log('🧪 TESTING IMPROVED POLYMARKET LOGIC\n');

async function simulateImprovedAPI() {
  const baseURL = 'https://clob.polymarket.com/markets';
  const maxPages = 3;
  let allMarkets = [];
  let cursor = null;

  console.log('Simulating the new API logic...\n');

  for (let page = 1; page <= maxPages; page++) {
    const url = cursor ? `${baseURL}?next_cursor=${cursor}` : baseURL;
    console.log(`📄 Fetching page ${page}...`);

    const response = await fetch(url);
    const data = await response.json();

    const rawMarkets = data.data || [];

    // Apply the SAME filtering as polymarketAPI.ts
    const filtered = rawMarkets.filter(market => {
      // Skip closed or resolved
      if (market.closed === true || market.resolved === true) {
        return false;
      }

      // Skip old markets (before 2023)
      if (market.end_date_iso && new Date(market.end_date_iso) < new Date('2023-01-01')) {
        return false;
      }

      return true;
    });

    allMarkets.push(...filtered);

    console.log(`   Raw: ${rawMarkets.length}, Filtered: ${filtered.length}, Total: ${allMarkets.length}`);

    if (!data.next_cursor) {
      console.log('   No more pages\n');
      break;
    }

    cursor = data.next_cursor;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('='.repeat(70));
  console.log('📊 RESULTS');
  console.log('='.repeat(70));
  console.log(`\n✅ Total markets after filtering: ${allMarkets.length}`);

  // Analyze the markets
  const acceptingOrders = allMarkets.filter(m => m.accepting_orders === true);
  const futureMarkets = allMarkets.filter(m => {
    if (!m.end_date_iso) return true;
    return new Date(m.end_date_iso) > new Date();
  });

  console.log(`   Accepting orders: ${acceptingOrders.length}`);
  console.log(`   Future end dates: ${futureMarkets.length}`);

  // Sports analysis
  const sportsKeywords = ['nfl', 'football', 'nba', 'mlb', 'super bowl'];
  const sportsMarkets = allMarkets.filter(m => {
    const title = (m.question || m.title || '').toLowerCase();
    return sportsKeywords.some(keyword => title.includes(keyword));
  });

  console.log(`   Sports markets: ${sportsMarkets.length}`);

  if (sportsMarkets.length > 0) {
    console.log(`\n🏈 Sample sports markets (first 10):`);
    sportsMarkets.slice(0, 10).forEach((m, i) => {
      console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
    });
  }

  // Show some sample markets
  if (allMarkets.length > 0) {
    console.log(`\n📋 Sample markets (first 5):`);
    allMarkets.slice(0, 5).forEach((m, i) => {
      console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
      console.log(`      End: ${m.end_date_iso || 'N/A'}, Accepting: ${m.accepting_orders}`);
    });
  }

  console.log(`\n\n🎉 IMPROVEMENT SUMMARY:`);
  console.log(`   Old approach: ~1-13 markets (accepting_orders=true only)`);
  console.log(`   New approach: ${allMarkets.length} markets (closed=false)`);
  console.log(`   That's ${Math.floor(allMarkets.length / 13)}x more markets!`);
}

simulateImprovedAPI();
