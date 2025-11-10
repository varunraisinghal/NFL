// Find Kalshi game winner markets (moneylines)
// Based on ticker pattern: KXNFLGAME-25NOV09ATLIND
// Run with: node test-kalshi-game-winners.js

console.log('🏈 KALSHI GAME WINNER MARKETS\n');

async function findGameWinners() {
  console.log('='.repeat(70));
  console.log('Searching for KXNFLGAME Markets');
  console.log('='.repeat(70) + '\n');

  try {
    const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=500';
    const response = await fetch(url);
    const data = await response.json();
    const markets = data.markets || [];

    console.log(`Total markets: ${markets.length}\n`);

    // Look for markets with ticker pattern KXNFLGAME-DATE-TEAMS-TEAM
    const gameWinnerMarkets = markets.filter(m => {
      const ticker = (m.ticker || '').toUpperCase();
      // Pattern: KXNFLGAME-25NOV09ATLIND-ATL or KXNFLGAME-25NOV09ATLIND-IND
      return ticker.match(/^KXNFLGAME-\d+[A-Z]+\d+-[A-Z]+$/);
    });

    console.log(`Game winner markets found: ${gameWinnerMarkets.length}\n`);

    if (gameWinnerMarkets.length > 0) {
      console.log('✅ KALSHI NFL GAME WINNERS (MONEYLINES):\n');

      // Group by game (same event_ticker)
      const byGame = {};
      gameWinnerMarkets.forEach(m => {
        const eventTicker = m.event_ticker || 'unknown';
        if (!byGame[eventTicker]) {
          byGame[eventTicker] = [];
        }
        byGame[eventTicker].push(m);
      });

      console.log(`Number of games: ${Object.keys(byGame).length}\n`);

      // Show each game's markets
      Object.entries(byGame).slice(0, 15).forEach(([eventTicker, markets], i) => {
        console.log(`${i + 1}. Event: ${eventTicker}`);
        console.log(`   Markets: ${markets.length}\n`);

        markets.forEach(m => {
          // Extract team from title or ticker
          const ticker = m.ticker || '';
          const team = ticker.split('-').pop(); // Last part is team abbreviation

          console.log(`   ${team}: ${m.title}`);
          console.log(`      Ticker: ${m.ticker}`);

          // Get price
          let price = null;
          if (m.last_price > 0 && m.last_price < 100) {
            price = m.last_price / 100;
          } else if (m.yes_bid > 0 && m.yes_bid < 100) {
            price = m.yes_bid / 100;
          } else if (m.yes_ask > 0 && m.yes_ask < 100) {
            price = m.yes_ask / 100;
          }

          if (price) {
            console.log(`      Price: Yes=$${price.toFixed(3)}, No=$${(1 - price).toFixed(3)}`);
          } else {
            console.log(`      Price: Not available (bid=${m.yes_bid}, ask=${m.yes_ask}, last=${m.last_price})`);
          }
        });

        console.log('');
      });

      return byGame;
    } else {
      console.log('❌ No KXNFLGAME markets found\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  const games = await findGameWinners();

  console.log('\n' + '='.repeat(70));
  console.log('🎯 SUMMARY');
  console.log('='.repeat(70));

  if (games && Object.keys(games).length > 0) {
    console.log(`\n✅ SUCCESS! Found ${Object.keys(games).length} NFL games on Kalshi`);
    console.log('\nStructure:');
    console.log('  • Each game has 2 markets (one per team)');
    console.log('  • Ticker pattern: KXNFLGAME-25NOV09ATLIND-ATL');
    console.log('  • Event ticker groups the two markets');
    console.log('\nUsage:');
    console.log('  • Filter by: ticker.match(/^KXNFLGAME-/)');
    console.log('  • Group by: event_ticker');
    console.log('  • Extract team: ticker.split(\'-\').pop()\n');
  } else {
    console.log('\n❌ No game winner markets found\n');
  }
}

main();
