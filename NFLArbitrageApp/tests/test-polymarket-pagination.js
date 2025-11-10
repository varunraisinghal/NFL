// Test Polymarket pagination and filtering
// Run with: node test-polymarket-pagination.js

console.log('🔍 POLYMARKET PAGINATION & FILTERING TEST\n');

async function testPagination() {
  console.log('Testing pagination to get ALL markets...\n');

  const baseUrl = 'https://clob.polymarket.com/markets';
  let allMarkets = [];
  let cursor = null;
  let page = 1;

  // Try pagination with cursor
  console.log('Method 1: Using next_cursor for pagination');
  try {
    const response = await fetch(baseUrl);
    const data = await response.json();

    console.log(`Page 1: ${data.data?.length || 0} markets`);
    console.log(`Has next_cursor: ${!!data.next_cursor}`);
    console.log(`Cursor value: ${data.next_cursor}`);
    console.log(`Response keys: ${Object.keys(data).join(', ')}`);

    if (data.next_cursor) {
      // Try to fetch next page
      const nextUrl = `${baseUrl}?next_cursor=${data.next_cursor}`;
      console.log(`\nFetching page 2 with cursor: ${nextUrl.substring(0, 80)}...`);

      const response2 = await fetch(nextUrl);
      const data2 = await response2.json();

      console.log(`Page 2: ${data2.data?.length || 0} markets`);
      console.log(`Has next_cursor: ${!!data2.next_cursor}`);
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  // Try with offset/limit
  console.log('\n\nMethod 2: Using limit parameter');
  try {
    const limits = [100, 500, 1000, 2000, 5000];

    for (const limit of limits) {
      const url = `${baseUrl}?limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log(`Limit ${limit}: Got ${data.data?.length || 0} markets`);

      if (limit === 5000 && data.data) {
        // If we get more markets with higher limit, save them
        allMarkets = data.data;
      }
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  console.log('\n\nMethod 3: Testing different endpoints');
  const endpoints = [
    'https://clob.polymarket.com/markets',
    'https://clob.polymarket.com/events',
    'https://clob.polymarket.com/v2/markets',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const count = data.data?.length || data.markets?.length || (Array.isArray(data) ? data.length : 0);
        console.log(`✅ ${endpoint}: ${count} items`);
      } else {
        console.log(`❌ ${endpoint}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

async function analyzeFiltering() {
  console.log('\n\n' + '='.repeat(70));
  console.log('ANALYZING OPTIMAL FILTERING STRATEGY');
  console.log('='.repeat(70) + '\n');

  const url = 'https://clob.polymarket.com/markets?limit=5000';
  const response = await fetch(url);
  const data = await response.json();
  const markets = data.data || [];

  console.log(`Total markets: ${markets.length}\n`);

  // Analyze different filter combinations
  const filters = {
    'accepting_orders = true': markets.filter(m => m.accepting_orders === true),
    'closed = false': markets.filter(m => m.closed === false),
    'closed = false AND archived = false': markets.filter(m => m.closed === false && m.archived === false),
    'active = true AND closed = false': markets.filter(m => m.active === true && m.closed === false),
    'accepting_orders = true OR closed = false': markets.filter(m => m.accepting_orders === true || m.closed === false),
  };

  console.log('📊 Filter Results:');
  Object.entries(filters).forEach(([name, filtered]) => {
    console.log(`   ${name}: ${filtered.length} markets`);
  });

  // Recommend best filter
  console.log('\n💡 RECOMMENDATION:');
  const notClosed = markets.filter(m => m.closed === false && m.archived === false);
  console.log(`   Use: closed=false AND archived=false (${notClosed.length} markets)`);

  if (notClosed.length > 0) {
    console.log(`\n   Sample markets:`);
    notClosed.slice(0, 5).forEach((m, i) => {
      console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
      console.log(`      Accepting orders: ${m.accepting_orders}`);
      console.log(`      End date: ${m.end_date_iso}`);
    });
  }

  // Check for NFL markets specifically
  const nflMarkets = notClosed.filter(m => {
    const title = (m.question || m.title || '').toLowerCase();
    return title.includes('nfl') || title.includes('football');
  });

  console.log(`\n🏈 NFL markets (not closed): ${nflMarkets.length}`);
  if (nflMarkets.length > 0) {
    nflMarkets.slice(0, 5).forEach((m, i) => {
      console.log(`   ${i + 1}. ${(m.question || m.title).substring(0, 70)}`);
    });
  }
}

async function main() {
  await testPagination();
  await analyzeFiltering();
}

main();
