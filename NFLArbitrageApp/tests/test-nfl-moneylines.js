// Find NFL moneyline markets on Polymarket and Kalshi
// Run with: node test-nfl-moneylines.js

console.log('🏈 FINDING NFL MONEYLINE MARKETS\n');

async function explorePolymarketNFL() {
  console.log('='.repeat(70));
  console.log('POLYMARKET - NFL Market Exploration');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Get sports metadata to find NFL tag
    console.log('Step 1: Fetching sports metadata...');
    const sportsResponse = await fetch('https://gamma-api.polymarket.com/sports');
    const sports = await sportsResponse.json();

    console.log(`Found ${sports.length} sports\n`);

    // Find NFL sport
    const nfl = sports.find(s => s.name?.toLowerCase().includes('nfl') || s.slug?.toLowerCase().includes('nfl'));

    if (!nfl) {
      console.log('❌ NFL not found in sports metadata');
      console.log('Available sports:', sports.map(s => s.name || s.slug).slice(0, 10).join(', '));
      console.log('\n');
      return;
    }

    console.log(`✅ Found NFL sport:`);
    console.log(`   Name: ${nfl.name}`);
    console.log(`   Slug: ${nfl.slug}`);
    console.log(`   Tag ID: ${nfl.id || nfl.tag_id || 'N/A'}`);
    console.log(`\n`);

    // Step 2: Fetch NFL markets using tag
    console.log('Step 2: Fetching NFL markets...');
    let marketsUrl;
    if (nfl.id) {
      marketsUrl = `https://gamma-api.polymarket.com/markets?tag_id=${nfl.id}&active=true&closed=false&limit=500`;
    } else {
      // Fallback: search by keyword
      marketsUrl = `https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=500`;
    }

    const response = await fetch(marketsUrl);
    let markets = await response.json();

    // If we didn't use tag_id, filter manually
    if (!nfl.id) {
      const nflKeywords = ['nfl', 'football', 'super bowl'];
      markets = markets.filter(m => {
        const title = (m.question || m.title || '').toLowerCase();
        return nflKeywords.some(k => title.includes(k));
      });
    }

    const nflMarkets = markets;
    console.log(`NFL markets found: ${nflMarkets.length}\n`);

    if (nflMarkets.length === 0) {
      console.log('❌ No NFL markets found. They may be seasonal.\n');
      return;
    }

    // Categorize NFL markets
    const categories = {
      moneyline: [],
      playerProps: [],
      gameProps: [],
      futures: [],
      other: [],
    };

    const propKeywords = ['yards', 'touchdown', 'td', 'passing', 'rushing', 'receiving',
                          'interception', 'sack', 'points', 'over', 'under', 'spread'];
    const futureKeywords = ['win super bowl', 'make playoffs', 'division', 'conference',
                            'mvp', 'rookie of the year', 'season'];

    nflMarkets.forEach(m => {
      const title = (m.question || m.title || '').toLowerCase();

      // Check if it's a future
      if (futureKeywords.some(k => title.includes(k))) {
        categories.futures.push(m);
      }
      // Check if it's a player prop
      else if (propKeywords.some(k => title.includes(k))) {
        categories.playerProps.push(m);
      }
      // Check if it looks like a moneyline (simple "will X win" or "X vs Y")
      else if (title.includes(' win') || title.includes(' vs ') || title.includes(' beat ')) {
        categories.moneyline.push(m);
      }
      // Game props (not player-specific)
      else if (title.includes('game') || title.includes('match')) {
        categories.gameProps.push(m);
      }
      else {
        categories.other.push(m);
      }
    });

    console.log('📊 NFL Market Categories:');
    console.log(`   Moneylines: ${categories.moneyline.length}`);
    console.log(`   Player Props: ${categories.playerProps.length}`);
    console.log(`   Game Props: ${categories.gameProps.length}`);
    console.log(`   Futures: ${categories.futures.length}`);
    console.log(`   Other: ${categories.other.length}\n`);

    // Show moneyline examples
    if (categories.moneyline.length > 0) {
      console.log('✅ MONEYLINE MARKETS (what you want):');
      categories.moneyline.slice(0, 10).forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.question || m.title}`);
        console.log(`      ID: ${m.id}`);
        console.log(`      Slug: ${m.slug || 'N/A'}`);
        console.log(`      End Date: ${m.endDate || 'N/A'}`);
        if (m.outcomePrices) {
          try {
            const prices = JSON.parse(m.outcomePrices);
            console.log(`      Prices: Yes=$${prices[0]}, No=$${prices[1]}`);
          } catch (e) {
            console.log(`      Prices: ${m.outcomePrices}`);
          }
        }
        console.log(`      Event: ${m.events?.[0]?.title || 'N/A'}`);
      });
    }

    // Show player prop examples
    if (categories.playerProps.length > 0) {
      console.log('\n\n❌ PLAYER PROPS (what you DON\'T want):');
      categories.playerProps.slice(0, 5).forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.question || m.title}`);
      });
    }

    // Show futures examples
    if (categories.futures.length > 0) {
      console.log('\n\n⏳ FUTURES (what you DON\'T want):');
      categories.futures.slice(0, 5).forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.question || m.title}`);
      });
    }

    console.log('\n');
    return categories;

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function exploreKalshiNFL() {
  console.log('='.repeat(70));
  console.log('KALSHI - NFL Market Exploration');
  console.log('='.repeat(70) + '\n');

  const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=500';

  try {
    const response = await fetch(url);
    const data = await response.json();
    const markets = data.markets || [];

    console.log(`Total markets fetched: ${markets.length}\n`);

    // Filter for NFL markets
    const nflMarkets = markets.filter(m => {
      const title = (m.title || m.ticker || '').toLowerCase();
      const ticker = (m.ticker || '').toLowerCase();
      return title.includes('nfl') || ticker.includes('nfl');
    });

    console.log(`NFL-related markets found: ${nflMarkets.length}\n`);

    if (nflMarkets.length === 0) {
      console.log('❌ No NFL markets found. They may be seasonal.\n');
      return;
    }

    // Categorize
    const categories = {
      gameMoneyline: [],
      playerProps: [],
      parlays: [],
      spreads: [],
      totals: [],
      other: [],
    };

    nflMarkets.forEach(m => {
      const title = (m.title || '').toLowerCase();
      const ticker = (m.ticker || '').toLowerCase();

      // Check for parlays (multivariate events)
      if (m.mve_selected_legs && m.mve_selected_legs.length > 1) {
        categories.parlays.push(m);
      }
      // Check for spreads
      else if (title.includes('spread') || title.includes('wins by')) {
        categories.spreads.push(m);
      }
      // Check for totals
      else if (title.includes('over') || title.includes('under') || title.includes('points scored')) {
        categories.totals.push(m);
      }
      // Check for player props
      else if (title.includes('yards') || title.includes('touchdown') || title.includes(': ')) {
        categories.playerProps.push(m);
      }
      // Simple game outcomes (moneylines)
      else if (!title.includes('parlay') && !title.includes('combo')) {
        categories.gameMoneyline.push(m);
      }
      else {
        categories.other.push(m);
      }
    });

    console.log('📊 Kalshi NFL Market Categories:');
    console.log(`   Game Moneylines: ${categories.gameMoneyline.length}`);
    console.log(`   Player Props: ${categories.playerProps.length}`);
    console.log(`   Parlays: ${categories.parlays.length}`);
    console.log(`   Spreads: ${categories.spreads.length}`);
    console.log(`   Totals: ${categories.totals.length}`);
    console.log(`   Other: ${categories.other.length}\n`);

    // Show moneyline examples
    if (categories.gameMoneyline.length > 0) {
      console.log('✅ GAME MONEYLINES (what you want):');
      categories.gameMoneyline.slice(0, 10).forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.title || m.ticker}`);
        console.log(`      Ticker: ${m.ticker}`);
        console.log(`      Status: ${m.status}`);
        if (m.last_price > 0 && m.last_price < 100) {
          console.log(`      Price: Yes=$${(m.last_price/100).toFixed(4)}, No=$${(1 - m.last_price/100).toFixed(4)}`);
        }
        console.log(`      Event: ${m.event_ticker || 'N/A'}`);
      });
    }

    // Show what NOT to include
    if (categories.parlays.length > 0) {
      console.log('\n\n❌ PARLAYS (what you DON\'T want):');
      categories.parlays.slice(0, 3).forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.title}`);
      });
    }

    if (categories.playerProps.length > 0) {
      console.log('\n\n❌ PLAYER PROPS (what you DON\'T want):');
      categories.playerProps.slice(0, 3).forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.title}`);
      });
    }

    console.log('\n');
    return categories;

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  await explorePolymarketNFL();
  await exploreKalshiNFL();

  console.log('='.repeat(70));
  console.log('📝 NEXT STEPS');
  console.log('='.repeat(70));
  console.log('\nBased on the results above, I will:');
  console.log('1. Identify exact patterns for NFL moneylines');
  console.log('2. Create filters to exclude props, parlays, spreads, totals');
  console.log('3. Update the API code to fetch only moneylines');
  console.log('4. Verify we get clean YES/NO pairs for each game\n');
}

main();
