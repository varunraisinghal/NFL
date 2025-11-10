// Test the complete Kalshi spreads flow like the app will use it

async function testKalshiSpreadsFlow() {
  console.log('🏈 Testing Complete Kalshi Spreads Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Fetch spreads like MainScreen does
    console.log('\n📡 Step 1: Fetching NFL spreads from Kalshi...\n');

    const url = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLSPREAD&status=open&with_nested_markets=true&limit=10';
    const response = await fetch(url);
    const data = await response.json();
    const events = data.events || [];

    console.log(`✅ Fetched ${events.length} spread events\n`);

    // Step 2: Process and count markets
    console.log('🔍 Step 2: Processing spread markets...\n');

    let totalMarkets = 0;
    const gameMap = new Map();

    for (const event of events) {
      const markets = event.markets || [];
      totalMarkets += markets.length;

      // Group by game
      const eventTitle = event.title || '';
      const eventMatch = eventTitle.match(/^(.+?)\s+at\s+(.+?):/i);
      if (eventMatch) {
        const awayTeam = eventMatch[1].trim();
        const homeTeam = eventMatch[2].trim();
        const gameKey = `${awayTeam} at ${homeTeam}`;

        if (!gameMap.has(gameKey)) {
          gameMap.set(gameKey, {
            awayTeam,
            homeTeam,
            markets: []
          });
        }

        // Process each market
        for (const market of markets) {
          // Extract team from title
          const titleMatch = market.title?.match(/^(\w+(?:\s+\w+)*?)\s+wins by over/i);
          const teamName = titleMatch ? titleMatch[1] : '';

          // Extract line
          const line = market.floor_strike !== undefined ? parseFloat(market.floor_strike) : 0;

          // Extract price
          let yesPrice = 0.5;
          let hasValidPrice = false;

          if (market.last_price !== undefined && market.last_price > 0 && market.last_price < 100) {
            yesPrice = market.last_price / 100;
            hasValidPrice = true;
          } else if (market.yes_bid !== undefined && market.yes_bid > 1 && market.yes_bid < 99) {
            yesPrice = market.yes_bid / 100;
            hasValidPrice = true;
          } else if (market.yes_ask !== undefined && market.yes_ask > 1 && market.yes_ask < 99) {
            yesPrice = market.yes_ask / 100;
            hasValidPrice = true;
          }

          if (hasValidPrice) {
            const noPrice = 1 - yesPrice;
            gameMap.get(gameKey).markets.push({
              team: teamName,
              line,
              yesPrice,
              noPrice
            });
          }
        }
      }
    }

    console.log(`✅ Processed ${totalMarkets} total spread markets`);
    console.log(`✅ Grouped into ${gameMap.size} games\n`);

    // Step 3: Display like the app will
    console.log('🎯 Step 3: Display format (like MarketListScreen):\n');
    console.log('='.repeat(60));

    let gameCount = 0;
    for (const [gameKey, gameData] of gameMap) {
      if (gameCount >= 3) break; // Show first 3 games

      console.log(`\n📍 GAME: ${gameKey}`);
      console.log('-'.repeat(60));

      // Group markets by line
      const lineMap = new Map();
      for (const market of gameData.markets) {
        const key = `${market.line}`;
        if (!lineMap.has(key)) {
          lineMap.set(key, []);
        }
        lineMap.get(key).push(market);
      }

      // Display each line with both team sides
      const sortedLines = Array.from(lineMap.entries()).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

      for (const [line, markets] of sortedLines) {
        console.log(`\n   Line ${line}:`);
        for (const market of markets) {
          console.log(`      ${market.team} -${market.line} @ ${market.yesPrice.toFixed(6)} (Yes)`);
          // Calculate the other side (opponent)
          const opponent = market.team === gameData.awayTeam ? gameData.homeTeam : gameData.awayTeam;
          console.log(`      ${opponent} +${market.line} @ ${market.noPrice.toFixed(6)} (No)`);
        }
      }

      console.log('');
      gameCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Kalshi spreads are ready for the app!');
    console.log(`   Total: ${totalMarkets} spread markets across ${gameMap.size} games\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testKalshiSpreadsFlow();
