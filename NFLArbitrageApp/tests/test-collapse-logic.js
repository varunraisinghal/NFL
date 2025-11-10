// Test the collapsible spread logic

async function testCollapseLogic() {
  console.log('🎨 Testing Collapsible Spread Logic\n');
  console.log('='.repeat(70));

  try {
    const polyUrl = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=100';
    const polyResponse = await fetch(polyUrl);
    const polyMarkets = await polyResponse.json();

    // Process spreads
    const epsilon = 0.000001;
    const processedSpreads = [];

    for (const market of polyMarkets) {
      if (!market.outcomePrices || !market.outcomes) continue;

      try {
        const prices = JSON.parse(market.outcomePrices);
        const outcomes = JSON.parse(market.outcomes);
        const yesPrice = parseFloat(prices[0]);
        const noPrice = parseFloat(prices[1]);

        if (Math.abs(yesPrice) < epsilon || Math.abs(yesPrice - 1) < epsilon) continue;

        const line = market.line !== undefined ? Math.abs(parseFloat(market.line)) : 0;

        processedSpreads.push({
          id: market.id,
          question: market.question,
          teams: outcomes,
          line: line,
          yesPrice: yesPrice,
          noPrice: noPrice,
          volume: market.volumeNum || market.volume || 0,
          liquidity: market.liquidityNum || market.liquidity || 0,
        });
      } catch (e) {
        // Skip
      }
    }

    // Group by game
    const gameMap = new Map();
    for (const spread of processedSpreads) {
      if (spread.teams && spread.teams.length >= 2) {
        const gameKey = spread.teams.slice(0, 2).sort().join('-');
        if (!gameMap.has(gameKey)) {
          gameMap.set(gameKey, []);
        }
        gameMap.get(gameKey).push(spread);
      }
    }

    console.log(`\n✅ Processed ${processedSpreads.length} spreads`);
    console.log(`✅ Found ${gameMap.size} unique games\n`);
    console.log('='.repeat(70));

    // Simulate UI display with collapse logic
    console.log('\n📊 COLLAPSIBLE UI SIMULATION:\n');

    let gameNum = 1;
    for (const [gameKey, spreads] of gameMap.entries()) {
      if (spreads.length === 0) continue;

      // Get team names
      const allTeams = new Set();
      spreads.forEach(s => s.teams.forEach(t => allTeams.add(t)));
      const teamNames = Array.from(allTeams);

      // Find main spread (highest volume + liquidity)
      const mainSpread = spreads.reduce((max, curr) => {
        const maxMetric = (max.volume || 0) + (max.liquidity || 0);
        const currMetric = (curr.volume || 0) + (curr.liquidity || 0);
        return currMetric > maxMetric ? curr : max;
      }, spreads[0]);

      const hasMultipleSpreads = spreads.length > 1;
      const additionalCount = spreads.length - 1;

      console.log(`\n${gameNum}. ${teamNames.join(' vs ')}`);

      if (hasMultipleSpreads) {
        console.log(`   [+${additionalCount} more ${additionalCount === 1 ? 'line' : 'lines'}  ▼]  👈 TAPPABLE`);
      } else {
        console.log(`   (Single line - not expandable)`);
      }

      console.log('-'.repeat(70));

      // Parse main spread
      const questionMatch = mainSpread.question.match(/Spread:\s*(\w+(?:\s+\w+)*?)\s*\(/i);
      let favoriteTeam = mainSpread.teams[0];
      let underdogTeam = mainSpread.teams[1];

      if (questionMatch) {
        const teamInQuestion = questionMatch[1].trim();
        const team1Match = mainSpread.teams[0].toLowerCase().includes(teamInQuestion.toLowerCase());
        const team2Match = mainSpread.teams[1].toLowerCase().includes(teamInQuestion.toLowerCase());

        if (team2Match && !team1Match) {
          favoriteTeam = mainSpread.teams[1];
          underdogTeam = mainSpread.teams[0];
        }
      }

      console.log(`\n   Line ${mainSpread.line}  ${hasMultipleSpreads ? '⭐ MAIN (highest volume)' : ''}`);
      console.log(`      ${favoriteTeam} -${mainSpread.line}  @ ${mainSpread.yesPrice.toFixed(6)}`);
      console.log(`      ${underdogTeam} +${mainSpread.line}  @ ${mainSpread.noPrice.toFixed(6)}`);
      console.log(`      Volume: $${mainSpread.volume.toLocaleString()}, Liquidity: $${mainSpread.liquidity.toLocaleString()}`);

      if (hasMultipleSpreads) {
        console.log(`\n   [Hidden: ${additionalCount} more ${additionalCount === 1 ? 'line' : 'lines'}]`);
        console.log(`   Tap to expand and see:`);
        spreads
          .filter(s => s.id !== mainSpread.id)
          .forEach((s, i) => {
            console.log(`      - Line ${s.line} (vol: $${s.volume.toLocaleString()})`);
          });
      }

      console.log('');
      gameNum++;

      // Only show first 5 games
      if (gameNum > 5) break;
    }

    console.log('='.repeat(70));
    console.log('\n📊 STATISTICS:\n');

    let singleSpreadGames = 0;
    let multiSpreadGames = 0;
    let totalHiddenLines = 0;

    for (const [_, spreads] of gameMap.entries()) {
      if (spreads.length === 1) {
        singleSpreadGames++;
      } else {
        multiSpreadGames++;
        totalHiddenLines += (spreads.length - 1);
      }
    }

    console.log(`Games with single spread: ${singleSpreadGames} (not collapsible)`);
    console.log(`Games with multiple spreads: ${multiSpreadGames} (tappable)`);
    console.log(`Total lines hidden by default: ${totalHiddenLines}`);
    console.log(`Total lines visible by default: ${gameMap.size}`);
    console.log(`Reduction: ${totalHiddenLines} lines hidden = ${((totalHiddenLines / processedSpreads.length) * 100).toFixed(1)}% less clutter`);

    console.log('\n✅ UI is much cleaner with collapse feature!');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCollapseLogic();
