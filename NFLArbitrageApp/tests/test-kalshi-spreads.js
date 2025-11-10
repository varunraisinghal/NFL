// Test Kalshi API to find spread and total markets structure

async function testKalshiMarketStructure() {
  console.log('🏈 Testing Kalshi NFL Market Structure\n');
  console.log('='.repeat(60));

  try {
    const url = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLGAME&status=open&with_nested_markets=true&limit=5';

    console.log(`\n📡 Fetching: ${url}\n`);

    const response = await fetch(url);
    const data = await response.json();
    const events = data.events || [];

    console.log(`✅ Found ${events.length} events\n`);

    if (events.length > 0) {
      const event = events[0];
      console.log('📊 Sample Event Structure:\n');
      console.log(`   Title: ${event.title}`);
      console.log(`   Subtitle: ${event.subtitle}`);
      console.log(`   Markets: ${event.markets?.length || 0}\n`);

      if (event.markets && event.markets.length > 0) {
        console.log('🔍 Analyzing Market Types:\n');
        console.log('='.repeat(60));

        const marketsByType = {
          moneyline: [],
          spread: [],
          total: [],
          other: []
        };

        for (const market of event.markets) {
          const title = (market.title || '').toLowerCase();
          const subtitle = (market.subtitle || '').toLowerCase();
          const combined = `${title} ${subtitle}`;

          // Classify market type
          if (combined.includes('total points') || combined.includes('over') || combined.includes('under')) {
            marketsByType.total.push(market);
          } else if (combined.includes('by more than') || combined.includes('by over') || combined.includes('wins by')) {
            marketsByType.spread.push(market);
          } else if (combined.includes('winner') || combined.includes('win')) {
            marketsByType.moneyline.push(market);
          } else {
            marketsByType.other.push(market);
          }
        }

        console.log(`\n📈 Market Breakdown:`);
        console.log(`   Moneyline: ${marketsByType.moneyline.length}`);
        console.log(`   Spread: ${marketsByType.spread.length}`);
        console.log(`   Total: ${marketsByType.total.length}`);
        console.log(`   Other: ${marketsByType.other.length}`);

        // Show spread examples
        if (marketsByType.spread.length > 0) {
          console.log(`\n🎯 Sample SPREAD Markets:\n`);
          marketsByType.spread.slice(0, 3).forEach((market, i) => {
            console.log(`   ${i + 1}. ${market.ticker}`);
            console.log(`      Title: ${market.title}`);
            console.log(`      Subtitle: ${market.subtitle}`);
            console.log(`      Yes Price: ${market.yes_bid || market.last_price || 'N/A'}`);
            console.log(`      No Price: ${market.no_bid || 'N/A'}`);
            console.log('');
          });
        }

        // Show total examples
        if (marketsByType.total.length > 0) {
          console.log(`🎯 Sample TOTAL Markets:\n`);
          marketsByType.total.slice(0, 3).forEach((market, i) => {
            console.log(`   ${i + 1}. ${market.ticker}`);
            console.log(`      Title: ${market.title}`);
            console.log(`      Subtitle: ${market.subtitle}`);
            console.log(`      Yes Price: ${market.yes_bid || market.last_price || 'N/A'}`);
            console.log(`      No Price: ${market.no_bid || 'N/A'}`);
            console.log('');
          });
        }

        // Show moneyline examples
        if (marketsByType.moneyline.length > 0) {
          console.log(`🎯 Sample MONEYLINE Markets:\n`);
          marketsByType.moneyline.slice(0, 2).forEach((market, i) => {
            console.log(`   ${i + 1}. ${market.ticker}`);
            console.log(`      Title: ${market.title}`);
            console.log(`      Subtitle: ${market.subtitle}`);
            console.log(`      Yes Price: ${market.yes_bid || market.last_price || 'N/A'}`);
            console.log('');
          });
        }
      }
    }

    console.log('='.repeat(60));
    console.log('✅ Structure analysis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testKalshiMarketStructure();
