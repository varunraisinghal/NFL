// Analyze spread arbitrage opportunities between Polymarket and Kalshi

async function analyzeSpreadArbitrage() {
  console.log('🔍 Analyzing Spread Arbitrage Opportunities\n');
  console.log('='.repeat(70));

  try {
    // Fetch Polymarket spreads
    console.log('\n📊 Step 1: Fetching Polymarket spreads...\n');
    const polyUrl = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=100';
    const polyResponse = await fetch(polyUrl);
    const polyMarkets = await polyResponse.json();

    // Filter and process Polymarket spreads
    const epsilon = 0.000001;
    const polyProcessed = [];

    for (const market of polyMarkets) {
      if (!market.outcomePrices || !market.outcomes) continue;

      try {
        const prices = JSON.parse(market.outcomePrices);
        const outcomes = JSON.parse(market.outcomes);
        const yesPrice = parseFloat(prices[0]);
        const noPrice = parseFloat(prices[1]);

        // Filter out settled markets
        if (Math.abs(yesPrice) < epsilon || Math.abs(yesPrice - 1) < epsilon) continue;

        const line = market.line !== undefined ? Math.abs(parseFloat(market.line)) : 0;
        const favorite = outcomes[0]; // First team is favorite
        const underdog = outcomes[1];

        polyProcessed.push({
          platform: 'Polymarket',
          favorite,
          underdog,
          line,
          favoritePrice: yesPrice, // Yes = Favorite covers
          underdogPrice: noPrice,  // No = Underdog covers
          title: market.question,
        });
      } catch (e) {
        // Skip
      }
    }

    console.log(`✅ Processed ${polyProcessed.length} Polymarket spreads\n`);

    // Fetch Kalshi spreads
    console.log('📊 Step 2: Fetching Kalshi spreads...\n');
    const kalshiUrl = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLSPREAD&status=open&with_nested_markets=true&limit=20';
    const kalshiResponse = await fetch(kalshiUrl);
    const kalshiData = await kalshiResponse.json();
    const kalshiEvents = kalshiData.events || [];

    // Process Kalshi spreads
    const kalshiProcessed = [];

    for (const event of kalshiEvents) {
      const markets = event.markets || [];
      const eventTitle = event.title || '';
      const eventMatch = eventTitle.match(/^(.+?)\s+at\s+(.+?):/i);
      if (!eventMatch) continue;

      const awayTeam = eventMatch[1].trim();
      const homeTeam = eventMatch[2].trim();

      for (const market of markets) {
        const titleMatch = market.title?.match(/^(\w+(?:\s+\w+)*?)\s+wins by over/i);
        const teamName = titleMatch ? titleMatch[1] : '';
        const line = market.floor_strike !== undefined ? parseFloat(market.floor_strike) : 0;

        let yesPrice = 0.5;
        if (market.last_price > 0 && market.last_price < 100) {
          yesPrice = market.last_price / 100;
        } else if (market.yes_bid > 1 && market.yes_bid < 99) {
          yesPrice = market.yes_bid / 100;
        } else if (market.yes_ask > 1 && market.yes_ask < 99) {
          yesPrice = market.yes_ask / 100;
        } else {
          continue; // Skip if no valid price
        }

        const noPrice = 1 - yesPrice;

        // Determine opponent
        const opponent = teamName === awayTeam ? homeTeam : awayTeam;

        kalshiProcessed.push({
          platform: 'Kalshi',
          favorite: teamName,
          underdog: opponent,
          line,
          favoritePrice: yesPrice, // Yes = Favorite covers
          underdogPrice: noPrice,  // No = Underdog covers
          title: market.title,
          gameKey: `${awayTeam}-${homeTeam}`,
        });
      }
    }

    console.log(`✅ Processed ${kalshiProcessed.length} Kalshi spreads\n`);

    // Find arbitrage opportunities
    console.log('🔍 Step 3: Finding arbitrage opportunities...\n');
    console.log('='.repeat(70));

    const opportunities = [];

    for (const polyMarket of polyProcessed) {
      for (const kalshiMarket of kalshiProcessed) {
        // Check if same game (matching teams)
        const polyTeams = [polyMarket.favorite, polyMarket.underdog].map(t => t.toLowerCase());
        const kalshiTeams = [kalshiMarket.favorite, kalshiMarket.underdog].map(t => t.toLowerCase());

        const isSameGame = polyTeams.every(t =>
          kalshiTeams.some(kt => kt.includes(t) || t.includes(kt))
        );

        if (!isSameGame) continue;

        // Check if same line
        if (Math.abs(polyMarket.line - kalshiMarket.line) > 0.1) continue;

        // Check if same favorite
        const polyFavLower = polyMarket.favorite.toLowerCase();
        const kalshiFavLower = kalshiMarket.favorite.toLowerCase();
        const isSameFavorite = polyFavLower.includes(kalshiFavLower) || kalshiFavLower.includes(polyFavLower);

        if (!isSameFavorite) continue;

        // Calculate arbitrage opportunities
        // Option 1: Buy favorite on both platforms
        const favoriteCost = polyMarket.favoritePrice + kalshiMarket.favoritePrice;
        const favoriteProfit = favoriteCost < 1 ? ((1 - favoriteCost) / favoriteCost * 100) : null;

        // Option 2: Buy underdog on both platforms
        const underdogCost = polyMarket.underdogPrice + kalshiMarket.underdogPrice;
        const underdogProfit = underdogCost < 1 ? ((1 - underdogCost) / underdogCost * 100) : null;

        // Option 3: Buy favorite on one, underdog on other (should never work for same spread)
        const crossCost1 = polyMarket.favoritePrice + kalshiMarket.underdogPrice;
        const crossProfit1 = crossCost1 < 1 ? ((1 - crossCost1) / crossCost1 * 100) : null;

        const crossCost2 = polyMarket.underdogPrice + kalshiMarket.favoritePrice;
        const crossProfit2 = crossCost2 < 1 ? ((1 - crossCost2) / crossCost2 * 100) : null;

        if (favoriteProfit || underdogProfit || crossProfit1 || crossProfit2) {
          opportunities.push({
            game: `${polyMarket.favorite} vs ${polyMarket.underdog}`,
            line: polyMarket.line,
            polyFavPrice: polyMarket.favoritePrice,
            polyUndPrice: polyMarket.underdogPrice,
            kalshiFavPrice: kalshiMarket.favoritePrice,
            kalshiUndPrice: kalshiMarket.underdogPrice,
            favoriteArb: favoriteProfit,
            underdogArb: underdogProfit,
            crossArb1: crossProfit1,
            crossArb2: crossProfit2,
          });
        }
      }
    }

    console.log(`\n✅ Found ${opportunities.length} potential arbitrage opportunities\n`);

    if (opportunities.length > 0) {
      console.log('🎯 ARBITRAGE OPPORTUNITIES:\n');
      opportunities.slice(0, 5).forEach((opp, i) => {
        console.log(`${i + 1}. ${opp.game} (Line: ${opp.line})`);
        console.log(`   Polymarket: Favorite ${opp.polyFavPrice.toFixed(6)}, Underdog ${opp.polyUndPrice.toFixed(6)}`);
        console.log(`   Kalshi:     Favorite ${opp.kalshiFavPrice.toFixed(6)}, Underdog ${opp.kalshiUndPrice.toFixed(6)}`);

        if (opp.favoriteArb) {
          console.log(`   ✅ FAVORITE ARB: Buy favorite on both = ${opp.favoriteArb.toFixed(2)}% profit`);
        }
        if (opp.underdogArb) {
          console.log(`   ✅ UNDERDOG ARB: Buy underdog on both = ${opp.underdogArb.toFixed(2)}% profit`);
        }
        if (opp.crossArb1) {
          console.log(`   ⚠️ CROSS ARB 1: ${opp.crossArb1.toFixed(2)}% profit (likely error in data)`);
        }
        if (opp.crossArb2) {
          console.log(`   ⚠️ CROSS ARB 2: ${opp.crossArb2.toFixed(2)}% profit (likely error in data)`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No arbitrage opportunities found\n');
      console.log('This is expected because:');
      console.log('1. Spread markets are the same bet on both platforms');
      console.log('2. Buying the same outcome twice doubles your exposure without profit');
      console.log('3. True arbitrage would require OPPOSITE outcomes at favorable prices\n');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeSpreadArbitrage();
