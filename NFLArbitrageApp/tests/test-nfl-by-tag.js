// Search for NFL markets using the NFL tag (450)
// Run with: node test-nfl-by-tag.js

console.log('🏈 NFL MARKETS BY TAG\n');

async function searchPolymarketNFL() {
  console.log('='.repeat(70));
  console.log('POLYMARKET - NFL Markets (Tag 450)');
  console.log('='.repeat(70) + '\n');

  try {
    // Try using tag_id filter
    const responses = [
      {name: 'Using tag_id=450', url: 'https://gamma-api.polymarket.com/markets?tag_id=450&active=true&closed=false&limit=500'},
      {name: 'Using tag_id=1 (general sports)', url: 'https://gamma-api.polymarket.com/markets?tag_id=1&active=true&closed=false&limit=500'},
      {name: 'No filter', url: 'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=500'},
    ];

    for (const {name, url} of responses) {
      console.log(`\nTrying: ${name}`);
      const response = await fetch(url);
      const markets = await response.json();

      console.log(`   Total markets: ${markets.length}`);

      // Filter for NFL
      const nflMarkets = markets.filter(m => {
        const title = (m.question || m.title || '').toLowerCase();
        const hasNFL = title.includes('nfl');
        const hasTeam = ['bills', 'chiefs', 'ravens', '49ers', 'lions', 'eagles', 'cowboys', 'packers'].some(team => title.includes(team));
        return hasNFL || hasTeam;
      });

      console.log(`   NFL markets: ${nflMarkets.length}`);

      if (nflMarkets.length > 0) {
        console.log(`\n   🏈 NFL Markets Found:\n`);

        // Categorize
        const moneylines = [];
        const spreads = [];
        const totals = [];
        const props = [];
        const futures = [];

        nflMarkets.forEach(m => {
          const title = (m.question || m.title || '').toLowerCase();

          if (title.includes('by more than') || title.includes('spread')) {
            spreads.push(m);
          } else if (title.includes('over') || title.includes('under') || title.includes('total points')) {
            totals.push(m);
          } else if (title.includes('yards') || title.includes('touchdown') || title.includes('td')) {
            props.push(m);
          } else if (title.includes('super bowl') || title.includes('playoff') || title.includes('division')) {
            futures.push(m);
          } else if (title.includes(' win') || title.includes(' vs ') || title.includes(' beat ')) {
            moneylines.push(m);
          } else {
            // Default to moneyline if it's a simple game question
            moneylines.push(m);
          }
        });

        console.log(`   Moneylines: ${moneylines.length}`);
        console.log(`   Spreads: ${spreads.length}`);
        console.log(`   Totals: ${totals.length}`);
        console.log(`   Player Props: ${props.length}`);
        console.log(`   Futures: ${futures.length}\n`);

        // Show each category
        if (moneylines.length > 0) {
          console.log(`   ✅ MONEYLINES (what you want):`);
          moneylines.slice(0, 5).forEach((m, i) => {
            console.log(`   ${i + 1}. ${m.question || m.title}`);
            if (m.outcomePrices) {
              try {
                const prices = JSON.parse(m.outcomePrices);
                console.log(`      Prices: Yes=$${prices[0]}, No=$${prices[1]}`);
              } catch (e) {}
            }
          });
          console.log('');
        }

        if (spreads.length > 0) {
          console.log(`   📊 SPREADS:`);
          spreads.slice(0, 5).forEach((m, i) => {
            console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
          });
          console.log('');
        }

        if (futures.length > 0) {
          console.log(`   ⏳ FUTURES:`);
          futures.slice(0, 5).forEach((m, i) => {
            console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
          });
          console.log('');
        }

        if (props.length > 0) {
          console.log(`   ❌ PLAYER PROPS (what you DON'T want):`);
          props.slice(0, 3).forEach((m, i) => {
            console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
          });
          console.log('');
        }

        break; // Stop after first successful find
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function searchKalshiNFL() {
  console.log('\n' + '='.repeat(70));
  console.log('KALSHI - Individual NFL Game Markets');
  console.log('='.repeat(70) + '\n');

  try {
    const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=500';
    const response = await fetch(url);
    const data = await response.json();
    const markets = data.markets || [];

    console.log(`Total markets: ${markets.length}\n`);

    // Filter for NFL
    const nflMarkets = markets.filter(m => {
      const ticker = (m.ticker || '').toLowerCase();
      const title = (m.title || '').toLowerCase();
      return ticker.includes('nfl') || title.includes('nfl');
    });

    console.log(`NFL markets: ${nflMarkets.length}\n`);

    // Categorize by whether it's a single-leg or multi-leg
    const singleLeg = nflMarkets.filter(m => !m.mve_selected_legs || m.mve_selected_legs.length <= 1);
    const multiLeg = nflMarkets.filter(m => m.mve_selected_legs && m.mve_selected_legs.length > 1);

    console.log(`   Single-leg markets: ${singleLeg.length}`);
    console.log(`   Multi-leg (parlays): ${multiLeg.length}\n`);

    if (singleLeg.length > 0) {
      console.log('   ✅ SINGLE-LEG MARKETS:\n');

      // Further categorize single-leg
      const gameWinner = [];
      const spreads = [];
      const totals = [];
      const props = [];

      singleLeg.forEach(m => {
        const title = (m.title || '').toLowerCase();
        const ticker = (m.ticker || '').toLowerCase();

        if (title.includes('spread') || title.includes('wins by')) {
          spreads.push(m);
        } else if (title.includes('over') || title.includes('under') || title.includes('points scored')) {
          totals.push(m);
        } else if (title.includes('yards') || title.includes('touchdown') || title.includes(': ')) {
          props.push(m);
        } else {
          // Likely a game winner market
          gameWinner.push(m);
        }
      });

      console.log(`      Game Winners (moneylines): ${gameWinner.length}`);
      console.log(`      Spreads: ${spreads.length}`);
      console.log(`      Totals: ${totals.length}`);
      console.log(`      Props: ${props.length}\n`);

      if (gameWinner.length > 0) {
        console.log(`      💰 GAME WINNER MARKETS:`);
        gameWinner.slice(0, 10).forEach((m, i) => {
          console.log(`      ${i + 1}. ${m.title}`);
          console.log(`         Ticker: ${m.ticker}`);
          if (m.last_price > 0 && m.last_price < 100) {
            console.log(`         Price: Yes=$${(m.last_price/100).toFixed(4)}, No=$${(1 - m.last_price/100).toFixed(4)}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  await searchPolymarketNFL();
  await searchKalshiNFL();

  console.log('\n\n' + '='.repeat(70));
  console.log('🎯 CONCLUSION');
  console.log('='.repeat(70));
  console.log('\nBased on the findings:');
  console.log('1. If moneylines exist → Build filter to extract them');
  console.log('2. If only spreads exist → Decide if we use spreads or skip NFL');
  console.log('3. Update the API code accordingly\n');
}

main();
