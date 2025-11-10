// Find the specific Eagles -13.5 spread the user mentioned

async function findEaglesSpread() {
  console.log('🔍 Looking for Eagles/Philadelphia -13.5 spread\n');
  console.log('='.repeat(70));

  try {
    // Fetch ALL Polymarket spreads
    const polyUrl = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=100';
    const polyResponse = await fetch(polyUrl);
    const polyMarkets = await polyResponse.json();

    console.log(`\n📊 Fetched ${polyMarkets.length} total spreads\n`);

    // Find any Eagles/Philadelphia spreads
    const eaglesSpreads = polyMarkets.filter(m => {
      const question = (m.question || '').toLowerCase();
      return question.includes('eagle') || question.includes('philadelphia');
    });

    console.log(`✅ Found ${eaglesSpreads.length} Eagles spreads:\n`);

    for (const market of eaglesSpreads) {
      const prices = JSON.parse(market.outcomePrices);
      const outcomes = JSON.parse(market.outcomes);
      const line = Math.abs(parseFloat(market.line));

      console.log(`Question: "${market.question}"`);
      console.log(`   Line: ${line}`);
      console.log(`   Outcomes: ${JSON.stringify(outcomes)}`);
      console.log(`   Prices: ${prices[0]} and ${prices[1]}`);
      console.log('');

      // Check if this matches what the user described
      if (line === 13.5 || line === 13 || (parseFloat(prices[0]) < 0.25 && parseFloat(prices[1]) < 0.25)) {
        console.log('⚠️ THIS MIGHT BE THE ONE THE USER SAW!');
        console.log('');
      }
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findEaglesSpread();
