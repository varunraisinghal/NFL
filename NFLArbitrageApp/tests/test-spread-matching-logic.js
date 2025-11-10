// Understand how spread markets match between Polymarket and Kalshi

async function understandSpreadMatching() {
  console.log('🔍 Understanding Spread Market Matching\n');
  console.log('='.repeat(70));

  try {
    // Fetch one game from each platform
    console.log('\n📊 Fetching sample markets...\n');

    // Polymarket
    const polyUrl = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=100';
    const polyResponse = await fetch(polyUrl);
    const polyMarkets = await polyResponse.json();

    // Kalshi
    const kalshiUrl = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLSPREAD&status=open&with_nested_markets=true&limit=5';
    const kalshiResponse = await fetch(kalshiUrl);
    const kalshiData = await kalshiResponse.json();
    const kalshiEvents = kalshiData.events || [];

    // Find a common game (Kansas City at Denver)
    console.log('🎯 Looking for Kansas City vs Denver game...\n');

    // Polymarket spreads for this game
    const polyKCSpread = polyMarkets.find(m => {
      const outcomes = m.outcomes ? JSON.parse(m.outcomes) : [];
      return outcomes.some(o => o.toLowerCase().includes('chiefs')) &&
             outcomes.some(o => o.toLowerCase().includes('broncos'));
    });

    if (polyKCSpread) {
      const prices = JSON.parse(polyKCSpread.outcomePrices);
      const outcomes = JSON.parse(polyKCSpread.outcomes);
      const line = Math.abs(parseFloat(polyKCSpread.line));

      console.log('📊 POLYMARKET - Kansas City vs Denver:');
      console.log(`   Line: ${line}`);
      console.log(`   Question: ${polyKCSpread.question}`);
      console.log(`   Outcome 1: ${outcomes[0]} (Yes @ ${prices[0]})`);
      console.log(`   Outcome 2: ${outcomes[1]} (No @ ${prices[1]})`);
      console.log(`\n   Interpretation:`);
      console.log(`      ${outcomes[0]} -${line} covers @ ${prices[0]}`);
      console.log(`      ${outcomes[1]} +${line} covers @ ${prices[1]}`);
      console.log('');
    }

    // Kalshi spreads for this game
    const kalshiKCEvent = kalshiEvents.find(e =>
      e.title?.toLowerCase().includes('kansas') &&
      e.title?.toLowerCase().includes('denver')
    );

    // Group markets by line (outside the if block)
    const marketsByLine = new Map();

    if (kalshiKCEvent) {
      console.log('📊 KALSHI - Kansas City at Denver:');
      console.log(`   Event: ${kalshiKCEvent.title}`);
      console.log(`   Total markets: ${kalshiKCEvent.markets?.length || 0}\n`);
      for (const market of kalshiKCEvent.markets || []) {
        const line = market.floor_strike;
        if (!marketsByLine.has(line)) {
          marketsByLine.set(line, []);
        }

        const titleMatch = market.title?.match(/^(\w+(?:\s+\w+)*?)\s+wins by over/i);
        const teamName = titleMatch ? titleMatch[1] : '';

        let price = null;
        if (market.last_price > 0 && market.last_price < 100) price = market.last_price / 100;
        else if (market.yes_bid > 1 && market.yes_bid < 99) price = market.yes_bid / 100;
        else if (market.yes_ask > 1 && market.yes_ask < 99) price = market.yes_ask / 100;

        if (price) {
          marketsByLine.get(line).push({
            team: teamName,
            line,
            yesPrice: price,
            noPrice: 1 - price,
            title: market.title,
          });
        }
      }

      // Show line 3.5 specifically
      const line35Markets = marketsByLine.get(3.5);
      if (line35Markets) {
        console.log('   📍 Line 3.5 markets:');
        line35Markets.forEach(m => {
          console.log(`\n      Market: "${m.title}"`);
          console.log(`         Yes (${m.team} covers -${m.line}): ${m.yesPrice.toFixed(6)}`);
          console.log(`         No  (Opponent covers +${m.line}): ${m.noPrice.toFixed(6)}`);
        });
        console.log('');
      }
    }

    console.log('='.repeat(70));
    console.log('\n💡 KEY INSIGHT:\n');
    console.log('Polymarket: 1 market per game/line with Yes/No for both sides');
    console.log('   - "Chiefs -3.5" Yes = Chiefs cover');
    console.log('   - "Chiefs -3.5" No = Broncos cover (+3.5)');
    console.log('');
    console.log('Kalshi: 2 markets per game/line (one for each team)');
    console.log('   - "Chiefs wins by over 3.5" Yes = Chiefs cover -3.5');
    console.log('   - "Chiefs wins by over 3.5" No = Broncos cover +3.5');
    console.log('   - "Broncos wins by over 3.5" Yes = Broncos cover -3.5 (DIFFERENT BET!)');
    console.log('');
    console.log('🎯 ARBITRAGE STRATEGY:');
    console.log('For the SAME spread (Chiefs -3.5):');
    console.log('   Option A: Buy Chiefs -3.5 on Polymarket + Broncos +3.5 on Kalshi');
    console.log('             = Poly Yes + Kalshi No for "Chiefs wins by over 3.5"');
    console.log('');
    console.log('   Option B: Buy Broncos +3.5 on Polymarket + Chiefs -3.5 on Kalshi');
    console.log('             = Poly No + Kalshi Yes for "Chiefs wins by over 3.5"');
    console.log('');
    console.log('If either option costs < $1, we have arbitrage!');
    console.log('');

    // Calculate actual arbitrage for line 3.5
    if (polyKCSpread && kalshiKCEvent) {
      const polyPrices = JSON.parse(polyKCSpread.outcomePrices);
      const polyYes = parseFloat(polyPrices[0]); // Chiefs cover
      const polyNo = parseFloat(polyPrices[1]);  // Broncos cover

      const line35Markets = Array.from(marketsByLine.get(3.5) || []);
      const chiefsMarket = line35Markets.find(m => m.team.toLowerCase().includes('kansas'));

      if (chiefsMarket) {
        const kalshiYes = chiefsMarket.yesPrice; // Chiefs cover
        const kalshiNo = chiefsMarket.noPrice;   // Broncos cover

        console.log('📊 ARBITRAGE CALCULATION for Line 3.5:\n');
        console.log(`   Polymarket Chiefs -3.5: Yes = ${polyYes.toFixed(6)}, No = ${polyNo.toFixed(6)}`);
        console.log(`   Kalshi Chiefs -3.5:     Yes = ${kalshiYes.toFixed(6)}, No = ${kalshiNo.toFixed(6)}`);
        console.log('');

        const optionA = polyYes + kalshiNo;
        const optionB = polyNo + kalshiYes;

        console.log(`   Option A: Poly Yes + Kalshi No = ${polyYes.toFixed(6)} + ${kalshiNo.toFixed(6)} = ${optionA.toFixed(6)}`);
        if (optionA < 1) {
          console.log(`   ✅ ARBITRAGE! Profit = ${((1 - optionA) / optionA * 100).toFixed(2)}%`);
        } else {
          console.log(`   ❌ No arbitrage (cost > $1)`);
        }

        console.log(`\n   Option B: Poly No + Kalshi Yes = ${polyNo.toFixed(6)} + ${kalshiYes.toFixed(6)} = ${optionB.toFixed(6)}`);
        if (optionB < 1) {
          console.log(`   ✅ ARBITRAGE! Profit = ${((1 - optionB) / optionB * 100).toFixed(2)}%`);
        } else {
          console.log(`   ❌ No arbitrage (cost > $1)`);
        }
      }
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

understandSpreadMatching();
