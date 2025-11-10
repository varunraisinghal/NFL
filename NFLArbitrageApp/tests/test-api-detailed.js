// Detailed API test to verify fixes
// Run with: node test-api-detailed.js

console.log('🧪 DETAILED API DEBUG TEST\n');
console.log('This test will show you exactly what markets are being returned\n');

async function testPolymarketDetailed() {
  console.log('='.repeat(70));
  console.log('📊 POLYMARKET DETAILED TEST');
  console.log('='.repeat(70));

  const url = 'https://clob.polymarket.com/markets?active=true&closed=false&limit=1000';

  try {
    const response = await fetch(url);
    const data = await response.json();

    const marketArray = data.data || data.markets || data;

    console.log(`\n✅ Total markets in response: ${marketArray.length}`);

    // Analyze markets
    let closedCount = 0;
    let archivedCount = 0;
    let oldMarketsCount = 0;
    let notAcceptingOrdersCount = 0;
    let activeMarkets = [];

    for (const market of marketArray) {
      if (market.closed === true) closedCount++;
      if (market.archived === true) archivedCount++;
      if (market.accepting_orders === false) notAcceptingOrdersCount++;
      if (market.end_date_iso && new Date(market.end_date_iso) < new Date('2025-01-01')) {
        oldMarketsCount++;
      }

      // Check if this would pass our filters
      const isActive = market.closed !== true &&
                      market.archived !== true &&
                      market.resolved !== true &&
                      market.status !== 'closed' &&
                      market.accepting_orders !== false &&
                      (!market.end_date_iso || new Date(market.end_date_iso) >= new Date('2025-01-01'));

      if (isActive) {
        activeMarkets.push({
          question: market.question,
          end_date: market.end_date_iso,
          accepting_orders: market.accepting_orders,
          active: market.active,
          closed: market.closed,
        });
      }
    }

    console.log(`\n📉 Filtered out:`);
    console.log(`   - Closed markets: ${closedCount}`);
    console.log(`   - Archived markets: ${archivedCount}`);
    console.log(`   - Not accepting orders: ${notAcceptingOrdersCount}`);
    console.log(`   - Old markets (pre-2025): ${oldMarketsCount}`);

    console.log(`\n✅ Active markets after filtering: ${activeMarkets.length}`);

    if (activeMarkets.length > 0) {
      console.log(`\n📋 Sample active markets (first 5):`);
      activeMarkets.slice(0, 5).forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.question}`);
        console.log(`      End Date: ${m.end_date}`);
        console.log(`      Accepting Orders: ${m.accepting_orders}`);
      });
    } else {
      console.log('\n⚠️ WARNING: No active markets found!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');
}

async function testKalshiDetailed() {
  console.log('='.repeat(70));
  console.log('📊 KALSHI DETAILED TEST');
  console.log('='.repeat(70));

  const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=500';

  try {
    const response = await fetch(url);
    const data = await response.json();

    const marketArray = data.markets || data;

    console.log(`\n✅ Total markets in response: ${marketArray.length}`);

    // Analyze price fields
    let noPriceCount = 0;
    let validPriceCount = 0;
    let marketsWithPrices = [];
    let marketsWithoutPrices = [];

    for (const market of marketArray) {
      const hasYesBid = market.yes_bid !== undefined && market.yes_bid !== null && market.yes_bid > 0;
      const hasYesAsk = market.yes_ask !== undefined && market.yes_ask !== null && market.yes_ask > 0 && market.yes_ask < 100;
      const hasLastPrice = market.last_price !== undefined && market.last_price !== null && market.last_price > 0;
      const hasNoBid = market.no_bid !== undefined && market.no_bid !== null && market.no_bid > 0;
      const hasNoAsk = market.no_ask !== undefined && market.no_ask !== null && market.no_ask > 0 && market.no_ask < 100;

      const hasValidPrice = hasYesBid || hasYesAsk || hasLastPrice || hasNoBid || hasNoAsk;

      if (hasValidPrice && !(market.yes_ask === 0 || market.no_ask === 100)) {
        validPriceCount++;
        if (marketsWithPrices.length < 5) {
          marketsWithPrices.push({
            title: market.title,
            ticker: market.ticker,
            yes_bid: market.yes_bid,
            yes_ask: market.yes_ask,
            no_bid: market.no_bid,
            no_ask: market.no_ask,
            last_price: market.last_price,
          });
        }
      } else {
        noPriceCount++;
        if (marketsWithoutPrices.length < 3) {
          marketsWithoutPrices.push({
            title: market.title,
            ticker: market.ticker,
            yes_bid: market.yes_bid,
            yes_ask: market.yes_ask,
            no_bid: market.no_bid,
            no_ask: market.no_ask,
            last_price: market.last_price,
          });
        }
      }
    }

    console.log(`\n📊 Price Analysis:`);
    console.log(`   - Markets with valid prices: ${validPriceCount}`);
    console.log(`   - Markets without valid prices: ${noPriceCount}`);

    if (marketsWithPrices.length > 0) {
      console.log(`\n✅ Sample markets WITH prices:`);
      marketsWithPrices.forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.title || m.ticker}`);
        console.log(`      yes_bid: ${m.yes_bid}, yes_ask: ${m.yes_ask}`);
        console.log(`      no_bid: ${m.no_bid}, no_ask: ${m.no_ask}`);
        console.log(`      last_price: ${m.last_price}`);
      });
    }

    if (marketsWithoutPrices.length > 0) {
      console.log(`\n❌ Sample markets WITHOUT prices (will be filtered):`);
      marketsWithoutPrices.forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.title || m.ticker}`);
        console.log(`      yes_bid: ${m.yes_bid}, yes_ask: ${m.yes_ask}`);
        console.log(`      no_bid: ${m.no_bid}, no_ask: ${m.no_ask}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');
}

async function main() {
  await testPolymarketDetailed();
  await testKalshiDetailed();

  console.log('='.repeat(70));
  console.log('✅ DETAILED TEST COMPLETE');
  console.log('='.repeat(70));
  console.log('\nNow your APIs should return only active markets with valid prices!');
}

main();
