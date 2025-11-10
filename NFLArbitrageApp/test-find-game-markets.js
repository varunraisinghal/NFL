// Find actual NFL game markets by searching all markets
// Run with: node test-find-game-markets.js

console.log('🏈 FINDING NFL GAME MARKETS - Different Approach\n');

async function searchAllMarketsForGameEvents() {
  console.log('='.repeat(70));
  console.log('Searching ALL active markets for NFL game references');
  console.log('='.repeat(70) + '\n');

  try {
    // Get all NFL markets
    const response = await fetch('https://gamma-api.polymarket.com/markets?tag_id=450&active=true&closed=false&limit=500');
    const markets = await response.json();

    console.log(`Total NFL tag markets: ${markets.length}\n`);

    // Look for markets that have event slugs matching game patterns
    const gameMarkets = markets.filter(m => {
      if (!m.events || m.events.length === 0) return false;

      const eventSlug = m.events[0].slug || '';
      const eventTitle = m.events[0].title || '';

      // Game event patterns: "nfl-xxx-yyy-2025-11-09" or "Team vs. Team"
      const isGameEvent = eventSlug.match(/nfl-\w{2,3}-\w{2,3}-\d{4}-\d{2}-\d{2}/) ||
                          eventTitle.includes(' vs. ');

      return isGameEvent;
    });

    console.log(`Markets belonging to game events: ${gameMarkets.length}\n`);

    if (gameMarkets.length > 0) {
      // Group by event
      const byEvent = {};
      gameMarkets.forEach(m => {
        const eventSlug = m.events[0].slug;
        const eventTitle = m.events[0].title;

        if (!byEvent[eventSlug]) {
          byEvent[eventSlug] = {
            title: eventTitle,
            slug: eventSlug,
            markets: []
          };
        }
        byEvent[eventSlug].markets.push(m);
      });

      console.log(`✅ Found ${Object.keys(byEvent).length} games with markets\n`);

      // Show each game's markets
      Object.values(byEvent).slice(0, 5).forEach((game, i) => {
        console.log(`\n${i + 1}. ${game.title}`);
        console.log(`   Slug: ${game.slug}`);
        console.log(`   Markets: ${game.markets.length}\n`);

        // Categorize markets for this game
        const moneylines = [];
        const spreads = [];
        const totals = [];
        const props = [];

        game.markets.forEach(m => {
          const title = (m.question || m.title || '').toLowerCase();

          if (title.includes('by more than') || title.includes('spread')) {
            spreads.push(m);
          } else if (title.includes('over') || title.includes('under') || title.includes('total')) {
            totals.push(m);
          } else if (title.includes('yards') || title.includes('touchdown') || title.includes('passing')) {
            props.push(m);
          } else {
            moneylines.push(m);
          }
        });

        console.log(`      Moneylines: ${moneylines.length}`);
        console.log(`      Spreads: ${spreads.length}`);
        console.log(`      Totals: ${totals.length}`);
        console.log(`      Props: ${props.length}`);

        if (moneylines.length > 0) {
          console.log(`\n      ✅ MONEYLINE:`);
          moneylines.forEach(m => {
            console.log(`         ${m.question || m.title}`);
            if (m.outcomePrices) {
              try {
                const prices = JSON.parse(m.outcomePrices);
                console.log(`         Prices: Yes=$${prices[0]}, No=$${prices[1]}`);
              } catch (e) {}
            }
          });
        }

        if (spreads.length > 0) {
          console.log(`\n      📊 SPREADS:`);
          spreads.slice(0, 2).forEach(m => {
            console.log(`         ${(m.question || m.title).substring(0, 80)}`);
          });
        }
      });

      return byEvent;
    } else {
      console.log('❌ No game markets found in NFL tag markets\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  const games = await searchAllMarketsForGameEvents();

  console.log('\n\n' + '='.repeat(70));
  console.log('🎯 CONCLUSION');
  console.log('='.repeat(70));

  if (games && Object.keys(games).length > 0) {
    console.log(`\n✅ SUCCESS! Found ${Object.keys(games).length} NFL games with markets`);
    console.log('\nApproach:');
    console.log('  1. Fetch markets with tag_id=450 (NFL)');
    console.log('  2. Filter markets where event.slug matches "nfl-xxx-yyy-date" pattern');
    console.log('  3. Group by event');
    console.log('  4. For each game, filter for moneylines only\n');
  } else {
    console.log('\n❌ No NFL game markets accessible via tag_id=450\n');
    console.log('The markets may be:');
    console.log('  1. Not created yet (games are today)');
    console.log('  2. Under a different tag/structure');
    console.log('  3. Require different access method\n');
  }
}

main();
