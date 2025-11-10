// Comprehensive exploration of Polymarket API
// Discover ALL available markets, sports, categories, and types

const GAMMA_API = 'https://gamma-api.polymarket.com';

async function exploreSports() {
  console.log('\n🏈 EXPLORING POLYMARKET SPORTS...\n');

  try {
    const response = await fetch(`${GAMMA_API}/sports`);
    const sports = await response.json();

    console.log(`Found ${sports.length} sports:\n`);

    for (const sport of sports) {
      console.log(`📊 ${sport.name || sport.sport}`);
      console.log(`   ID: ${sport.id}`);
      console.log(`   Tag ID: ${sport.tag_id || 'N/A'}`);
      console.log(`   Series: ${sport.series_ticker || 'N/A'}`);
      console.log(`   Active: ${sport.active}`);
      console.log('');
    }

    return sports;
  } catch (error) {
    console.error('Error fetching sports:', error.message);
    return [];
  }
}

async function exploreMarketTypes() {
  console.log('\n📈 EXPLORING MARKET TYPES...\n');

  // Try to get markets and see what types exist
  try {
    const response = await fetch(`${GAMMA_API}/markets?limit=100&active=true`);
    const markets = await response.json();

    // Collect unique market types
    const marketTypes = new Set();
    const categories = new Set();
    const tags = new Set();

    for (const market of markets.slice(0, 50)) {
      if (market.market_type) marketTypes.add(market.market_type);
      if (market.category) categories.add(market.category);
      if (market.tags && Array.isArray(market.tags)) {
        market.tags.forEach(tag => tags.add(tag));
      }
    }

    console.log('Market Types Found:');
    console.log([...marketTypes].join(', ') || 'None found');
    console.log('');

    console.log('Categories Found:');
    console.log([...categories].join(', ') || 'None found');
    console.log('');

    console.log(`Tags Found (${tags.size} total):`, [...tags].slice(0, 20).join(', '));
    console.log('');

    return { marketTypes: [...marketTypes], categories: [...categories], tags: [...tags] };
  } catch (error) {
    console.error('Error exploring market types:', error.message);
    return { marketTypes: [], categories: [], tags: [] };
  }
}

async function exploreSportMarkets(sportName, tagId) {
  console.log(`\n🔍 EXPLORING ${sportName.toUpperCase()} MARKETS...\n`);

  try {
    // Try different filtering approaches
    const queries = [
      `tag_id=${tagId}&active=true&limit=20`,
      `tag_id=${tagId}&sports_market_types=moneyline&active=true`,
      `tag_id=${tagId}&sports_market_types=spread&active=true`,
      `tag_id=${tagId}&sports_market_types=total&active=true`,
      `tag_id=${tagId}&sports_market_types=props&active=true`,
    ];

    const results = {};

    for (const query of queries) {
      const marketType = query.includes('moneyline') ? 'moneyline' :
                         query.includes('spread') ? 'spread' :
                         query.includes('total') ? 'total' :
                         query.includes('props') ? 'props' : 'all';

      const response = await fetch(`${GAMMA_API}/markets?${query}`);
      const markets = await response.json();

      results[marketType] = Array.isArray(markets) ? markets.length : 0;

      console.log(`${marketType.toUpperCase()}: ${results[marketType]} markets`);

      // Show sample market
      if (Array.isArray(markets) && markets.length > 0) {
        console.log(`   Sample: "${markets[0].question || markets[0].title}"`);
      }
    }

    return results;
  } catch (error) {
    console.error(`Error exploring ${sportName} markets:`, error.message);
    return {};
  }
}

async function exploreCategories() {
  console.log('\n📂 EXPLORING ALL CATEGORIES...\n');

  try {
    // Fetch a large sample of markets to categorize
    const response = await fetch(`${GAMMA_API}/markets?active=true&limit=100`);
    const markets = await response.json();

    const categoryMap = new Map();

    for (const market of markets) {
      const category = market.category || 'Uncategorized';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          count: 0,
          samples: []
        });
      }

      const catData = categoryMap.get(category);
      catData.count++;
      if (catData.samples.length < 2) {
        catData.samples.push(market.question || market.title);
      }
    }

    console.log('Categories discovered:\n');

    for (const [category, data] of categoryMap) {
      console.log(`📁 ${category} (${data.count} markets)`);
      data.samples.forEach(sample => {
        console.log(`   - "${sample.substring(0, 80)}${sample.length > 80 ? '...' : ''}"`);
      });
      console.log('');
    }

    return categoryMap;
  } catch (error) {
    console.error('Error exploring categories:', error.message);
    return new Map();
  }
}

async function searchSpecificMarkets(searchTerms) {
  console.log('\n🔎 SEARCHING FOR SPECIFIC MARKET TYPES...\n');

  try {
    const response = await fetch(`${GAMMA_API}/markets?active=true&limit=200`);
    const markets = await response.json();

    for (const term of searchTerms) {
      console.log(`\n"${term.toUpperCase()}" markets:`);

      const matching = markets.filter(m => {
        const text = (m.question || m.title || '').toLowerCase();
        return text.includes(term.toLowerCase());
      });

      console.log(`Found ${matching.length} markets`);

      matching.slice(0, 5).forEach(m => {
        console.log(`   - ${m.question || m.title}`);
        console.log(`     Category: ${m.category}`);
        if (m.outcomePrices) {
          const prices = JSON.parse(m.outcomePrices);
          console.log(`     Prices: ${prices[0]} / ${prices[1]}`);
        }
      });
    }
  } catch (error) {
    console.error('Error searching markets:', error.message);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  POLYMARKET API COMPREHENSIVE EXPLORATION');
  console.log('═══════════════════════════════════════════════════════');

  // 1. Explore all sports
  const sports = await exploreSports();

  // 2. Explore market types
  const { marketTypes, categories, tags } = await exploreMarketTypes();

  // 3. Explore specific sports in detail
  if (sports.length > 0) {
    // NFL
    const nfl = sports.find(s => s.name === 'NFL' || s.sport === 'NFL');
    if (nfl) {
      await exploreSportMarkets('NFL', nfl.tag_id || nfl.id);
    }

    // NBA (if available)
    const nba = sports.find(s => s.name === 'NBA' || s.sport === 'NBA');
    if (nba) {
      await exploreSportMarkets('NBA', nba.tag_id || nba.id);
    }

    // MLB (if available)
    const mlb = sports.find(s => s.name === 'MLB' || s.sport === 'MLB');
    if (mlb) {
      await exploreSportMarkets('MLB', mlb.tag_id || mlb.id);
    }
  }

  // 4. Explore all categories
  await exploreCategories();

  // 5. Search for specific interesting market types
  await searchSpecificMarkets([
    'election',
    'president',
    'bitcoin',
    'ethereum',
    'crypto',
    'stock',
    'recession',
    'inflation',
    'climate',
    'ai',
    'super bowl',
    'championship'
  ]);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  EXPLORATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
