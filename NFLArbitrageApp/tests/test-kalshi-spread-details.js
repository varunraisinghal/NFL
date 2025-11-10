// Get detailed structure of Kalshi spread and total markets

async function getSpreadTotalDetails() {
  console.log('🏈 Kalshi Spread & Total Market Details\n');
  console.log('='.repeat(60));

  try {
    // Test SPREADS
    console.log('\n📊 SPREAD MARKETS (KXNFLSPREAD):\n');
    console.log('='.repeat(60));

    const spreadUrl = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLSPREAD&status=open&with_nested_markets=true&limit=5';
    const spreadResponse = await fetch(spreadUrl);
    const spreadData = await spreadResponse.json();
    const spreadEvents = spreadData.events || [];

    console.log(`✅ Found ${spreadEvents.length} spread events\n`);

    if (spreadEvents.length > 0) {
      spreadEvents.slice(0, 2).forEach((event, i) => {
        console.log(`Event ${i + 1}: ${event.title}`);
        console.log(`   Event ticker: ${event.event_ticker}`);
        console.log(`   Markets: ${event.markets?.length || 0}`);

        if (event.markets && event.markets.length > 0) {
          event.markets.forEach((market, j) => {
            console.log(`\n   Market ${j + 1}:`);
            console.log(`      Ticker: ${market.ticker}`);
            console.log(`      Title: ${market.title}`);
            console.log(`      Subtitle: ${market.subtitle || 'N/A'}`);
            console.log(`      Strike: ${market.strike}`);
            console.log(`      Floor strike: ${market.floor_strike}`);
            console.log(`      Cap strike: ${market.cap_strike}`);
            console.log(`      Yes bid: ${market.yes_bid}`);
            console.log(`      Yes ask: ${market.yes_ask}`);
            console.log(`      Last price: ${market.last_price}`);
          });
        }
        console.log('');
      });
    }

    // Test TOTALS
    console.log('\n📊 TOTAL MARKETS (KXNFLTOTAL):\n');
    console.log('='.repeat(60));

    const totalUrl = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLTOTAL&status=open&with_nested_markets=true&limit=5';
    const totalResponse = await fetch(totalUrl);
    const totalData = await totalResponse.json();
    const totalEvents = totalData.events || [];

    console.log(`✅ Found ${totalEvents.length} total events\n`);

    if (totalEvents.length > 0) {
      totalEvents.slice(0, 2).forEach((event, i) => {
        console.log(`Event ${i + 1}: ${event.title}`);
        console.log(`   Event ticker: ${event.event_ticker}`);
        console.log(`   Markets: ${event.markets?.length || 0}`);

        if (event.markets && event.markets.length > 0) {
          event.markets.forEach((market, j) => {
            console.log(`\n   Market ${j + 1}:`);
            console.log(`      Ticker: ${market.ticker}`);
            console.log(`      Title: ${market.title}`);
            console.log(`      Subtitle: ${market.subtitle || 'N/A'}`);
            console.log(`      Strike: ${market.strike}`);
            console.log(`      Floor strike: ${market.floor_strike}`);
            console.log(`      Cap strike: ${market.cap_strike}`);
            console.log(`      Yes bid: ${market.yes_bid}`);
            console.log(`      Yes ask: ${market.yes_ask}`);
            console.log(`      Last price: ${market.last_price}`);
          });
        }
        console.log('');
      });
    }

    console.log('='.repeat(60));
    console.log('✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getSpreadTotalDetails();
