// Find the exact Jacksonville vs Houston game on both platforms
// Run with: node test-find-jax-houston.js

console.log('🔍 SEARCHING FOR JAGUARS VS TEXANS GAME\n');

async function findJaxHouston() {
  // 1. Get Polymarket game
  console.log('1️⃣ POLYMARKET:\n');
  const polyUrl = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=moneyline&active=true&closed=false&limit=100';
  const polyResponse = await fetch(polyUrl);
  const polyMarkets = await polyResponse.json();

  const jaxHoustonPoly = polyMarkets.filter(m => {
    const title = (m.question || m.title || '').toLowerCase();
    return (title.includes('jaguars') || title.includes('jacksonville')) &&
           (title.includes('texans') || title.includes('houston'));
  });

  console.log(`Found ${jaxHoustonPoly.length} Jaguars/Texans markets on Polymarket:\n`);
  jaxHoustonPoly.forEach((m, i) => {
    const prices = JSON.parse(m.outcomePrices || '["0.5", "0.5"]');
    console.log(`${i + 1}. ${m.question || m.title}`);
    console.log(`   Slug: ${m.slug}`);
    console.log(`   Yes: ${(parseFloat(prices[0]) * 100).toFixed(2)}%`);
    console.log(`   No:  ${(parseFloat(prices[1]) * 100).toFixed(2)}%\n`);
  });

  // 2. Get ALL Kalshi events
  console.log('\n2️⃣ KALSHI:\n');
  const kalshiUrl = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLGAME&status=open&with_nested_markets=true&limit=100';
  const kalshiResponse = await fetch(kalshiUrl);
  const kalshiData = await kalshiResponse.json();
  const kalshiEvents = kalshiData.events || [];

  console.log(`Total Kalshi events: ${kalshiEvents.length}\n`);

  // Search for Jacksonville or Houston
  const jaxHoustonKalshi = kalshiEvents.filter(e => {
    const title = (e.title || '').toLowerCase();
    return (title.includes('jacksonville') && title.includes('houston')) ||
           (title.includes('jacksonville') || title.includes('houston'));
  });

  console.log(`Found ${jaxHoustonKalshi.length} events mentioning Jacksonville or Houston:\n`);
  jaxHoustonKalshi.forEach((e, i) => {
    console.log(`${i + 1}. ${e.title}`);
    console.log(`   Ticker: ${e.event_ticker}`);
    console.log(`   Markets: ${e.markets?.length || 0}`);

    if (e.markets && e.markets.length > 0) {
      e.markets.forEach((m, j) => {
        const price = m.yes_bid || m.last_price || 0;
        console.log(`      ${j + 1}. ${m.ticker}: ${price}¢`);
      });
    }
    console.log('');
  });

  // 3. List ALL Kalshi games to see what's available
  console.log('\n3️⃣ ALL KALSHI NFL GAMES (first 10):\n');
  kalshiEvents.slice(0, 10).forEach((e, i) => {
    console.log(`${i + 1}. ${e.title} (${e.event_ticker})`);
  });

  console.log('\n\n' + '='.repeat(70));
  console.log('💡 DIAGNOSIS');
  console.log('='.repeat(70) + '\n');

  if (jaxHoustonPoly.length > 0 && jaxHoustonKalshi.length === 0) {
    console.log('❌ ISSUE FOUND:');
    console.log('   Polymarket HAS the Jaguars vs Texans game');
    console.log('   Kalshi DOES NOT have this game\n');
    console.log('   Possible reasons:');
    console.log('   1. Game not available on Kalshi yet');
    console.log('   2. Different game schedule between platforms');
    console.log('   3. Kalshi uses different naming\n');
  } else if (jaxHoustonPoly.length > 0 && jaxHoustonKalshi.length > 0) {
    console.log('✅ BOTH PLATFORMS HAVE THE GAME');
    console.log('   This should match in the app!\n');
  } else {
    console.log('⚠️ Game not found on Polymarket or name mismatch\n');
  }
}

findJaxHouston().catch(err => console.error('Error:', err.message));
