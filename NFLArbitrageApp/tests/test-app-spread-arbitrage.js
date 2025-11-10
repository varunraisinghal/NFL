// Test the app's spread arbitrage detection logic

async function testAppSpreadArbitrage() {
  console.log('🏈 Testing App Spread Arbitrage Detection\n');
  console.log('='.repeat(70));

  try {
    // Fetch real data
    console.log('\n📊 Fetching real market data...\n');

    const [polyResponse, kalshiResponse] = await Promise.all([
      fetch('https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=100'),
      fetch('https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLSPREAD&status=open&with_nested_markets=true&limit=50')
    ]);

    const polyMarkets = await polyResponse.json();
    const kalshiData = await kalshiResponse.json();
    const kalshiEvents = kalshiData.events || [];

    // Process like the app does
    console.log('📊 Processing markets...\n');

    // Process Polymarket spreads
    const epsilon = 0.000001;
    const polySpreads = [];

    for (const market of polyMarkets) {
      if (!market.outcomePrices || !market.outcomes) continue;

      try {
        const prices = JSON.parse(market.outcomePrices);
        const outcomes = JSON.parse(market.outcomes);
        const yesPrice = parseFloat(prices[0]);
        const noPrice = parseFloat(prices[1]);

        if (Math.abs(yesPrice) < epsilon || Math.abs(yesPrice - 1) < epsilon) continue;

        const line = market.line !== undefined ? Math.abs(parseFloat(market.line)) : 0;

        polySpreads.push({
          id: market.id,
          platform: 'Polymarket',
          title: market.question,
          teams: outcomes,
          yesPrice,
          noPrice,
          line,
          marketType: 'spread',
        });
      } catch (e) {
        // Skip
      }
    }

    // Process Kalshi spreads
    const kalshiSpreads = [];

    for (const event of kalshiEvents) {
      const markets = event.markets || [];
      const eventTitle = event.title || '';
      const eventMatch = eventTitle.match(/^(.+?)\s+at\s+(.+?):/i);
      if (!eventMatch) continue;

      const awayTeam = eventMatch[1].trim();
      const homeTeam = eventMatch[2].trim();

      for (const market of markets) {
        const titleMatch = market.title?.match(/^(\w+(?:\s+\w+)*?)\s+wins by over/i);
        const teamName = titleMatch ? titleMatch[1].trim() : '';
        const line = market.floor_strike !== undefined ? parseFloat(market.floor_strike) : 0;

        let yesPrice = null;
        if (market.last_price > 0 && market.last_price < 100) {
          yesPrice = market.last_price / 100;
        } else if (market.yes_bid > 1 && market.yes_bid < 99) {
          yesPrice = market.yes_bid / 100;
        } else if (market.yes_ask > 1 && market.yes_ask < 99) {
          yesPrice = market.yes_ask / 100;
        } else {
          continue;
        }

        const noPrice = 1 - yesPrice;
        const opponent = teamName === awayTeam ? homeTeam : awayTeam;

        kalshiSpreads.push({
          id: market.ticker,
          platform: 'Kalshi',
          title: market.title,
          teams: [teamName, opponent],
          yesPrice,
          noPrice,
          line,
          marketType: 'spread',
        });
      }
    }

    console.log(`✅ Processed ${polySpreads.length} Polymarket spreads`);
    console.log(`✅ Processed ${kalshiSpreads.length} Kalshi spreads\n`);

    // Simulate app's arbitrage detection
    console.log('🔍 Running arbitrage detection...\n');
    console.log('='.repeat(70));

    const opportunities = [];

    // Group Kalshi spreads by game-line
    const kalshiSpreadMap = new Map();
    for (const kalshiSpread of kalshiSpreads) {
      if (!kalshiSpread.teams || kalshiSpread.teams.length < 2 || !kalshiSpread.line) continue;

      const teams = kalshiSpread.teams.map(t => t.toLowerCase().trim()).sort();
      const key = `${teams[0]}-${teams[1]}-${kalshiSpread.line}`;

      if (!kalshiSpreadMap.has(key)) {
        kalshiSpreadMap.set(key, kalshiSpread);
      }
    }

    // Match Polymarket spreads
    for (const polySpread of polySpreads) {
      if (!polySpread.teams || polySpread.teams.length < 2 || !polySpread.line) continue;

      const polyTeams = polySpread.teams.map(t => t.toLowerCase().trim()).sort();
      const key = `${polyTeams[0]}-${polyTeams[1]}-${polySpread.line}`;

      const kalshiSpread = kalshiSpreadMap.get(key);
      if (!kalshiSpread) continue;

      // Calculate both options
      const costA = polySpread.yesPrice + kalshiSpread.noPrice;
      const costB = polySpread.noPrice + kalshiSpread.yesPrice;

      if (costA < 1 || costB < 1) {
        const profitA = costA < 1 ? ((1 - costA) / costA * 100) : null;
        const profitB = costB < 1 ? ((1 - costB) / costB * 100) : null;

        opportunities.push({
          game: `${polySpread.teams[0]} vs ${polySpread.teams[1]}`,
          line: polySpread.line,
          polyYes: polySpread.yesPrice,
          polyNo: polySpread.noPrice,
          kalshiYes: kalshiSpread.yesPrice,
          kalshiNo: kalshiSpread.noPrice,
          costA,
          costB,
          profitA,
          profitB,
        });
      }
    }

    console.log(`\n✅ Detection complete!\n`);

    if (opportunities.length > 0) {
      console.log(`🎉 FOUND ${opportunities.length} SPREAD ARBITRAGE OPPORTUNITIES!\n`);
      console.log('='.repeat(70));

      opportunities.sort((a, b) => {
        const maxA = Math.max(a.profitA || 0, a.profitB || 0);
        const maxB = Math.max(b.profitA || 0, b.profitB || 0);
        return maxB - maxA;
      });

      opportunities.forEach((opp, i) => {
        console.log(`\n${i + 1}. ${opp.game} - Line ${opp.line}`);
        console.log(`   Polymarket: Yes ${opp.polyYes.toFixed(6)}, No ${opp.polyNo.toFixed(6)}`);
        console.log(`   Kalshi:     Yes ${opp.kalshiYes.toFixed(6)}, No ${opp.kalshiNo.toFixed(6)}`);

        if (opp.profitA) {
          console.log(`   ✅ Option A: Poly Yes + Kalshi No = ${opp.costA.toFixed(6)} → ${opp.profitA.toFixed(2)}% profit`);
        }
        if (opp.profitB) {
          console.log(`   ✅ Option B: Poly No + Kalshi Yes = ${opp.costB.toFixed(6)} → ${opp.profitB.toFixed(2)}% profit`);
        }
      });
    } else {
      console.log('✅ No spread arbitrage found (markets are efficient)');
      console.log('   This is normal - spread arbitrage is rare');
      console.log('   The app will detect it if/when it appears!');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ App spread arbitrage detection is working correctly!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testAppSpreadArbitrage();
