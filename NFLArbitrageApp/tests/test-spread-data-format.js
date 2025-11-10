// Investigate actual spread data format from APIs

async function inspectSpreadData() {
  console.log('🔍 Inspecting Spread Data Format\n');
  console.log('='.repeat(70));

  try {
    // Fetch Polymarket spreads
    console.log('\n📊 POLYMARKET SPREADS:\n');
    const polyUrl = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=5';
    const polyResponse = await fetch(polyUrl);
    const polyMarkets = await polyResponse.json();

    // Show first 3 markets in detail
    for (let i = 0; i < Math.min(3, polyMarkets.length); i++) {
      const market = polyMarkets[i];
      console.log(`\nMarket ${i + 1}:`);
      console.log(`  Question: "${market.question}"`);
      console.log(`  Line: ${market.line}`);

      const outcomes = JSON.parse(market.outcomes);
      const prices = JSON.parse(market.outcomePrices);

      console.log(`  Outcomes: ${JSON.stringify(outcomes)}`);
      console.log(`  Prices: ${JSON.stringify(prices)}`);
      console.log(`  `);
      console.log(`  Interpretation:`);
      console.log(`    Outcome 0: "${outcomes[0]}" = Yes @ ${prices[0]}`);
      console.log(`    Outcome 1: "${outcomes[1]}" = No @ ${prices[1]}`);
      console.log(`  `);
      console.log(`  Question structure: ${market.question}`);

      // Try to understand what Yes/No means
      if (market.question.includes('cover') || market.question.includes('-')) {
        console.log(`  ✓ Question indicates spread bet`);
      }
    }

    // Fetch Kalshi spreads
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 KALSHI SPREADS:\n');
    const kalshiUrl = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLSPREAD&status=open&with_nested_markets=true&limit=2';
    const kalshiResponse = await fetch(kalshiUrl);
    const kalshiData = await kalshiResponse.json();
    const kalshiEvents = kalshiData.events || [];

    // Show first event in detail
    if (kalshiEvents.length > 0) {
      const event = kalshiEvents[0];
      console.log(`Event: "${event.title}"`);
      console.log(`Total markets: ${event.markets?.length || 0}\n`);

      // Show first 3 markets
      for (let i = 0; i < Math.min(3, event.markets.length); i++) {
        const market = event.markets[i];
        console.log(`\nMarket ${i + 1}:`);
        console.log(`  Title: "${market.title}"`);
        console.log(`  Ticker: ${market.ticker}`);
        console.log(`  Floor Strike: ${market.floor_strike}`);
        console.log(`  Last Price: ${market.last_price}`);
        console.log(`  `);
        console.log(`  Interpretation:`);
        console.log(`    Yes @ ${(market.last_price / 100).toFixed(6)} = Team wins by > ${market.floor_strike}`);
        console.log(`    No @ ${((100 - market.last_price) / 100).toFixed(6)} = Team wins by ≤ ${market.floor_strike}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n💡 KEY INSIGHTS:\n');
    console.log('POLYMARKET:');
    console.log('  - Question format: "Will [Team] cover -X?"');
    console.log('  - outcomes[0] = Favorite team name');
    console.log('  - outcomes[1] = Underdog team name');
    console.log('  - prices[0] = Probability favorite covers (Yes)');
    console.log('  - prices[1] = Probability underdog covers (No = underdog wins or loses by less)');
    console.log('');
    console.log('KALSHI:');
    console.log('  - Title format: "[Team] wins by over X.5 points?"');
    console.log('  - Yes = Team covers the spread');
    console.log('  - No = Team does not cover (opponent covers)');
    console.log('  - floor_strike = The spread line');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

inspectSpreadData();
