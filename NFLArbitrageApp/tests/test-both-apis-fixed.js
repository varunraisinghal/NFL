// Test both APIs with all fixes applied
// Run with: node test-both-apis-fixed.js

console.log('🎯 TESTING BOTH APIS WITH FIXES\n');

async function testPolymarketFixed() {
  console.log('='.repeat(70));
  console.log('POLYMARKET - Testing Price Extraction Fix');
  console.log('='.repeat(70) + '\n');

  const url = 'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=10';

  try {
    const response = await fetch(url);
    const markets = await response.json();

    console.log(`Got ${markets.length} markets\n`);

    let successCount = 0;
    let failCount = 0;

    markets.forEach((market, i) => {
      let yesPrice = null, noPrice = null;
      let hasPrices = false;

      // Same logic as polymarketAPI.ts
      if (market.outcomePrices && typeof market.outcomePrices === 'string') {
        try {
          const parsed = JSON.parse(market.outcomePrices);
          if (Array.isArray(parsed) && parsed.length >= 2) {
            yesPrice = parseFloat(parsed[0]);
            noPrice = parseFloat(parsed[1]);
            hasPrices = true;
          }
        } catch (e) {
          // Fallback
        }
      }

      if (!hasPrices && market.lastTradePrice > 0) {
        yesPrice = market.lastTradePrice;
        noPrice = 1 - yesPrice;
        hasPrices = true;
      }

      if (!hasPrices && market.bestBid > 0) {
        yesPrice = market.bestBid;
        noPrice = 1 - yesPrice;
        hasPrices = true;
      }

      if (hasPrices) {
        console.log(`✅ ${i + 1}. ${market.question.substring(0, 50)}`);
        console.log(`   Yes: $${yesPrice.toFixed(4)}, No: $${noPrice.toFixed(4)}`);
        successCount++;
      } else {
        console.log(`❌ ${i + 1}. ${market.question.substring(0, 50)}`);
        console.log(`   No prices found`);
        failCount++;
      }
    });

    console.log(`\n📊 Results: ${successCount} with prices, ${failCount} without`);
    return successCount;

  } catch (error) {
    console.error('Error:', error.message);
    return 0;
  }
}

async function testKalshiFixed() {
  console.log('\n\n' + '='.repeat(70));
  console.log('KALSHI - Testing Price Extraction + Pagination');
  console.log('='.repeat(70) + '\n');

  const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=100';

  try {
    const response = await fetch(url);
    const data = await response.json();
    const markets = data.markets || [];

    console.log(`Got ${markets.length} markets\n`);

    let successCount = 0;
    let failCount = 0;
    const samplesWithPrices = [];

    markets.forEach((market, i) => {
      let yesPrice = null, noPrice = null;
      let hasValidPrice = false;

      // Same logic as kalshiAPI.ts
      if (market.last_price > 0 && market.last_price < 100) {
        yesPrice = market.last_price / 100;
        noPrice = 1 - yesPrice;
        hasValidPrice = true;
      } else if (market.previous_price > 0 && market.previous_price < 100) {
        yesPrice = market.previous_price / 100;
        noPrice = 1 - yesPrice;
        hasValidPrice = true;
      } else if (market.yes_bid > 1 && market.yes_bid < 99) {
        yesPrice = market.yes_bid / 100;
        noPrice = 1 - yesPrice;
        hasValidPrice = true;
      }

      if (hasValidPrice) {
        successCount++;
        if (samplesWithPrices.length < 5) {
          samplesWithPrices.push({
            title: market.title || market.ticker,
            yesPrice,
            noPrice,
          });
        }
      } else {
        failCount++;
      }
    });

    console.log(`📊 Results: ${successCount} with prices, ${failCount} without\n`);

    if (samplesWithPrices.length > 0) {
      console.log('✅ Sample markets with prices:');
      samplesWithPrices.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.title.substring(0, 60)}`);
        console.log(`      Yes: $${m.yesPrice.toFixed(4)}, No: $${m.noPrice.toFixed(4)}`);
      });
    }

    return successCount;

  } catch (error) {
    console.error('Error:', error.message);
    return 0;
  }
}

async function main() {
  const polyCount = await testPolymarketFixed();
  const kalshiCount = await testKalshiFixed();

  console.log('\n\n' + '='.repeat(70));
  console.log('🎉 FINAL SUMMARY');
  console.log('='.repeat(70));

  console.log(`\n✅ Polymarket: ${polyCount}/10 markets with valid prices`);
  console.log(`✅ Kalshi: ${kalshiCount}/100 markets with valid prices`);

  if (polyCount >= 8 && kalshiCount >= 10) {
    console.log(`\n🎉 SUCCESS! Both APIs are fixed and working!`);
  } else if (polyCount >= 8) {
    console.log(`\n⚠️ Polymarket is working, but Kalshi has limited price data`);
    console.log(`   This is normal - many Kalshi markets have no trading activity`);
  } else {
    console.log(`\n⚠️ Some issues remain - check the debug output above`);
  }
}

main();
