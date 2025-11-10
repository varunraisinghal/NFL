// Explore Gamma API sports and events structure
// Run with: node test-gamma-sports.js

console.log('🔍 GAMMA API SPORTS EXPLORATION\n');

async function exploreSports() {
  console.log('='.repeat(70));
  console.log('/sports ENDPOINT - Full Structure');
  console.log('='.repeat(70) + '\n');

  try {
    const response = await fetch('https://gamma-api.polymarket.com/sports');
    const sports = await response.json();

    console.log(`Total sports: ${sports.length}\n`);

    // Show full structure
    console.log('Full structure of all sports:\n');
    sports.forEach((sport, i) => {
      console.log(`${i + 1}. ${JSON.stringify(sport, null, 2)}`);
    });

    return sports;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function exploreEvents() {
  console.log('\n\n' + '='.repeat(70));
  console.log('/events ENDPOINT - Check for NFL');
  console.log('='.repeat(70) + '\n');

  try {
    const response = await fetch('https://gamma-api.polymarket.com/events?limit=100');
    const data = await response.json();

    console.log(`Total events: ${data.length || 'unknown'}\n`);

    if (Array.isArray(data)) {
      // Look for sports-related events
      const sportsEvents = data.filter(e => {
        const title = (e.title || '').toLowerCase();
        return title.includes('nfl') || title.includes('nba') || title.includes('football') ||
               title.includes('basketball') || title.includes('baseball');
      });

      console.log(`Sports-related events: ${sportsEvents.length}\n`);

      if (sportsEvents.length > 0) {
        sportsEvents.slice(0, 10).forEach((e, i) => {
          console.log(`${i + 1}. ${e.title}`);
          console.log(`   Markets: ${e.markets?.length || 0}`);
          console.log(`   Tags: ${e.tags?.join(', ') || 'N/A'}`);
          console.log('');
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function searchMarketsByTag() {
  console.log('\n\n' + '='.repeat(70));
  console.log('SEARCHING MARKETS - By Various Filters');
  console.log('='.repeat(70) + '\n');

  const searches = [
    {name: 'All active markets', url: 'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=100'},
    {name: 'Search for "win"', url: 'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=500'},
  ];

  for (const search of searches) {
    console.log(`\n${search.name}:`);

    try {
      const response = await fetch(search.url);
      const markets = await response.json();

      console.log(`   Total: ${markets.length}`);

      // Analyze tags
      const allTags = new Set();
      markets.forEach(m => {
        if (m.tags) {
          m.tags.forEach(tag => allTags.add(tag));
        }
      });

      console.log(`   Unique tags: ${allTags.size}`);
      if (allTags.size > 0) {
        const tagsArray = Array.from(allTags).slice(0, 20);
        console.log(`   Sample tags: ${tagsArray.join(', ')}`);
      }

      // Look for sports-like patterns
      const gameLike = markets.filter(m => {
        const title = (m.question || m.title || '').toLowerCase();
        return (title.includes(' win') && !title.includes('super bowl')) ||
               title.includes(' vs ') ||
               title.includes(' beat ');
      });

      console.log(`   Game-like markets (has "win", "vs", "beat"): ${gameLike.length}`);

      if (gameLike.length > 0) {
        console.log(`\n   Samples:`);
        gameLike.slice(0, 5).forEach((m, i) => {
          console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 80)}`);
          console.log(`      Tags: ${m.tags?.join(', ') || 'none'}`);
        });
      }

    } catch (error) {
      console.error(`   Error: ${error.message}`);
    }
  }
}

async function main() {
  await exploreSports();
  await exploreEvents();
  await searchMarketsByTag();

  console.log('\n\n' + '='.repeat(70));
  console.log('📝 SUMMARY');
  console.log('='.repeat(70));
  console.log('\nBased on this exploration, we can determine:');
  console.log('1. Whether NFL markets exist on Polymarket');
  console.log('2. What the structure looks like for game moneylines');
  console.log('3. How to filter for moneylines vs props\n');
}

main();
