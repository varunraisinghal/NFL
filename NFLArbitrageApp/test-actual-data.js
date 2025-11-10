// Debug actual API responses to see data structure
// Run with: node test-actual-data.js

console.log('🔍 DEBUGGING ACTUAL API DATA\n');

async function debugPolymarket() {
  console.log('='.repeat(70));
  console.log('POLYMARKET GAMMA API - Actual Data Structure');
  console.log('='.repeat(70) + '\n');

  const url = 'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=5';

  try {
    const response = await fetch(url);
    const markets = await response.json();

    console.log(`Got ${markets.length} markets\n`);

    // Show full structure of first 2 markets
    markets.slice(0, 2).forEach((market, i) => {
      console.log(`\nMarket ${i + 1}:`);
      console.log(JSON.stringify(market, null, 2));
      console.log('\n' + '-'.repeat(70));
    });

    // Specifically check outcomePrices format
    console.log('\n📊 OUTCOME PRICES ANALYSIS:\n');
    markets.slice(0, 5).forEach((market, i) => {
      console.log(`${i + 1}. ${market.question}`);
      console.log(`   outcomePrices type: ${typeof market.outcomePrices}`);
      console.log(`   outcomePrices value: ${JSON.stringify(market.outcomePrices)}`);
      console.log(`   Is array: ${Array.isArray(market.outcomePrices)}`);

      if (typeof market.outcomePrices === 'string') {
        const parsed = market.outcomePrices.split(',').map(p => parseFloat(p.trim()));
        console.log(`   Parsed: ${JSON.stringify(parsed)}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

async function debugKalshi() {
  console.log('\n\n' + '='.repeat(70));
  console.log('KALSHI API - Actual Data Structure');
  console.log('='.repeat(70) + '\n');

  const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=10';

  try {
    const response = await fetch(url);
    const data = await response.json();
    const markets = data.markets || [];

    console.log(`Got ${markets.length} markets\n`);

    // Show full structure of first 2 markets
    markets.slice(0, 2).forEach((market, i) => {
      console.log(`\nMarket ${i + 1}:`);
      console.log(JSON.stringify(market, null, 2));
      console.log('\n' + '-'.repeat(70));
    });

    // Price analysis
    console.log('\n📊 PRICE FIELDS ANALYSIS:\n');
    markets.slice(0, 10).forEach((market, i) => {
      console.log(`${i + 1}. ${market.ticker || market.title}`);
      console.log(`   yes_bid: ${market.yes_bid}, yes_ask: ${market.yes_ask}`);
      console.log(`   no_bid: ${market.no_bid}, no_ask: ${market.no_ask}`);
      console.log(`   last_price: ${market.last_price}`);
      console.log(`   market_type: ${market.market_type}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {
  await debugPolymarket();
  await debugKalshi();
}

main();
