// Test different Polymarket NBA tag combinations

const GAMMA_API = 'https://gamma-api.polymarket.com';

async function testTagId(tagId, description) {
  console.log(`\nTrying ${description} (tag_id=${tagId})...`);

  const url = `${GAMMA_API}/markets?tag_id=${tagId}&active=true&closed=false&limit=10`;

  try {
    const response = await fetch(url);
    const markets = await response.json();

    if (Array.isArray(markets) && markets.length > 0) {
      console.log(`✅ Found ${markets.length} markets!`);
      markets.slice(0, 3).forEach(m => {
        console.log(`   - ${m.question || m.title}`);
      });
      return markets;
    } else {
      console.log(`❌ No markets found`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  return [];
}

async function testSeriesId(seriesId, description) {
  console.log(`\nTrying ${description} (series=${seriesId})...`);

  const url = `${GAMMA_API}/markets?series=${seriesId}&active=true&closed=false&limit=10`;

  try {
    const response = await fetch(url);
    const markets = await response.json();

    if (Array.isArray(markets) && markets.length > 0) {
      console.log(`✅ Found ${markets.length} markets!`);
      markets.slice(0, 3).forEach(m => {
        console.log(`   - ${m.question || m.title}`);
      });
      return markets;
    } else {
      console.log(`❌ No markets found`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  return [];
}

async function testMoneylineFilter(tagId) {
  console.log(`\nTrying tag_id=${tagId} with sports_market_types=moneyline...`);

  const url = `${GAMMA_API}/markets?tag_id=${tagId}&sports_market_types=moneyline&active=true&closed=false&limit=10`;

  try {
    const response = await fetch(url);
    const markets = await response.json();

    if (Array.isArray(markets) && markets.length > 0) {
      console.log(`✅ Found ${markets.length} moneyline markets!`);
      markets.slice(0, 3).forEach(m => {
        console.log(`   - ${m.question || m.title}`);
      });
      return markets;
    } else {
      console.log(`❌ No moneyline markets found`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  return [];
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  POLYMARKET NBA TAG TESTING');
  console.log('═══════════════════════════════════════════════════════');

  // From the NBA sport object:
  // tags: "1,745,100639"
  // series: "10345"

  const tags = ['1', '745', '100639', '34'];
  const series = ['10345'];

  console.log('\n📊 Testing individual tag IDs...');
  for (const tag of tags) {
    await testTagId(tag, `Tag ${tag}`);
  }

  console.log('\n📊 Testing series IDs...');
  for (const s of series) {
    await testSeriesId(s, `Series ${s}`);
  }

  console.log('\n📊 Testing with moneyline filter...');
  for (const tag of tags) {
    await testMoneylineFilter(tag);
  }

  // Also try fetching all NBA markets without moneyline filter
  console.log('\n📊 Fetching ALL NBA markets (any type)...');

  for (const tag of tags) {
    console.log(`\nTrying tag_id=${tag} (all market types)...`);
    const url = `${GAMMA_API}/markets?tag_id=${tag}&active=true&closed=false&limit=10`;

    try {
      const response = await fetch(url);
      const markets = await response.json();

      if (Array.isArray(markets) && markets.length > 0) {
        console.log(`✅ Found ${markets.length} total NBA markets!`);

        // Group by market type
        const byType = {};
        markets.forEach(m => {
          const type = m.market_type || m.marketType || 'unknown';
          if (!byType[type]) byType[type] = [];
          byType[type].push(m);
        });

        console.log('\nMarkets by type:');
        for (const [type, mkts] of Object.entries(byType)) {
          console.log(`  ${type}: ${mkts.length} markets`);
          mkts.slice(0, 2).forEach(m => {
            console.log(`    - ${m.question || m.title}`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  END OF TESTING');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
