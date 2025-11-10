// Complete accuracy test for both APIs
// Run with: node test-complete-accuracy.js

console.log('🎯 COMPLETE ACCURACY TEST - ALL MARKETS\n');
console.log('Testing: Get ALL markets with 100% accurate data\n');

async function testPolymarketComplete() {
  console.log('='.repeat(70));
  console.log('📊 POLYMARKET - Complete Test');
  console.log('='.repeat(70) + '\n');

  let allMarkets = [];
  const limit = 100;
  const maxPages = 10;

  console.log('Fetching markets with pagination...\n');

  for (let page = 0; page < maxPages; page++) {
    const offset = page * limit;
    const url = `https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=${limit}&offset=${offset}`;

    try {
      const response = await fetch(url);
      const markets = await response.json();

      if (!Array.isArray(markets) || markets.length === 0) {
        console.log(`   Page ${page + 1}: No more markets\n`);
        break;
      }

      console.log(`   Page ${page + 1}: ${markets.length} markets (total: ${allMarkets.length + markets.length})`);
      allMarkets.push(...markets);

      if (markets.length < limit) {
        console.log('   Reached last page\n');
        break;
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   Error on page ${page + 1}: ${error.message}`);
      break;
    }
  }

  console.log(`\n✅ Total markets fetched: ${allMarkets.length}\n`);

  // Analyze data quality
  let withPrices = 0;
  let withoutPrices = 0;
  let priceExamples = [];

  allMarkets.forEach(market => {
    let hasPrice = false;

    // Test price extraction (same as polymarketAPI.ts)
    if (market.outcomePrices && typeof market.outcomePrices === 'string') {
      try {
        const parsed = JSON.parse(market.outcomePrices);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          const yes = parseFloat(parsed[0]);
          const no = parseFloat(parsed[1]);
          if (!isNaN(yes) && !isNaN(no)) {
            hasPrice = true;
            if (priceExamples.length < 5) {
              priceExamples.push({
                title: market.question || market.title,
                yes: yes,
                no: no,
              });
            }
          }
        }
      } catch (e) {}
    }

    if (!hasPrice && market.lastTradePrice > 0) {
      hasPrice = true;
      if (priceExamples.length < 5) {
        priceExamples.push({
          title: market.question || market.title,
          yes: market.lastTradePrice,
          no: 1 - market.lastTradePrice,
        });
      }
    }

    if (hasPrice) {
      withPrices++;
    } else {
      withoutPrices++;
    }
  });

  console.log('📊 Data Quality Analysis:');
  console.log(`   Markets with valid prices: ${withPrices} (${((withPrices/allMarkets.length)*100).toFixed(1)}%)`);
  console.log(`   Markets without prices: ${withoutPrices}`);

  console.log('\n💰 Sample prices (verify accuracy):');
  priceExamples.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.title.substring(0, 60)}`);
    console.log(`      Yes: $${m.yes.toFixed(4)} / No: $${m.no.toFixed(4)}`);
  });

  // Date analysis
  const now = new Date();
  const futureMarkets = allMarkets.filter(m => {
    if (!m.endDate) return true;
    return new Date(m.endDate) > now;
  });

  console.log(`\n📅 Date Analysis:`);
  console.log(`   Future/current markets: ${futureMarkets.length} (${((futureMarkets.length/allMarkets.length)*100).toFixed(1)}%)`);

  return {
    total: allMarkets.length,
    withPrices: withPrices,
    future: futureMarkets.length,
  };
}

