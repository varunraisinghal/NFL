// Explore Polymarket API endpoints to find more markets
// Run with: node test-polymarket-exploration.js

console.log('🔍 POLYMARKET API EXPLORATION\n');
console.log('Finding all available markets...\n');

async function testEndpoint(name, url) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${name}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(70));

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();

      // Analyze response
      let markets = [];
      if (Array.isArray(data)) {
        markets = data;
      } else if (data.data && Array.isArray(data.data)) {
        markets = data.data;
      } else if (data.markets && Array.isArray(data.markets)) {
        markets = data.markets;
      }

      console.log(`✅ Got ${markets.length} markets`);

      if (markets.length > 0) {
        // Check how many are actually active/tradeable
        const accepting = markets.filter(m => m.accepting_orders !== false);
        const notClosed = markets.filter(m => m.closed !== true);
        const notArchived = markets.filter(m => m.archived !== true);
        const active = markets.filter(m => m.active !== false);

        console.log(`\n📊 Market status breakdown:`);
        console.log(`   Accepting orders: ${accepting.length}`);
        console.log(`   Not closed: ${notClosed.length}`);
        console.log(`   Not archived: ${notArchived.length}`);
        console.log(`   Active flag: ${active.length}`);

        // Sample markets
        console.log(`\n📋 Sample markets (first 5):`);
        markets.slice(0, 5).forEach((m, i) => {
          console.log(`   ${i + 1}. ${(m.question || m.title || 'Unknown').substring(0, 60)}`);
          console.log(`      Closed: ${m.closed}, Active: ${m.active}, Accepting: ${m.accepting_orders}`);
        });

        return { success: true, count: markets.length, markets };
      }
    } else {
      console.log(`❌ Failed with status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  return { success: false, count: 0 };
}

async function main() {
  const endpoints = [
    {
      name: 'CLOB - No filters',
      url: 'https://clob.polymarket.com/markets',
    },
    {
      name: 'CLOB - Accepting orders only',
      url: 'https://clob.polymarket.com/markets?accepting_orders=true&limit=1000',
    },
    {
      name: 'CLOB - Active only',
      url: 'https://clob.polymarket.com/markets?active=true&limit=1000',
    },
    {
      name: 'CLOB - Not closed',
      url: 'https://clob.polymarket.com/markets?closed=false&limit=1000',
    },
    {
      name: 'Gamma API - All markets',
      url: 'https://gamma-api.polymarket.com/markets',
    },
    {
      name: 'Gamma API - Active',
      url: 'https://gamma-api.polymarket.com/markets?active=true',
    },
    {
      name: 'Strapi CMS - Active markets',
      url: 'https://strapi-matic.poly.market/markets?active=true&closed=false&_limit=100&_sort=volume:desc',
    },
    {
      name: 'Strapi CMS - All markets',
      url: 'https://strapi-matic.poly.market/markets?_limit=100&_sort=volume:desc',
    },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url);
    results.push({ ...endpoint, ...result });
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));

  results.forEach(r => {
    if (r.success) {
      console.log(`✅ ${r.name}: ${r.count} markets`);
    } else {
      console.log(`❌ ${r.name}: Failed`);
    }
  });

  // Find the best endpoint
  const best = results.filter(r => r.success).sort((a, b) => b.count - a.count)[0];

  if (best) {
    console.log(`\n🎉 BEST ENDPOINT: ${best.name}`);
    console.log(`   URL: ${best.url}`);
    console.log(`   Markets: ${best.count}`);

    // Analyze the best endpoint's data more
    if (best.markets) {
      const categories = [...new Set(best.markets.map(m => m.category).filter(Boolean))];
      console.log(`\n📂 Categories found: ${categories.length}`);
      console.log(`   ${categories.slice(0, 10).join(', ')}${categories.length > 10 ? '...' : ''}`);

      // Check for sports/NFL
      const sports = best.markets.filter(m => {
        const title = (m.question || m.title || '').toLowerCase();
        const cat = (m.category || '').toLowerCase();
        return title.includes('nfl') || title.includes('football') ||
               cat.includes('sports') || cat.includes('nfl');
      });
      console.log(`\n🏈 Sports/NFL markets: ${sports.length}`);

      if (sports.length > 0) {
        console.log(`   Sample NFL markets:`);
        sports.slice(0, 3).forEach((m, i) => {
          console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
        });
      }
    }
  }
}

main();
