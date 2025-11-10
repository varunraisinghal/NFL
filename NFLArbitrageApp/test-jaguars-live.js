// Check if Jaguars vs Texans is matching correctly in live data
// Run with: node test-jaguars-live.js

console.log('🏈 CHECKING JAGUARS VS TEXANS IN LIVE DATA\n');

async function checkJaguarsGame() {
  console.log('='.repeat(70));
  console.log('FETCHING LIVE DATA');
  console.log('='.repeat(70) + '\n');

  // Fetch Polymarket
  console.log('1️⃣ Polymarket NFL Moneylines:\n');
  const polyUrl = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=moneyline&active=true&closed=false&limit=100';
  const polyResponse = await fetch(polyUrl);
  const polyMarkets = await polyResponse.json();

  const jaguarsMarket = polyMarkets.find(m =>
    (m.question || m.title || '').toLowerCase().includes('jaguars') ||
    (m.question || m.title || '').toLowerCase().includes('jacksonville')
  );

  if (jaguarsMarket) {
    console.log('✅ FOUND Jaguars game on Polymarket!');
    console.log(`   Title: ${jaguarsMarket.question || jaguarsMarket.title}`);
    console.log(`   Slug: ${jaguarsMarket.slug}`);

    const prices = JSON.parse(jaguarsMarket.outcomePrices || '["0.5", "0.5"]');
    console.log(`   Prices: Yes=${(parseFloat(prices[0]) * 100).toFixed(2)}%, No=${(parseFloat(prices[1]) * 100).toFixed(2)}%\n`);
  } else {
    console.log('❌ Jaguars game NOT FOUND on Polymarket\n');
  }

  // Fetch Kalshi
  console.log('2️⃣ Kalshi NFL Game Events:\n');
  const kalshiUrl = 'https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLGAME&status=open&with_nested_markets=true&limit=100';
  const kalshiResponse = await fetch(kalshiUrl);
  const kalshiData = await kalshiResponse.json();
  const kalshiEvents = kalshiData.events || [];

  const jaguarsEvent = kalshiEvents.find(e =>
    (e.title || '').toLowerCase().includes('jacksonville') ||
    (e.title || '').toLowerCase().includes('houston')
  );

  if (jaguarsEvent) {
    console.log('✅ FOUND Jaguars/Texans game on Kalshi!');
    console.log(`   Title: ${jaguarsEvent.title}`);
    console.log(`   Ticker: ${jaguarsEvent.event_ticker}`);
    console.log(`   Markets: ${jaguarsEvent.markets?.length || 0}\n`);

    if (jaguarsEvent.markets && jaguarsEvent.markets.length > 0) {
      console.log('   Market details:');
      jaguarsEvent.markets.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.ticker}`);
        console.log(`      ${m.title}`);
        const price = m.yes_bid || m.last_price || 0;
        console.log(`      Price: ${price}¢ (${price}%)\n`);
      });
    }
  } else {
    console.log('❌ Jaguars/Texans game NOT FOUND on Kalshi\n');
  }

  // Check if they would match
  console.log('\n' + '='.repeat(70));
  console.log('MATCHING CHECK');
  console.log('='.repeat(70) + '\n');

  if (jaguarsMarket && jaguarsEvent) {
    console.log('✅ Both platforms have the game!');
    console.log('\nPolymarket teams extraction:');
    console.log(`   Title: "${jaguarsMarket.question || jaguarsMarket.title}"`);
    console.log('   Expected: Jaguars (JAX), Texans (HOU)');

    console.log('\nKalshi teams extraction:');
    console.log(`   Title: "${jaguarsEvent.title}"`);
    console.log('   Expected: Jaguars (JAX), Texans (HOU)');

    console.log('\n🎯 These should match with game key: HOU-JAX or JAX-HOU');

    // Calculate potential arbitrage
    const polyYes = parseFloat(JSON.parse(jaguarsMarket.outcomePrices)[0]);
    const polyNo = parseFloat(JSON.parse(jaguarsMarket.outcomePrices)[1]);

    console.log('\n' + '='.repeat(70));
    console.log('ARBITRAGE CALCULATION');
    console.log('='.repeat(70) + '\n');

    jaguarsEvent.markets?.forEach((kalshiMarket, idx) => {
      const kalshiYes = (kalshiMarket.yes_bid || kalshiMarket.last_price || 50) / 100;
      const kalshiNo = 1 - kalshiYes;

      const team = kalshiMarket.ticker.split('-').pop();

      console.log(`Option ${idx + 1}: ${team} market`);
      console.log(`   Poly: Yes=${(polyYes * 100).toFixed(2)}%, No=${(polyNo * 100).toFixed(2)}%`);
      console.log(`   Kalshi: Yes=${(kalshiYes * 100).toFixed(2)}%, No=${(kalshiNo * 100).toFixed(2)}%`);

      const costA = polyYes + kalshiNo;
      const costB = polyNo + kalshiYes;

      console.log(`   Cost A (Poly Yes + Kalshi No): ${costA.toFixed(4)}`);
      console.log(`   Cost B (Poly No + Kalshi Yes): ${costB.toFixed(4)}`);

      if (costA < 1) {
        const profit = (1 - costA) * 100;
        console.log(`   💰 ARBITRAGE A: ${profit.toFixed(4)}%`);
      }
      if (costB < 1) {
        const profit = (1 - costB) * 100;
        console.log(`   💰 ARBITRAGE B: ${profit.toFixed(4)}%`);
      }
      if (costA >= 1 && costB >= 1) {
        console.log(`   ❌ No arbitrage`);
      }
      console.log('');
    });

  } else {
    console.log('❌ Game not found on both platforms - cannot match');
  }
}

checkJaguarsGame().catch(err => {
  console.error('Error:', err.message);
});