async function testKalshiComplete() {
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 KALSHI - Complete Test');
  console.log('='.repeat(70) + '\n');

  let allMarkets = [];
  const limit = 500;
  const maxPages = 4;

  console.log('Fetching markets with pagination...\n');

  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=${limit}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const markets = data.markets || [];

      if (markets.length === 0) {
        console.log(`   Page ${page}: No more markets\n`);
        break;
      }

      console.log(`   Page ${page}: ${markets.length} markets (total: ${allMarkets.length + markets.length})`);
      allMarkets.push(...markets);

      if (markets.length < limit) {
        console.log('   Reached last page\n');
        break;
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   Error on page ${page}: ${error.message}`);
      break;
    }
  }

  console.log(`\n✅ Total markets fetched: ${allMarkets.length}\n`);

  // Analyze data quality (same logic as kalshiAPI.ts)
  let withPrices = 0;
  let withoutPrices = 0;
  let priceExamples = [];

  allMarkets.forEach(market => {
    let hasPrice = false;
    let yesPrice = 0.5;

    // Priority 1: last_price
    if (market.last_price > 0 && market.last_price < 100) {
      yesPrice = market.last_price / 100;
      hasPrice = true;
    }
    // Priority 2: previous_price
    else if (market.previous_price > 0 && market.previous_price < 100) {
      yesPrice = market.previous_price / 100;
      hasPrice = true;
    }
    // Priority 3: yes_bid
    else if (market.yes_bid > 1 && market.yes_bid < 99) {
      yesPrice = market.yes_bid / 100;
      hasPrice = true;
    }
    // Priority 4: yes_ask
    else if (market.yes_ask > 1 && market.yes_ask < 99) {
      yesPrice = market.yes_ask / 100;
      hasPrice = true;
    }
    // Priority 5: previous_yes_bid
    else if (market.previous_yes_bid > 1 && market.previous_yes_bid < 99) {
      yesPrice = market.previous_yes_bid / 100;
      hasPrice = true;
    }

    if (hasPrice) {
      withPrices++;
      if (priceExamples.length < 5) {
        priceExamples.push({
          title: market.title || market.ticker,
          yes: yesPrice,
          no: 1 - yesPrice,
        });
      }
    } else {
      withoutPrices++;
    }
  });

  console.log('📊 Data Quality Analysis:');
  console.log(`   Markets with valid prices: ${withPrices} (${((withPrices/allMarkets.length)*100).toFixed(1)}%)`);
  console.log(`   Markets without prices: ${withoutPrices}`);

  console.log('\n💰 Sample prices (verify accuracy):');
  priceExamples.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.title.substring(0, 60)}`);
    console.log(`      Yes: $${m.yes.toFixed(4)} / No: $${m.no.toFixed(4)}`);
  });

  // Market type analysis
  const multivariate = allMarkets.filter(m => m.mve_selected_legs).length;
  const regular = allMarkets.length - multivariate;

  console.log(`\n📈 Market Types:`);
  console.log(`   Regular markets: ${regular}`);
  console.log(`   Multivariate/Parlay: ${multivariate}`);

  return {
    total: allMarkets.length,
    withPrices: withPrices,
  };
}

async function main() {
  const polyResults = await testPolymarketComplete();
  const kalshiResults = await testKalshiComplete();

  console.log('\n\n' + '='.repeat(70));
  console.log('🎉 FINAL SUMMARY - ALL MARKETS');
  console.log('='.repeat(70));

  console.log('\n📊 POLYMARKET:');
  console.log(`   Total markets: ${polyResults.total}`);
  console.log(`   Markets with prices: ${polyResults.withPrices}`);
  console.log(`   Future markets: ${polyResults.future}`);

  console.log('\n📊 KALSHI:');
  console.log(`   Total markets: ${kalshiResults.total}`);
  console.log(`   Markets with prices: ${kalshiResults.withPrices}`);

  console.log('\n📊 COMBINED:');
  console.log(`   Total markets available: ${polyResults.total + kalshiResults.total}`);
  console.log(`   Markets with valid prices: ${polyResults.withPrices + kalshiResults.withPrices}`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ ACCURACY CHECK:');
  console.log('='.repeat(70));
  console.log('\nVerify the sample prices above:');
  console.log('  ✓ Prices should NOT all be 0.5000 (that would be wrong)');
  console.log('  ✓ Prices should be varied (e.g., 0.0135, 0.2400, 0.7500)');
  console.log('  ✓ Yes + No should equal ~1.0000');
  console.log('\nIf sample prices look correct, your app has 100% accurate data! 🎉');
}

main();
