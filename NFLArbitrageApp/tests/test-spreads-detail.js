// Get detailed spread market structure

async function testSpreadDetails() {
  console.log('🏈 Fetching NFL Spread Markets Detail\n');
  console.log('='.repeat(60));

  try {
    const url = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&limit=20';

    console.log(`URL: ${url}\n`);

    const response = await fetch(url);
    const markets = await response.json();

    console.log(`✅ Found ${markets.length} spread markets\n`);

    // Show first 5 in detail
    markets.slice(0, 5).forEach((market, i) => {
      console.log(`${i + 1}. ${market.question}`);
      console.log(`   sportsMarketType: ${market.sportsMarketType}`);
      console.log(`   line: ${market.line}`);
      console.log(`   gameId: ${market.gameId}`);
      console.log(`   teamAID: ${market.teamAID}`);
      console.log(`   teamBID: ${market.teamBID}`);
      console.log(`   outcomePrices: ${market.outcomePrices}`);

      // Parse prices
      if (market.outcomePrices) {
        try {
          const prices = JSON.parse(market.outcomePrices);
          console.log(`   Parsed prices: Yes=${prices[0]}, No=${prices[1]}`);
        } catch (e) {
          console.log(`   Price parse error`);
        }
      }

      console.log(`   outcomes: ${market.outcomes}`);
      console.log('');
    });

    // Group by gameId to see how many spreads per game
    const byGame = new Map();
    markets.forEach(market => {
      const gameId = market.gameId || 'unknown';
      if (!byGame.has(gameId)) {
        byGame.set(gameId, []);
      }
      byGame.get(gameId).push(market);
    });

    console.log('='.repeat(60));
    console.log(`\n📊 Spreads grouped by game:\n`);
    let count = 0;
    for (const [gameId, gameMarkets] of byGame) {
      if (count >= 3) break; // Show first 3 games
      console.log(`Game ID: ${gameId} (${gameMarkets.length} spread lines)`);
      gameMarkets.forEach(m => {
        console.log(`   - ${m.question} (Line: ${m.line})`);
      });
      console.log('');
      count++;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSpreadDetails();
