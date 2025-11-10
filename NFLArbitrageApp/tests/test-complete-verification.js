// Complete verification of both APIs with improvements
// Run with: node test-complete-verification.js

console.log('🎯 COMPLETE API VERIFICATION\n');
console.log('Testing both Polymarket and Kalshi with improvements\n');

async function testPolymarket() {
  console.log('='.repeat(70));
  console.log('📊 POLYMARKET - With Pagination');
  console.log('='.repeat(70) + '\n');

  const baseURL = 'https://clob.polymarket.com/markets';
  const maxPages = 3;
  let allMarkets = [];
  let cursor = null;

  for (let page = 1; page <= maxPages; page++) {
    const url = cursor ? `${baseURL}?next_cursor=${cursor}` : baseURL;
    const response = await fetch(url);
    const data = await response.json();
    const rawMarkets = data.data || [];

    // Apply filtering (same as polymarketAPI.ts)
    const filtered = rawMarkets.filter(market => {
      if (market.closed === true || market.resolved === true) return false;
      if (market.end_date_iso && new Date(market.end_date_iso) < new Date('2023-01-01')) return false;
      return true;
    });

    allMarkets.push(...filtered);
    console.log(`Page ${page}: ${filtered.length} markets (${allMarkets.length} total)`);

    if (!data.next_cursor) break;
    cursor = data.next_cursor;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n✅ Polymarket Total: ${allMarkets.length} markets\n`);
  return allMarkets.length;
}

async function testKalshi() {
  console.log('='.repeat(70));
  console.log('📊 KALSHI - With Improved Price Extraction');
  console.log('='.repeat(70) + '\n');

  const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=500';
  const response = await fetch(url);
  const data = await response.json();
  const markets = data.markets || [];

  // Apply filtering (same as kalshiAPI.ts)
  const filtered = markets.filter(market => {
    if (market.status === 'closed' || market.status === 'settled') return false;

    // Check for valid prices
    const hasLastPrice = market.last_price > 0 && market.last_price < 100;
    const hasYesBid = market.yes_bid > 1 && market.yes_bid < 99;
    const hasYesAsk = market.yes_ask > 1 && market.yes_ask < 99;

    return hasLastPrice || hasYesBid || hasYesAsk;
  });

  console.log(`Raw markets: ${markets.length}`);
  console.log(`\n✅ Kalshi Total: ${filtered.length} markets\n`);
  return filtered.length;
}

async function main() {
  const polyCount = await testPolymarket();
  const kalshiCount = await testKalshi();

  console.log('='.repeat(70));
  console.log('🎉 FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`\n📊 Total Markets Available:`);
  console.log(`   Polymarket: ${polyCount} markets`);
  console.log(`   Kalshi: ${kalshiCount} markets`);
  console.log(`   TOTAL: ${polyCount + kalshiCount} markets for arbitrage scanning!`);

  console.log(`\n📈 Improvement:`);
  console.log(`   Before: ~14 markets total (1 Poly + 13 Kalshi)`);
  console.log(`   After: ${polyCount + kalshiCount} markets total`);
  console.log(`   That's ${Math.floor((polyCount + kalshiCount) / 14)}x MORE markets!`);

  console.log(`\n✅ Your app will now have MUCH better arbitrage opportunities!`);
}

main();
