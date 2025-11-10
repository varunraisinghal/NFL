// Access NFL games through the series endpoint
// Run with: node test-nfl-series.js

console.log('🏈 NFL GAMES VIA SERIES ENDPOINT\n');

async function getNFLSeries() {
  console.log('='.repeat(70));
  console.log('NFL Series 10187');
  console.log('='.repeat(70) + '\n');

  try {
    const response = await fetch('https://gamma-api.polymarket.com/series/10187');
    const series = await response.json();

    console.log(`Series: ${series.title}`);
    console.log(`Total events in series: ${series.events?.length || 0}\n`);

    if (!series.events || series.events.length === 0) {
      console.log('No events found in series');
      return;
    }

    // Filter for active/upcoming events
    const activeEvents = series.events.filter(e => !e.closed && e.active);
    const closedEvents = series.events.filter(e => e.closed);

    console.log(`Active events: ${activeEvents.length}`);
    console.log(`Closed events: ${closedEvents.length}\n`);

    if (activeEvents.length > 0) {
      console.log('✅ ACTIVE NFL GAMES:\n');
      activeEvents.slice(0, 15).forEach((e, i) => {
        console.log(`${i + 1}. ${e.title}`);
        console.log(`   Slug: ${e.slug}`);
        console.log(`   Start: ${e.creationDate || e.startDate}`);
        console.log(`   Markets: ${e.markets?.length || 0}`);
        console.log('');
      });

      // Now fetch markets for each event
      console.log('\n' + '='.repeat(70));
      console.log('FETCHING MARKETS FOR EACH GAME');
      console.log('='.repeat(70) + '\n');

      const allGameMarkets = [];

      for (const event of activeEvents.slice(0, 5)) {  // Test with first 5 games
        console.log(`\nGame: ${event.title}`);

        // Try to get markets for this event
        // Option 1: Markets might be in event.markets
        if (event.markets && event.markets.length > 0) {
          console.log(`   Found ${event.markets.length} markets in event object`);
          event.markets.forEach((m, i) => {
            console.log(`   ${i + 1}. ${m.question || m.title}`);
          });
          allGameMarkets.push(...event.markets);
        }

        // Option 2: Fetch markets by event slug/id
        try {
          const eventMarketsUrl = `https://gamma-api.polymarket.com/markets?event_slug=${event.slug}&active=true&closed=false&limit=50`;
          console.log(`   Trying: event_slug=${event.slug}`);
          const marketsResponse = await fetch(eventMarketsUrl);
          const markets = await marketsResponse.json();

          if (Array.isArray(markets) && markets.length > 0) {
            console.log(`   ✅ Found ${markets.length} markets via event_slug`);
            markets.forEach((m, i) => {
              console.log(`      ${i + 1}. ${m.question || m.title}`);
              if (m.outcomePrices) {
                try {
                  const prices = JSON.parse(m.outcomePrices);
                  console.log(`         Prices: Yes=$${prices[0]}, No=$${prices[1]}`);
                } catch (e) {}
              }
            });
            allGameMarkets.push(...markets);
          }
        } catch (e) {
          console.log(`   Error fetching markets: ${e.message}`);
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('\n\n' + '='.repeat(70));
      console.log('📊 CATEGORIZING MARKETS');
      console.log('='.repeat(70) + '\n');

      if (allGameMarkets.length > 0) {
        const moneylines = [];
        const spreads = [];
        const totals = [];
        const props = [];

        allGameMarkets.forEach(m => {
          const title = (m.question || m.title || '').toLowerCase();

          if (title.includes('by more than') || title.includes('spread')) {
            spreads.push(m);
          } else if (title.includes('over') || title.includes('under') || title.includes('total')) {
            totals.push(m);
          } else if (title.includes('yards') || title.includes('touchdown')) {
            props.push(m);
          } else {
            // Simple win/lose markets = moneylines
            moneylines.push(m);
          }
        });

        console.log(`Moneylines: ${moneylines.length}`);
        console.log(`Spreads: ${spreads.length}`);
        console.log(`Totals: ${totals.length}`);
        console.log(`Props: ${props.length}\n`);

        if (moneylines.length > 0) {
          console.log('✅ MONEYLINE MARKETS:\n');
          moneylines.forEach((m, i) => {
            console.log(`${i + 1}. ${m.question || m.title}`);
            if (m.outcomePrices) {
              try {
                const prices = JSON.parse(m.outcomePrices);
                console.log(`   Prices: Yes=$${prices[0]}, No=$${prices[1]}`);
              } catch (e) {}
            }
          });
        }
      }

    } else {
      console.log('No active events. Showing recent closed events:\n');
      closedEvents.slice(0, 10).forEach((e, i) => {
        console.log(`${i + 1}. ${e.title} (closed)`);
        console.log(`   End: ${e.endDate}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  await getNFLSeries();

  console.log('\n\n' + '='.repeat(70));
  console.log('🎯 NEXT STEPS');
  console.log('='.repeat(70));
  console.log('\nIf active games found:');
  console.log('1. Use series/10187 to get all NFL events');
  console.log('2. Filter for active events');
  console.log('3. Get markets for each event');
  console.log('4. Filter for moneylines only\n');
}

main();
