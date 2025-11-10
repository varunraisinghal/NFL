// Test the complete flow: Fetch spreads and display them like the app will

async function testAppSpreadsFlow() {
  console.log('🏈 Testing Complete Spreads Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Fetch spreads like MainScreen does
    console.log('\n📡 Step 1: Fetching NFL spreads from Polymarket...\n');

    const url = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=100';
    const response = await fetch(url);
    const markets = await response.json();

    console.log(`✅ Fetched ${markets.length} spread markets\n`);

    // Step 2: Filter for active markets (like processGammaSpreads does)
    console.log('🔍 Step 2: Filtering for active markets (excluding settled)...\n');

    const epsilon = 0.000001;
    const activeMarkets = markets.filter(market => {
      if (!market.outcomePrices) return false;

      try {
        const prices = JSON.parse(market.outcomePrices);
        const yesPrice = parseFloat(prices[0]);
        const noPrice = parseFloat(prices[1]);

        // Filter out settled markets
        if (Math.abs(yesPrice) < epsilon || Math.abs(yesPrice - 1) < epsilon ||
            Math.abs(noPrice) < epsilon || Math.abs(noPrice - 1) < epsilon) {
          return false;
        }

        return true;
      } catch (e) {
        return false;
      }
    });

    console.log(`✅ ${activeMarkets.length} active spread markets\n`);

    // Step 3: Group by game (like groupSpreadsByGame does)
    console.log('📊 Step 3: Grouping spreads by game...\n');

    const gameMap = new Map();
    for (const market of activeMarkets) {
      if (!market.outcomes) continue;

      try {
        const outcomes = JSON.parse(market.outcomes);
        if (outcomes.length >= 2) {
          const gameKey = outcomes.slice(0, 2).sort().join('-');
          if (!gameMap.has(gameKey)) {
            gameMap.set(gameKey, []);
          }
          gameMap.get(gameKey).push(market);
        }
      } catch (e) {
        // Skip
      }
    }

    console.log(`✅ Grouped into ${gameMap.size} games\n`);

    // Step 4: Display like the app will
    console.log('🎯 Step 4: Display format (like MarketListScreen):\n');
    console.log('='.repeat(60));

    let gameCount = 0;
    for (const [gameKey, spreads] of gameMap) {
      if (gameCount >= 5) break; // Show first 5 games

      const firstSpread = spreads[0];
      const outcomes = JSON.parse(firstSpread.outcomes);
      const favorite = outcomes[0];
      const underdog = outcomes[1];

      console.log(`\n📍 GAME: ${favorite} vs ${underdog}`);
      console.log('-'.repeat(60));

      for (const spread of spreads) {
        const prices = JSON.parse(spread.outcomePrices);
        const yesPrice = parseFloat(prices[0]);
        const noPrice = parseFloat(prices[1]);
        const line = Math.abs(parseFloat(spread.line));

        console.log(`\n   Line ${line}:`);
        console.log(`      ${favorite} -${line} @ ${yesPrice.toFixed(6)} (Yes)`);
        console.log(`      ${underdog} +${line} @ ${noPrice.toFixed(6)} (No)`);
      }

      console.log('');
      gameCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Spreads are ready for the app!');
    console.log(`   Total: ${activeMarkets.length} spread markets across ${gameMap.size} games\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAppSpreadsFlow();
