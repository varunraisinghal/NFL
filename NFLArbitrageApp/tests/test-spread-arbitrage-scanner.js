// Comprehensive spread arbitrage scanner across all games and lines

async function scanSpreadArbitrage() {
  console.log('🔍 COMPREHENSIVE SPREAD ARBITRAGE SCANNER\n');
  console.log('='.repeat(70));

  try {
    // Fetch all markets
    console.log('\n📊 Fetching all spread markets...\n');

    const [polyResponse, kalshiResponse] = await Promise.all([
      fetch('https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=100'),
      fetch('https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLSPREAD&status=open&with_nested_markets=true&limit=50')
    ]);

    const polyMarkets = await polyResponse.json();
    const kalshiData = await kalshiResponse.json();
    const kalshiEvents = kalshiData.events || [];

    console.log(`✅ Fetched ${polyMarkets.length} Polymarket spreads`);
    console.log(`✅ Fetched ${kalshiEvents.length} Kalshi spread events\n`);

    // Process Polymarket markets
    const polyProcessed = new Map(); // Key: "team1-team2-line"

    const epsilon = 0.000001;
    for (const market of polyMarkets) {
      if (!market.outcomePrices || !market.outcomes) continue;

      try {
        const prices = JSON.parse(market.outcomePrices);
        const outcomes = JSON.parse(market.outcomes);
        const yesPrice = parseFloat(prices[0]);
        const noPrice = parseFloat(prices[1]);

        if (Math.abs(yesPrice) < epsilon || Math.abs(yesPrice - 1) < epsilon) continue;

        const line = market.line !== undefined ? Math.abs(parseFloat(market.line)) : 0;
        const favorite = outcomes[0].toLowerCase().trim();
        const underdog = outcomes[1].toLowerCase().trim();

        // Create sorted key for matching
        const teams = [favorite, underdog].sort();
        const key = `${teams[0]}-${teams[1]}-${line}`;

        polyProcessed.set(key, {
          favorite,
          underdog,
          line,
          favoritePrice: yesPrice,
          underdogPrice: noPrice,
          title: market.question,
        });
      } catch (e) {
        // Skip
      }
    }

    // Process Kalshi markets
    const kalshiProcessed = new Map(); // Key: "team1-team2-line"

    for (const event of kalshiEvents) {
      const markets = event.markets || [];
      const eventTitle = event.title || '';
      const eventMatch = eventTitle.match(/^(.+?)\s+at\s+(.+?):/i);
      if (!eventMatch) continue;

      const awayTeam = eventMatch[1].toLowerCase().trim();
      const homeTeam = eventMatch[2].toLowerCase().trim();

      // Group by line
      const lineMap = new Map();
      for (const market of markets) {
        const titleMatch = market.title?.match(/^(\w+(?:\s+\w+)*?)\s+wins by over/i);
        const teamName = titleMatch ? titleMatch[1].toLowerCase().trim() : '';
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

        const lineKey = `${line}`;
        if (!lineMap.has(lineKey)) {
          lineMap.set(lineKey, {});
        }

        lineMap.get(lineKey)[teamName] = { yesPrice, noPrice };
      }

      // For each line, create arbitrage entries
      for (const [lineStr, teamPrices] of lineMap.entries()) {
        const line = parseFloat(lineStr);
        const teams = [awayTeam, homeTeam].sort();
        const key = `${teams[0]}-${teams[1]}-${line}`;

        // Store the favorite's market prices (either team could be favorite)
        // We need to match with Polymarket's favorite
        kalshiProcessed.set(key, {
          awayTeam,
          homeTeam,
          line,
          teamPrices, // Store both teams' prices
        });
      }
    }

    // Find arbitrage opportunities
    console.log('🔍 Scanning for arbitrage opportunities...\n');
    console.log('='.repeat(70));

    const opportunities = [];

    for (const [key, polyMarket] of polyProcessed.entries()) {
      const kalshiMarket = kalshiProcessed.get(key);
      if (!kalshiMarket) continue;

      // Find the matching Kalshi market for the favorite
      const polyFav = polyMarket.favorite;
      const kalshiTeamPrices = kalshiMarket.teamPrices;

      // Find which Kalshi team matches the Polymarket favorite
      let kalshiFavPrice = null;
      for (const [teamName, prices] of Object.entries(kalshiTeamPrices)) {
        if (polyFav.includes(teamName) || teamName.includes(polyFav)) {
          kalshiFavPrice = prices;
          break;
        }
      }

      if (!kalshiFavPrice) continue;

      // Calculate arbitrage options
      // Option A: Buy favorite on both platforms
      const optionA = polyMarket.favoritePrice + kalshiFavPrice.noPrice;

      // Option B: Buy underdog on both platforms
      const optionB = polyMarket.underdogPrice + kalshiFavPrice.yesPrice;

      if (optionA < 1 || optionB < 1) {
        const profitA = optionA < 1 ? ((1 - optionA) / optionA * 100) : null;
        const profitB = optionB < 1 ? ((1 - optionB) / optionB * 100) : null;

        opportunities.push({
          game: `${polyMarket.favorite} vs ${polyMarket.underdog}`,
          line: polyMarket.line,
          polyFavPrice: polyMarket.favoritePrice,
          polyUndPrice: polyMarket.underdogPrice,
          kalshiFavYes: kalshiFavPrice.yesPrice,
          kalshiFavNo: kalshiFavPrice.noPrice,
          optionA,
          optionB,
          profitA,
          profitB,
        });
      }
    }

    console.log(`\n✅ Scan complete!\n`);

    if (opportunities.length > 0) {
      console.log(`🎉 FOUND ${opportunities.length} ARBITRAGE OPPORTUNITIES!\n`);
      console.log('='.repeat(70));

      opportunities.sort((a, b) => {
        const maxA = Math.max(a.profitA || 0, a.profitB || 0);
        const maxB = Math.max(b.profitA || 0, b.profitB || 0);
        return maxB - maxA;
      });

      opportunities.slice(0, 10).forEach((opp, i) => {
        console.log(`\n${i + 1}. ${opp.game} - Line ${opp.line}`);
        console.log(`   Polymarket: Fav ${opp.polyFavPrice.toFixed(6)}, Und ${opp.polyUndPrice.toFixed(6)}`);
        console.log(`   Kalshi:     Fav ${opp.kalshiFavYes.toFixed(6)}, Und ${opp.kalshiFavNo.toFixed(6)}`);

        if (opp.profitA) {
          console.log(`   ✅ Option A (Favorite on both): Cost ${opp.optionA.toFixed(6)} → ${opp.profitA.toFixed(2)}% profit`);
        }
        if (opp.profitB) {
          console.log(`   ✅ Option B (Underdog on both): Cost ${opp.optionB.toFixed(6)} → ${opp.profitB.toFixed(2)}% profit`);
        }
      });
    } else {
      console.log('❌ No arbitrage opportunities found\n');
      console.log('   Markets are currently efficient - all combinations cost $1.00 or more');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

scanSpreadArbitrage();
