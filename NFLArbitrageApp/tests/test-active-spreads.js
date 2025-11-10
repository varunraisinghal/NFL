// Find active NFL spreads with real prices

async function findActiveSpreads() {
  console.log('🏈 Finding Active NFL Spreads\n');
  console.log('='.repeat(60));

  try {
    const url = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=spreads&active=true&closed=false&limit=100';

    console.log(`URL: ${url}\n`);

    const response = await fetch(url);
    const markets = await response.json();

    console.log(`✅ Fetched ${markets.length} total spreads\n`);

    // Filter for markets with real prices (not 0 or 1)
    const activeMarkets = markets.filter(market => {
      if (!market.outcomePrices) return false;

      try {
        const prices = JSON.parse(market.outcomePrices);
        const yesPrice = parseFloat(prices[0]);
        const noPrice = parseFloat(prices[1]);

        // Filter out settled markets (exactly 0 or 1)
        const epsilon = 0.000001;
        if (Math.abs(yesPrice) < epsilon || Math.abs(yesPrice - 1) < epsilon) {
          return false;
        }
        if (Math.abs(noPrice) < epsilon || Math.abs(noPrice - 1) < epsilon) {
          return false;
        }

        return true;
      } catch (e) {
        return false;
      }
    });

    console.log(`📊 Active spreads with real prices: ${activeMarkets.length}\n`);

    if (activeMarkets.length > 0) {
      console.log('✅ Sample active spreads:\n');
      activeMarkets.slice(0, 10).forEach((market, i) => {
        const prices = JSON.parse(market.outcomePrices);
        const outcomes = JSON.parse(market.outcomes);

        console.log(`${i + 1}. ${market.question}`);
        console.log(`   Line: ${market.line}`);
        console.log(`   Outcomes: ${outcomes[0]} vs ${outcomes[1]}`);
        console.log(`   Yes Price: ${prices[0]}`);
        console.log(`   No Price: ${prices[1]}`);
        console.log(`   Volume: $${market.volumeNum}`);
        console.log(`   End Date: ${market.endDate}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No active spreads found with real prices');
      console.log('   All spreads appear to be settled (0 or 1)');

      // Show some examples of settled spreads
      console.log('\n📋 Sample settled spreads:\n');
      markets.slice(0, 5).forEach((market, i) => {
        const prices = JSON.parse(market.outcomePrices);
        const outcomes = JSON.parse(market.outcomes);

        console.log(`${i + 1}. ${market.question}`);
        console.log(`   Outcomes: ${outcomes[0]} vs ${outcomes[1]}`);
        console.log(`   Prices: ${prices[0]} / ${prices[1]} (SETTLED)`);
        console.log(`   End Date: ${market.endDate}`);
        console.log('');
      });
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findActiveSpreads();
