// Test what the UI actually displays for spreads

async function testUISpreadDisplay() {
  console.log('🎨 Testing UI Spread Display\n');
  console.log('='.repeat(70));

  try {
    // Fetch Polymarket spreads
    const polyUrl = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=100';
    const polyResponse = await fetch(polyUrl);
    const polyMarkets = await polyResponse.json();

    // Process like the app does
    const epsilon = 0.000001;
    const processedSpreads = [];

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

    console.log(`\n✅ Processed ${processedSpreads.length} spreads\n`);

    // Group by game (like the UI does)
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

    console.log('📊 UI DISPLAY (as user sees it):\n');
    console.log('='.repeat(70));

    let gameNum = 1;
    for (const [gameKey, spreads] of gameMap.entries()) {
      if (spreads.length === 0) continue;

      // Get team names from first spread
      const firstSpread = spreads[0];
      const favorite = firstSpread.teams[0];
      const underdog = firstSpread.teams[1];

      console.log(`\n${gameNum}. ${favorite} vs ${underdog}`);
      console.log('-'.repeat(70));

      // Show each spread line
      for (const spread of spreads) {
        console.log(`\n   Line ${spread.line}:`);
        console.log(`      ${favorite} -${spread.line} @ ${spread.yesPrice.toFixed(6)} (Yes)`);
        console.log(`      ${underdog} +${spread.line} @ ${spread.noPrice.toFixed(6)} (No)`);
        console.log(`      Raw question: "${spread.question}"`);
      }

      console.log('');
      gameNum++;

      // Only show first 5 games
      if (gameNum > 5) break;
    }

    console.log('='.repeat(70));
    console.log('\n💡 CHECKING FOR ISSUES:\n');

    // Check if there are any weird cases
    let issuesFound = 0;

    for (const [gameKey, spreads] of gameMap.entries()) {
      for (const spread of spreads) {
        const favorite = spread.teams[0];
        const underdog = spread.teams[1];

        // Check if the question matches what we're displaying
        const questionLower = spread.question.toLowerCase();
        const favoriteInQuestion = questionLower.includes(favorite.toLowerCase());

        if (!favoriteInQuestion) {
          issuesFound++;
          console.log(`⚠️ WARNING: Question mismatch!`);
          console.log(`   Question: "${spread.question}"`);
          console.log(`   We display: ${favorite} -${spread.line} @ ${spread.yesPrice.toFixed(6)}`);
          console.log(`   But ${favorite} might not be the favorite in the question!`);
          console.log('');
        }

        // Check if prices look reasonable
        if (spread.yesPrice < 0.1 || spread.yesPrice > 0.9) {
          console.log(`⚠️ Unusual price: ${favorite} -${spread.line} @ ${spread.yesPrice.toFixed(6)}`);
          console.log(`   This is ${(spread.yesPrice * 100).toFixed(1)}% probability`);
          console.log('');
        }
      }
    }

    if (issuesFound === 0) {
      console.log('✅ No obvious issues found in spread display');
    } else {
      console.log(`❌ Found ${issuesFound} potential issues`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testUISpreadDisplay();
