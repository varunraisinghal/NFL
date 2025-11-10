// Check if grouping spreads by game causes issues with favorites

async function testSpreadGrouping() {
  console.log('🔍 Testing Spread Grouping Logic\n');
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
          question: market.question,
          teams: outcomes,
          line: line,
          yesPrice: yesPrice,
          noPrice: noPrice,
        });
      } catch (e) {
        // Skip
      }
    }

    // Group by game (like UI does)
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

    console.log('\n⚠️ CHECKING FOR GROUPING ISSUES:\n');

    let issuesFound = 0;

    for (const [gameKey, spreads] of gameMap.entries()) {
      if (spreads.length <= 1) continue;

      // Check if all spreads in this game have the same favorite
      const firstFavorite = spreads[0].teams[0];
      const allHaveSameFavorite = spreads.every(s => s.teams[0] === firstFavorite);

      if (!allHaveSameFavorite) {
        issuesFound++;
        console.log(`❌ ISSUE FOUND: ${gameKey}`);
        console.log('   Different spreads have different favorites:\n');

        for (const spread of spreads) {
          console.log(`   "${spread.question}"`);
          console.log(`      Favorite: ${spread.teams[0]} (outcomes[0])`);
          console.log(`      Line: ${spread.line}`);
          console.log('');
        }
      } else {
        // Check if the favorite makes sense based on the question
        for (const spread of spreads) {
          const questionLower = spread.question.toLowerCase();
          const favorite = spread.teams[0];
          const favoriteInQuestion = questionLower.includes(`${favorite.toLowerCase()} (`);

          if (!favoriteInQuestion) {
            issuesFound++;
            console.log(`⚠️ POTENTIAL ISSUE: ${spread.teams[0]} vs ${spread.teams[1]}`);
            console.log(`   Question: "${spread.question}"`);
            console.log(`   We think favorite is: ${favorite}`);
            console.log(`   But question might indicate different favorite`);
            console.log('');
          }
        }
      }
    }

    if (issuesFound === 0) {
      console.log('✅ No grouping issues found - all spreads are consistent');
    } else {
      console.log(`\n❌ Found ${issuesFound} potential issues with spread grouping`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n💡 ROOT CAUSE ANALYSIS:\n');
    console.log('The UI assumes outcomes[0] is ALWAYS the favorite for a game,');
    console.log('but this is only true if Polymarket groups spreads consistently.');
    console.log('');
    console.log('SOLUTION: Parse the question to determine which team is the');
    console.log('favorite for EACH spread line, not just use outcomes[0].');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSpreadGrouping();
