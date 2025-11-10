// Check Kalshi for individual game moneylines
// Run with: node test-kalshi-moneylines.js

console.log('🏈 KALSHI NFL MONEYLINES\n');

async function checkKalshiMoneylines() {
  console.log('='.repeat(70));
  console.log('Searching for Individual NFL Game Markets');
  console.log('='.repeat(70) + '\n');

  try {
    const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=500';
    const response = await fetch(url);
    const data = await response.json();
    const markets = data.markets || [];

    // Filter for NFL markets
    const nflMarkets = markets.filter(m => {
      const ticker = (m.ticker || '').toLowerCase();
      return ticker.includes('nfl');
    });

    console.log(`Total NFL markets: ${nflMarkets.length}\n`);

    // Separate single-leg from multi-leg
    const singleLeg = nflMarkets.filter(m => !m.mve_selected_legs || m.mve_selected_legs.length <= 1);
    const multiLeg = nflMarkets.filter(m => m.mve_selected_legs && m.mve_selected_legs.length > 1);

    console.log(`Single-leg markets: ${singleLeg.length}`);
    console.log(`Multi-leg (parlays): ${multiLeg.length}\n`);

    if (singleLeg.length > 0) {
      console.log('✅ SINGLE-LEG NFL MARKETS:\n');

      // Look for game winner markets (moneylines)
      const gameWinners = singleLeg.filter(m => {
        const title = (m.title || '').toLowerCase();
        const ticker = (m.ticker || '').toLowerCase();

        // Exclude spreads, totals, props
        if (title.includes('spread') || title.includes('wins by') ||
            title.includes('over') || title.includes('under') ||
            title.includes('points scored') ||
            title.includes('yards') || title.includes('touchdown') ||
            title.includes(':')) {
          return false;
        }

        // Simple game ticker pattern like "KXNFLGAME-25NOV09BUFMIA-BUF"
        return ticker.match(/nflgame-\d+[a-z]+\d+[a-z]+[a-z]+-[a-z]+$/i);
      });

      console.log(`Game winner markets (moneylines): ${gameWinners.length}\n`);

      if (gameWinners.length > 0) {
        gameWinners.slice(0, 15).forEach((m, i) => {
          console.log(`${i + 1}. ${m.title}`);
          console.log(`   Ticker: ${m.ticker}`);
          if (m.last_price > 0 && m.last_price < 100) {
            const yesPrice = m.last_price / 100;
            console.log(`   Price: Yes=$${yesPrice.toFixed(3)}, No=$${(1 - yesPrice).toFixed(3)}`);
          } else if (m.yes_bid > 0 && m.yes_bid < 100) {
            const yesPrice = m.yes_bid / 100;
            console.log(`   Price (bid): Yes=$${yesPrice.toFixed(3)}, No=$${(1 - yesPrice).toFixed(3)}`);
          }
          console.log('');
        });
      }
    } else {
      console.log('❌ No single-leg NFL markets found\n');
      console.log('Kalshi only has parlays/multi-leg markets for NFL\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  await checkKalshiMoneylines();

  console.log('\n' + '='.repeat(70));
  console.log('🎯 CONCLUSION');
  console.log('='.repeat(70));
  console.log('\n✅ POLYMARKET: Has 13 moneyline markets (one per game)');
  console.log('   Format: "Team A vs. Team B" → Yes=Team A wins, No=Team B wins');
  console.log('\n❓ KALSHI: Checking for individual game moneylines...\n');
}

main();
