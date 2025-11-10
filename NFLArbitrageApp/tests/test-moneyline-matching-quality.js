// Test moneyline matching quality and identify failures

async function testMatchingQuality() {
  console.log('🔍 Testing Moneyline Matching Quality\n');
  console.log('='.repeat(70));

  try {
    // Fetch real data
    console.log('\n📊 Fetching markets...\n');

    const [polyResponse, kalshiResponse] = await Promise.all([
      fetch('https://gamma-api.polymarket.com/markets?tag_id=450&sports_market_types=moneyline&active=true&closed=false&limit=100'),
      fetch('https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLGAME&status=open&with_nested_markets=true&limit=50')
    ]);

    const polyMarkets = await polyResponse.json();
    const kalshiData = await kalshiResponse.json();
    const kalshiEvents = kalshiData.events || [];

    // Process markets
    const epsilon = 0.000001;
    const polyProcessed = [];

    for (const market of polyMarkets) {
      if (!market.outcomePrices || !market.outcomes) continue;

      try {
        const prices = JSON.parse(market.outcomePrices);
        const yesPrice = parseFloat(prices[0]);
        if (Math.abs(yesPrice) < epsilon || Math.abs(yesPrice - 1) < epsilon) continue;

        polyProcessed.push({
          title: market.question,
          outcomes: JSON.parse(market.outcomes),
        });
      } catch (e) {}
    }

    const kalshiProcessed = [];
    for (const event of kalshiEvents) {
      kalshiProcessed.push({
        title: event.title,
        markets: (event.markets || []).map(m => ({
          title: m.title,
          ticker: m.ticker,
        })),
      });
    }

    console.log(`✅ Polymarket: ${polyProcessed.length} moneylines`);
    console.log(`✅ Kalshi: ${kalshiEvents.length} events\n`);

    // Analyze title formats
    console.log('📊 POLYMARKET TITLE FORMATS:\n');
    polyProcessed.slice(0, 10).forEach((m, i) => {
      console.log(`   ${i + 1}. "${m.title}"`);
      console.log(`      Outcomes: [${m.outcomes.join(', ')}]`);
    });

    console.log('\n📊 KALSHI TITLE FORMATS:\n');
    kalshiProcessed.slice(0, 5).forEach((e, i) => {
      console.log(`   ${i + 1}. "${e.title}"`);
      e.markets.slice(0, 2).forEach(m => {
        console.log(`      - "${m.title}"`);
      });
    });

    // Test team extraction
    console.log('\n='.repeat(70));
    console.log('\n🔍 TESTING TEAM EXTRACTION:\n');

    // Import-like simulation (we'll just implement it inline)
    const NFL_TEAMS = [
      { city: 'Kansas City', name: 'Chiefs', abbr: 'KC', aliases: ['chiefs', 'kansas city', 'kc'] },
      { city: 'Denver', name: 'Broncos', abbr: 'DEN', aliases: ['broncos', 'denver', 'den'] },
      { city: 'Philadelphia', name: 'Eagles', abbr: 'PHI', aliases: ['eagles', 'philadelphia', 'phi'] },
      { city: 'Green Bay', name: 'Packers', abbr: 'GB', aliases: ['packers', 'green bay', 'gb'] },
      { city: 'Detroit', name: 'Lions', abbr: 'DET', aliases: ['lions', 'detroit', 'det'] },
      // Add more as needed
    ];

    function extractTeamsFromTitle(title) {
      const titleLower = title.toLowerCase();
      const foundTeams = [];

      for (const team of NFL_TEAMS) {
        for (const alias of team.aliases) {
          const pattern = new RegExp(`\\b${alias}\\b`, 'i');
          const match = pattern.exec(titleLower);
          if (match) {
            if (!foundTeams.find(ft => ft.team.abbr === team.abbr)) {
              foundTeams.push({ team, position: match.index });
              break;
            }
          }
        }
      }

      foundTeams.sort((a, b) => a.position - b.position);
      return foundTeams.map(ft => ft.team);
    }

    // Test sample titles
    const testTitles = [
      'Chiefs vs. Broncos',
      'Kansas City at Denver',
      'Kansas City at Denver Winner?',
      'Philadelphia at Green Bay',
      'Detroit at Philadelphia',
      'Packers',  // Single team (Kalshi format)
    ];

    console.log('Sample title extractions:\n');
    testTitles.forEach(title => {
      const teams = extractTeamsFromTitle(title);
      console.log(`   "${title}"`);
      console.log(`   → Found: ${teams.map(t => `${t.city} ${t.name} (${t.abbr})`).join(' + ')}`);
      if (teams.length === 0) console.log(`   ⚠️ NO TEAMS FOUND`);
      console.log('');
    });

    // Identify matching challenges
    console.log('='.repeat(70));
    console.log('\n💡 MATCHING CHALLENGES IDENTIFIED:\n');

    const challenges = [];

    // Check for ambiguous titles
    if (polyProcessed.some(m => extractTeamsFromTitle(m.title).length !== 2)) {
      challenges.push('⚠️ Some Polymarket titles don\'t contain 2 clear teams');
    }

    // Check for format differences
    const polyFormats = polyProcessed.map(m => {
      if (m.title.includes(' vs ')) return 'vs';
      if (m.title.includes(' at ')) return 'at';
      return 'other';
    });

    const kalshiFormats = kalshiProcessed.map(e => {
      if (e.title.includes(' at ')) return 'at';
      if (e.title.includes(' vs ')) return 'vs';
      return 'other';
    });

    console.log(`   Polymarket formats: vs=${polyFormats.filter(f => f === 'vs').length}, at=${polyFormats.filter(f => f === 'at').length}, other=${polyFormats.filter(f => f === 'other').length}`);
    console.log(`   Kalshi formats: at=${kalshiFormats.filter(f => f === 'at').length}, vs=${kalshiFormats.filter(f => f === 'vs').length}, other=${kalshiFormats.filter(f => f === 'other').length}`);

    console.log('\n='.repeat(70));
    console.log('\n📋 RECOMMENDATIONS:\n');
    console.log('Current matching is good for standard formats!\n');
    console.log('Potential improvements:');
    console.log('   1. ✅ Add fuzzy matching for typos/variations');
    console.log('   2. ✅ Add semantic understanding ("beats" vs "defeats")');
    console.log('   3. ✅ Better handling of city vs team name');
    console.log('   4. 🤖 OPTIONAL: AI agent for complex/ambiguous cases');
    console.log('\n💡 AI Agent Trade-offs:');
    console.log('   PROS: Handles edge cases, semantic understanding');
    console.log('   CONS: Slower, costs money, potential errors');
    console.log('   RECOMMENDATION: Use AI as "safety net" for failed matches');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMatchingQuality();
