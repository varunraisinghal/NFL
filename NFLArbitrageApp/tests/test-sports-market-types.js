// Test sports_market_types parameter to get moneylines
// Run with: node test-sports-market-types.js

console.log('🏈 TESTING sports_market_types PARAMETER\n');

async function testMarketTypes() {
  console.log('='.repeat(70));
  console.log('Testing different sports_market_types values');
  console.log('='.repeat(70) + '\n');

  const types = ['moneyline', 'spread', 'total', 'prop'];

  for (const type of types) {
    console.log(`\nTrying sports_market_types=${type}:`);

    const url = `https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=${type}&active=true&closed=false&limit=50`;

    try {
      const response = await fetch(url);
      const markets = await response.json();

      console.log(`   Found ${markets.length} markets`);

      if (markets.length > 0) {
        console.log(`\n   Sample markets:`);
        markets.slice(0, 5).forEach((m, i) => {
          console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
          console.log(`      Type: ${m.sportsMarketType || 'N/A'}`);
          console.log(`      Game ID: ${m.gameId || 'N/A'}`);
          if (m.outcomePrices) {
            try {
              const prices = JSON.parse(m.outcomePrices);
              console.log(`      Prices: Yes=$${prices[0]}, No=$${prices[1]}`);
            } catch (e) {}
          }
        });
      }
    } catch (error) {
      console.error(`   Error: ${error.message}`);
    }
  }
}

async function getMoneylinesByGameId() {
  console.log('\n\n' + '='.repeat(70));
  console.log('Get All Moneylines and Group by Game');
  console.log('='.repeat(70) + '\n');

  try {
    const url = 'https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=moneyline&active=true&closed=false&limit=100';

    const response = await fetch(url);
    const markets = await response.json();

    console.log(`Total moneyline markets: ${markets.length}\n`);

    if (markets.length === 0) {
      console.log('No moneyline markets found');
      return;
    }

    // Group by game_id
    const byGame = {};
    markets.forEach(m => {
      const gameId = m.gameId || 'unknown';
      if (!byGame[gameId]) {
        byGame[gameId] = {
          gameId: gameId,
          markets: []
        };
      }
      byGame[gameId].markets.push(m);
    });

    console.log(`Games with moneylines: ${Object.keys(byGame).length}\n`);

    // Show each game
    Object.values(byGame).forEach((game, i) => {
      console.log(`\n${i + 1}. Game ID: ${game.gameId}`);
      console.log(`   Markets: ${game.markets.length}`);

      game.markets.forEach((m, j) => {
        console.log(`\n   ${j + 1}. ${m.question || m.title}`);
        console.log(`      Slug: ${m.slug}`);
        if (m.outcomePrices) {
          try {
            const prices = JSON.parse(m.outcomePrices);
            console.log(`      Prices: Yes=$${prices[0]}, No=$${prices[1]}`);
          } catch (e) {}
        }
        if (m.events && m.events.length > 0) {
          console.log(`      Event: ${m.events[0].title || m.events[0].slug}`);
        }
      });
    });

    return byGame;

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  await testMarketTypes();
  const games = await getMoneylinesByGameId();

  console.log('\n\n' + '='.repeat(70));
  console.log('🎯 SUMMARY');
  console.log('='.repeat(70));

  if (games && Object.keys(games).length > 0) {
    console.log(`\n✅ SUCCESS! Found ${Object.keys(games).length} games with moneylines`);
    console.log('\nUsage:');
    console.log('  Endpoint: /markets?tag_id=450&sports_market_types=moneyline');
    console.log('  Returns: All NFL moneyline markets');
    console.log('  Group by: gameId field\n');
  } else {
    console.log('\n❌ No moneyline markets found');
    console.log('Possible reasons:');
    console.log('  - Markets created closer to game time');
    console.log('  - Different parameter value needed');
    console.log('  - Feature not yet enabled\n');
  }
}

main();
