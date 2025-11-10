// Test the updated API implementations
// Run with: node test-updated-apis.js

console.log('🏈 TESTING UPDATED NFL MONEYLINE APIs\n');

// Test Polymarket
async function testPolymarket() {
  console.log('='.repeat(70));
  console.log('POLYMARKET - NFL Moneylines');
  console.log('='.repeat(70) + '\n');

  try {
    const url = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=moneyline&active=true&closed=false&limit=100';

    const response = await fetch(url);
    const markets = await response.json();

    console.log(`✅ Found ${markets.length} NFL moneyline markets\n`);

    if (markets.length > 0) {
      console.log('Sample markets:\n');
      markets.slice(0, 5).forEach((m, i) => {
        const prices = JSON.parse(m.outcomePrices || '["0.5", "0.5"]');
        console.log(`${i + 1}. ${m.question || m.title}`);
        console.log(`   Yes: ${(parseFloat(prices[0]) * 100).toFixed(1)}%`);
        console.log(`   No:  ${(parseFloat(prices[1]) * 100).toFixed(1)}%`);
        console.log(`   Slug: ${m.slug}`);
        console.log('');
      });
    }

    return markets;
  } catch (error) {
    console.error('❌ Polymarket error:', error.message);
    return [];
  }
}

// Test Kalshi
async function testKalshi() {
  console.log('\n' + '='.repeat(70));
  console.log('KALSHI - NFL Game Events');
  console.log('='.repeat(70) + '\n');

  try {
    const url = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLGAME&status=open&with_nested_markets=true&limit=100';

    const response = await fetch(url);
    const data = await response.json();
    const events = data.events || [];

    console.log(`✅ Found ${events.length} NFL game events\n`);

    let totalMarkets = 0;
    events.slice(0, 5).forEach((e, i) => {
      const markets = e.markets || [];
      totalMarkets += markets.length;

      console.log(`${i + 1}. ${e.title}`);
      console.log(`   Event Ticker: ${e.event_ticker}`);
      console.log(`   Markets: ${markets.length}\n`);

      markets.forEach((m, j) => {
        const price = m.yes_bid || m.last_price || 0;
        console.log(`      ${j + 1}. ${m.ticker}`);
        console.log(`         ${m.title}`);
        console.log(`         Price: ${price}¢ (${(price / 100 * 100).toFixed(1)}%)`);
      });
      console.log('');
    });

    console.log(`Total markets across all events: ${totalMarkets}`);

    return events;
  } catch (error) {
    console.error('❌ Kalshi error:', error.message);
    return [];
  }
}

// Compare structures
async function compareStructures(polyMarkets, kalshiEvents) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 STRUCTURE COMPARISON');
  console.log('='.repeat(70) + '\n');

  console.log('POLYMARKET Structure:');
  console.log('  - Markets per game: 1');
  console.log('  - Format: "Team A vs. Team B"');
  console.log('  - Yes = Team A wins');
  console.log('  - No = Team B wins');
  console.log('  - Price format: Decimal (0.275 = 27.5%)\n');

  console.log('KALSHI Structure:');
  console.log('  - Markets per game: 2');
  console.log('  - Format: "Team A at Team B Winner?" (separate for each team)');
  console.log('  - Each team gets its own market');
  console.log('  - Price format: Cents (62¢ = 62%)\n');

  console.log('For arbitrage detection:');
  console.log('  1. Match games by team names');
  console.log('  2. Polymarket "Yes" price → Team A probability');
  console.log('  3. Kalshi Team A market → Team A probability');
  console.log('  4. Compare and find discrepancies\n');
}

// Main execution
async function main() {
  const polyMarkets = await testPolymarket();
  const kalshiEvents = await testKalshi();
  await compareStructures(polyMarkets, kalshiEvents);

  console.log('\n' + '='.repeat(70));
  console.log('✅ API TEST COMPLETE');
  console.log('='.repeat(70));

  if (polyMarkets.length > 0 && kalshiEvents.length > 0) {
    console.log('\n✅ Both APIs working correctly!');
    console.log(`   Polymarket: ${polyMarkets.length} moneylines`);
    console.log(`   Kalshi: ${kalshiEvents.length} game events`);
    console.log('\nReady to integrate into the app!\n');
  } else {
    console.log('\n⚠️ One or both APIs returned no data');
    console.log('   Check API endpoints and parameters\n');
  }
}

main();
