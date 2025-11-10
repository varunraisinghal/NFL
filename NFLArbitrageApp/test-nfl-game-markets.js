// Find NFL game markets (not futures) on Polymarket
// Based on website showing: polymarket.com/sports/nfl/games
// Run with: node test-nfl-game-markets.js

console.log('🏈 FINDING NFL GAME MONEYLINES\n');

async function tryEventsEndpoint() {
  console.log('='.repeat(70));
  console.log('Method 1: /events Endpoint with NFL Filter');
  console.log('='.repeat(70) + '\n');

  try {
    // Try events endpoint
    const response = await fetch('https://gamma-api.polymarket.com/events?limit=200');
    const events = await response.json();

    console.log(`Total events: ${events.length}\n`);

    // Filter for NFL game events (not futures)
    const nflGameEvents = events.filter(e => {
      const title = (e.title || '').toLowerCase();
      // Look for "vs" pattern which indicates a game, not futures
      return title.includes('nfl') && (title.includes(' vs ') || title.includes(' vs.'));
    });

    console.log(`NFL game events (with "vs"): ${nflGameEvents.length}\n`);

    if (nflGameEvents.length > 0) {
      console.log('✅ FOUND NFL GAME EVENTS:\n');
      nflGameEvents.slice(0, 10).forEach((e, i) => {
        console.log(`${i + 1}. ${e.title}`);
        console.log(`   Slug: ${e.slug}`);
        console.log(`   Markets: ${e.markets?.length || 0}`);
        console.log(`   Start: ${e.startDate || 'N/A'}`);
        console.log('');
      });

      // If events have markets, show them
      if (nflGameEvents[0].markets && nflGameEvents[0].markets.length > 0) {
        console.log('\nMarkets in first event:');
        nflGameEvents[0].markets.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.question || m.title}`);
        });
      }

      return nflGameEvents;
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function trySeriesEndpoint() {
  console.log('\n\n' + '='.repeat(70));
  console.log('Method 2: /series Endpoint (10187 = NFL)');
  console.log('='.repeat(70) + '\n');

  try {
    // Try series endpoint (NFL series ID is 10187 from sports endpoint)
    const seriesUrl = 'https://gamma-api.polymarket.com/series/10187';

    console.log(`Trying: ${seriesUrl}\n`);

    const response = await fetch(seriesUrl);
    const data = await response.json();

    console.log('Response structure:', Object.keys(data));
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function searchByEventPattern() {
  console.log('\n\n' + '='.repeat(70));
  console.log('Method 3: Search Markets for Team Names');
  console.log('='.repeat(70) + '\n');

  try {
    // Fetch all NFL tag markets
    const response = await fetch('https://gamma-api.polymarket.com/markets?tag_id=450&active=true&closed=false&limit=500');
    const markets = await response.json();

    console.log(`Total NFL markets: ${markets.length}\n`);

    // Look for patterns that indicate game markets vs futures
    const teamNames = ['falcons', 'colts', 'jaguars', 'texans', 'ravens', 'vikings', 'bills', 'dolphins'];

    const gameMarkets = markets.filter(m => {
      const title = (m.question || m.title || '').toLowerCase();

      // Exclude futures keywords
      if (title.includes('super bowl') ||
          title.includes('championship') ||
          title.includes('playoff') ||
          title.includes('division') ||
          title.includes('win the')) {
        return false;
      }

      // Look for team matchups or simple "will X beat Y" patterns
      const hasVs = title.includes(' vs ') || title.includes(' vs.');
      const hasBeat = title.includes(' beat ') && !title.includes('championship');
      const hasWin = title.includes('will the') && title.includes(' win') && !title.includes('win the');

      return hasVs || hasBeat || hasWin;
    });

    console.log(`Game markets found: ${gameMarkets.length}\n`);

    if (gameMarkets.length > 0) {
      console.log('✅ GAME MARKETS:\n');
      gameMarkets.slice(0, 15).forEach((m, i) => {
        console.log(`${i + 1}. ${m.question || m.title}`);
        if (m.outcomePrices) {
          try {
            const prices = JSON.parse(m.outcomePrices);
            console.log(`   Prices: Yes=$${prices[0]}, No=$${prices[1]}`);
          } catch (e) {}
        }
        console.log(`   Event: ${m.events?.[0]?.slug || 'N/A'}`);
        console.log('');
      });

      // Group by event if possible
      const byEvent = {};
      gameMarkets.forEach(m => {
        const eventSlug = m.events?.[0]?.slug || 'unknown';
        if (!byEvent[eventSlug]) byEvent[eventSlug] = [];
        byEvent[eventSlug].push(m);
      });

      console.log('\n📊 Markets grouped by event:');
      Object.entries(byEvent).slice(0, 5).forEach(([event, markets]) => {
        console.log(`\n${event}: ${markets.length} markets`);
        markets.forEach((m, i) => {
          console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 60)}`);
        });
      });

      return gameMarkets;
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  const eventsResults = await tryEventsEndpoint();
  await trySeriesEndpoint();
  const marketResults = await searchByEventPattern();

  console.log('\n\n' + '='.repeat(70));
  console.log('🎯 SUMMARY');
  console.log('='.repeat(70));

  if (marketResults && marketResults.length > 0) {
    console.log(`\n✅ SUCCESS! Found ${marketResults.length} NFL game markets`);
    console.log('\nThese are individual game moneylines like:');
    console.log('  • Falcons vs Colts');
    console.log('  • Bills vs Dolphins');
    console.log('  • Ravens vs Vikings');
    console.log('\nNext: Filter to get ONLY moneylines (exclude spreads/totals/props)\n');
  } else {
    console.log('\n❌ Need to explore further to find game markets\n');
  }
}

main();
