// Test to find Kalshi NFL spread/total series

async function findNFLSeries() {
  console.log('🔍 Searching for Kalshi NFL Series\n');
  console.log('='.repeat(60));

  try {
    // Try different series tickers
    const seriesToTest = [
      'KXNFLGAME',      // Current moneyline series
      'KXNFLSPREAD',    // Maybe spreads?
      'KXNFLTOTAL',     // Maybe totals?
      'KXNFL',          // Generic NFL?
      'NFLSPREAD',      // Alternative naming?
      'NFLTOTAL',       // Alternative naming?
    ];

    for (const seriesTicker of seriesToTest) {
      console.log(`\n📡 Testing: ${seriesTicker}`);

      const url = `https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=${seriesTicker}&status=open&with_nested_markets=true&limit=3`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        const events = data.events || [];

        if (events.length > 0) {
          console.log(`   ✅ Found ${events.length} events`);

          // Check first event for market types
          const firstEvent = events[0];
          const markets = firstEvent.markets || [];

          if (markets.length > 0) {
            const sampleMarket = markets[0];
            console.log(`   Sample: ${sampleMarket.title}`);
            console.log(`   Subtitle: ${sampleMarket.subtitle || 'N/A'}`);
          }
        } else {
          console.log(`   ❌ No events found`);
        }
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
      }
    }

    // Try searching for a specific event (Philadelphia at Green Bay from the screenshot)
    console.log(`\n\n🔍 Searching for specific event: Philadelphia at Green Bay\n`);
    console.log('='.repeat(60));

    const searchUrl = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLGAME&status=open&with_nested_markets=true&limit=50';
    const response = await fetch(searchUrl);
    const data = await response.json();
    const events = data.events || [];

    const phiGbEvent = events.find(e =>
      e.title?.toLowerCase().includes('philadelphia') &&
      e.title?.toLowerCase().includes('green')
    );

    if (phiGbEvent) {
      console.log(`\n✅ Found event: ${phiGbEvent.title}`);
      console.log(`   Event ticker: ${phiGbEvent.event_ticker}`);
      console.log(`   Total markets: ${phiGbEvent.markets?.length || 0}`);

      if (phiGbEvent.markets && phiGbEvent.markets.length > 0) {
        console.log(`\n📊 All markets for this event:\n`);
        phiGbEvent.markets.forEach((market, i) => {
          console.log(`   ${i + 1}. ${market.ticker}`);
          console.log(`      Title: ${market.title}`);
          console.log(`      Subtitle: ${market.subtitle || 'N/A'}`);
          console.log('');
        });
      }
    } else {
      console.log(`\n❌ Philadelphia at Green Bay event not found`);
      console.log(`\nAvailable events:`);
      events.slice(0, 5).forEach(e => {
        console.log(`   - ${e.title}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findNFLSeries();
