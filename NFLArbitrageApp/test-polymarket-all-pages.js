// Fetch ALL Polymarket markets using pagination
// Run with: node test-polymarket-all-pages.js

console.log('🔍 FETCHING ALL POLYMARKET MARKETS\n');

async function fetchAllMarkets() {
  const baseUrl = 'https://clob.polymarket.com/markets';
  let allMarkets = [];
  let cursor = null;
  let page = 1;
  const maxPages = 5; // Fetch first 5 pages (5000 markets)

  console.log('Fetching markets with pagination...\n');

  while (page <= maxPages) {
    try {
      const url = cursor ? `${baseUrl}?next_cursor=${cursor}` : baseUrl;
      console.log(`📄 Fetching page ${page}...`);

      const response = await fetch(url);
      const data = await response.json();

      const markets = data.data || [];
      allMarkets.push(...markets);

      console.log(`   Got ${markets.length} markets (total: ${allMarkets.length})`);

      if (!data.next_cursor) {
        console.log('   No more pages available');
        break;
      }

      cursor = data.next_cursor;
      page++;

      // Small delay to be respectful to API
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`   Error: ${error.message}`);
      break;
    }
  }

  console.log(`\n✅ Total markets fetched: ${allMarkets.length}\n`);

  return allMarkets;
}

async function analyzeMarkets(markets) {
  console.log('='.repeat(70));
  console.log('MARKET ANALYSIS');
  console.log('='.repeat(70) + '\n');

  // Filter strategies
  const notClosed = markets.filter(m => m.closed === false);
  const notArchived = markets.filter(m => m.archived === false);
  const accepting = markets.filter(m => m.accepting_orders === true);
  const notClosedNotArchived = markets.filter(m => m.closed === false && m.archived === false);

  // Date filters - only recent/future markets
  const now = new Date();
  const futureMarkets = markets.filter(m => {
    if (!m.end_date_iso) return true; // Include if no end date
    return new Date(m.end_date_iso) > now;
  });

  const notClosedFuture = notClosed.filter(m => {
    if (!m.end_date_iso) return true;
    return new Date(m.end_date_iso) > now;
  });

  console.log('📊 Overall Statistics:');
  console.log(`   Total markets: ${markets.length}`);
  console.log(`   Not closed: ${notClosed.length}`);
  console.log(`   Not archived: ${notArchived.length}`);
  console.log(`   Accepting orders: ${accepting.length}`);
  console.log(`   Not closed AND not archived: ${notClosedNotArchived.length}`);
  console.log(`   Future end date: ${futureMarkets.length}`);
  console.log(`   Not closed + future: ${notClosedFuture.length}`);

  // Category breakdown
  const categories = {};
  markets.forEach(m => {
    const cat = m.category || 'Unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  console.log(`\n📂 Top Categories:`);
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} markets`);
    });

  // Sports/NFL analysis
  const sportsKeywords = ['nfl', 'football', 'super bowl', 'nba', 'mlb', 'nhl'];
  const sportsMarkets = markets.filter(m => {
    const title = (m.question || m.title || '').toLowerCase();
    return sportsKeywords.some(keyword => title.includes(keyword));
  });

  const notClosedSports = sportsMarkets.filter(m => m.closed === false);

  console.log(`\n🏈 Sports Markets:`);
  console.log(`   Total sports markets: ${sportsMarkets.length}`);
  console.log(`   Not closed sports: ${notClosedSports.length}`);

  if (notClosedSports.length > 0) {
    console.log(`\n   Sample not-closed sports markets:`);
    notClosedSports.slice(0, 10).forEach((m, i) => {
      console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
      console.log(`      End: ${m.end_date_iso || 'N/A'}, Accepting: ${m.accepting_orders}`);
    });
  }

  // Recommendation
  console.log(`\n\n💡 RECOMMENDATION:`);
  console.log(`   Best filter: closed=false (${notClosed.length} markets across all pages)`);
  console.log(`   Even better: closed=false + future end date (${notClosedFuture.length} markets)`);

  return {
    total: markets.length,
    notClosed: notClosed.length,
    notClosedFuture: notClosedFuture.length,
    notClosedSports: notClosedSports.length,
  };
}

async function main() {
  const markets = await fetchAllMarkets();
  const stats = await analyzeMarkets(markets);

  console.log(`\n\n${'='.repeat(70)}`);
  console.log('🎯 FINAL RECOMMENDATION FOR YOUR APP');
  console.log('='.repeat(70));
  console.log(`\n1. Fetch multiple pages using next_cursor (get ${stats.total}+ markets)`);
  console.log(`2. Filter for closed=false (gets you ${stats.notClosed} markets)`);
  console.log(`3. Optionally filter for future end dates (gets you ${stats.notClosedFuture} markets)`);
  console.log(`4. This will give you MUCH more than the current 1-13 markets!`);
}

main();
