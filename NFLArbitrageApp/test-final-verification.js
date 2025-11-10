// Final verification test
// Run with: node test-final-verification.js

console.log('🎯 FINAL API VERIFICATION TEST\n');
console.log('This test simulates what your app will receive\n');

async function testFinalPolymarket() {
  console.log('='.repeat(70));
  console.log('📊 POLYMARKET - Final Test (Gamma API)');
  console.log('='.repeat(70));

  const url = 'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=1000';

  try {
    const response = await fetch(url);
    const marketArray = await response.json(); // Gamma API returns array directly

    console.log(`\n✅ Received ${marketArray.length} markets from API`);

    // Apply the same filters as your app
    let validMarkets = 0;
    let closedMarkets = 0;
    let archivedMarkets = 0;
    let oldMarkets = 0;
    let samples = [];

    for (const market of marketArray) {
      // Gamma API already filters for active=true&closed=false
      // Just check if has essential data
      if (!market.question && !market.title) {
        continue;
      }

      // Optional: filter out very old markets
      if (market.endDate && new Date(market.endDate) < new Date('2024-01-01')) {
        oldMarkets++;
        continue;
      }

      validMarkets++;

      if (samples.length < 5) {
        samples.push({
          question: market.question || market.title,
          endDate: market.endDate,
          active: market.active,
          closed: market.closed,
        });
      }
    }

    console.log(`\n📊 Results after filtering:`);
    console.log(`   Valid markets: ${validMarkets}`);
    console.log(`   Filtered out - Closed: ${closedMarkets}`);
    console.log(`   Filtered out - Archived: ${archivedMarkets}`);
    console.log(`   Filtered out - Old: ${oldMarkets}`);

    if (samples.length > 0) {
      console.log(`\n✅ Sample valid markets:`);
      samples.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.question.substring(0, 70)}${m.question.length > 70 ? '...' : ''}`);
      });
    }

    return validMarkets;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return 0;
  }
}

async function testFinalKalshi() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 KALSHI - Final Test');
  console.log('='.repeat(70));

  const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=500';

  try {
    const response = await fetch(url);
    const data = await response.json();

    const marketArray = data.markets || [];

    console.log(`\n✅ Received ${marketArray.length} markets from API`);

    // Apply the same filters as your app
    let validMarkets = 0;
    let noPriceMarkets = 0;
    let closedMarkets = 0;
    let samples = [];

    for (const market of marketArray) {
      // Same filtering logic as kalshiAPI.ts
      if (market.status === 'closed' || market.status === 'settled') {
        closedMarkets++;
        continue;
      }

      // Price extraction logic from kalshiAPI.ts
      let hasValidPrice = false;

      if (market.last_price !== undefined && market.last_price !== null && market.last_price > 0 && market.last_price < 100) {
        hasValidPrice = true;
      } else if (market.yes_bid !== undefined && market.yes_bid > 1 && market.yes_bid < 99) {
        hasValidPrice = true;
      } else if (market.yes_ask !== undefined && market.yes_ask > 1 && market.yes_ask < 99) {
        hasValidPrice = true;
      }

      if (!hasValidPrice) {
        noPriceMarkets++;
        continue;
      }

      validMarkets++;

      if (samples.length < 5) {
        const yesPrice = market.last_price > 0 ? market.last_price / 100 :
                        market.yes_bid > 1 ? market.yes_bid / 100 :
                        market.yes_ask / 100;
        const noPrice = 1 - yesPrice;

        samples.push({
          title: market.title || market.ticker,
          ticker: market.ticker,
          yesPrice: yesPrice.toFixed(3),
          noPrice: noPrice.toFixed(3),
          last_price: market.last_price,
        });
      }
    }

    console.log(`\n📊 Results after filtering:`);
    console.log(`   Valid markets: ${validMarkets}`);
    console.log(`   Filtered out - No prices: ${noPriceMarkets}`);
    console.log(`   Filtered out - Closed: ${closedMarkets}`);

    if (samples.length > 0) {
      console.log(`\n✅ Sample valid markets with prices:`);
      samples.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.ticker}`);
        console.log(`      Title: ${m.title.substring(0, 60)}${m.title.length > 60 ? '...' : ''}`);
        console.log(`      Yes: $${m.yesPrice}, No: $${m.noPrice}`);
      });
    }

    return validMarkets;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return 0;
  }
}

async function main() {
  const polyCount = await testFinalPolymarket();
  const kalshiCount = await testFinalKalshi();

  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n✅ Polymarket: ${polyCount} markets available`);
  console.log(`✅ Kalshi: ${kalshiCount} markets available`);

  if (polyCount > 0 && kalshiCount > 0) {
    console.log(`\n🎉 SUCCESS! Both APIs are working correctly!`);
    console.log(`   Your app will now receive real market data`);
  } else if (polyCount > 0) {
    console.log(`\n⚠️ WARNING: Only Polymarket has data`);
    console.log(`   Kalshi markets may have low trading activity`);
  } else if (kalshiCount > 0) {
    console.log(`\n⚠️ WARNING: Only Kalshi has data`);
    console.log(`   Polymarket may not have accepting orders right now`);
  } else {
    console.log(`\n❌ ERROR: No markets available from either platform`);
    console.log(`   This could be a temporary issue or API changes`);
  }
}

main();
