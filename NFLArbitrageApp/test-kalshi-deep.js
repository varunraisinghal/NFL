// Deep dive into Kalshi market structure
// Run with: node test-kalshi-deep.js

console.log('🔍 DEEP DIVE INTO KALSHI MARKETS\n');

async function analyzeKalshiMarkets() {
  const url = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=200';

  try {
    const response = await fetch(url);
    const data = await response.json();

    const markets = data.markets || [];

    console.log(`Total markets: ${markets.length}\n`);

    // Categorize markets by their price characteristics
    const categories = {
      hasBidPrices: [],
      hasAskPrices: [],
      hasLastPrice: [],
      zeroAskOnly: [],
      fullAskOnly: [],
      noPriceData: [],
    };

    for (const market of markets) {
      const yesBid = market.yes_bid || 0;
      const noBid = market.no_bid || 0;
      const yesAsk = market.yes_ask || 0;
      const noAsk = market.no_ask || 0;
      const lastPrice = market.last_price || 0;

      if (yesBid > 0 || noBid > 0) {
        categories.hasBidPrices.push(market);
      } else if (yesAsk > 0 && yesAsk < 100 && noAsk > 0 && noAsk < 100) {
        categories.hasAskPrices.push(market);
      } else if (lastPrice > 0) {
        categories.hasLastPrice.push(market);
      } else if (yesAsk === 0 && noAsk === 100) {
        categories.zeroAskOnly.push(market);
      } else if (yesAsk === 100 && noAsk === 0) {
        categories.fullAskOnly.push(market);
      } else {
        categories.noPriceData.push(market);
      }
    }

    console.log('📊 CATEGORIZATION RESULTS:');
    console.log(`   Markets with bid prices (>0): ${categories.hasBidPrices.length}`);
    console.log(`   Markets with ask prices (valid range): ${categories.hasAskPrices.length}`);
    console.log(`   Markets with last price only: ${categories.hasLastPrice.length}`);
    console.log(`   Markets with 0/100 asks (no trading): ${categories.zeroAskOnly.length}`);
    console.log(`   Markets with 100/0 asks: ${categories.fullAskOnly.length}`);
    console.log(`   Markets with no price data: ${categories.noPriceData.length}`);

    // Show samples from each category
    if (categories.hasBidPrices.length > 0) {
      console.log('\n✅ SAMPLE: Markets WITH bid prices (USABLE!):');
      categories.hasBidPrices.slice(0, 3).forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.title || m.ticker}`);
        console.log(`      Yes: bid=${m.yes_bid}, ask=${m.yes_ask}`);
        console.log(`      No: bid=${m.no_bid}, ask=${m.no_ask}`);
        console.log(`      Last: ${m.last_price}`);
        console.log(`      Volume: ${m.volume}, Liquidity: ${m.liquidity}`);
      });
    }

    if (categories.hasAskPrices.length > 0) {
      console.log('\n⚠️ SAMPLE: Markets with ask prices but no bids:');
      categories.hasAskPrices.slice(0, 2).forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.title || m.ticker}`);
        console.log(`      Yes: bid=${m.yes_bid}, ask=${m.yes_ask}`);
        console.log(`      No: bid=${m.no_bid}, ask=${m.no_ask}`);
      });
    }

    if (categories.hasLastPrice.length > 0) {
      console.log('\n💡 SAMPLE: Markets with last price only:');
      categories.hasLastPrice.slice(0, 2).forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.title || m.ticker}`);
        console.log(`      Last Price: ${m.last_price}`);
        console.log(`      Yes: bid=${m.yes_bid}, ask=${m.yes_ask}`);
        console.log(`      No: bid=${m.no_bid}, ask=${m.no_ask}`);
      });
    }

    if (categories.zeroAskOnly.length > 0) {
      console.log('\n❌ SAMPLE: Markets with 0/100 asks (no trading):');
      categories.zeroAskOnly.slice(0, 2).forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.title || m.ticker}`);
        console.log(`      Type: ${m.market_type}`);
        console.log(`      Category: ${m.category}`);
        console.log(`      Yes: bid=${m.yes_bid}, ask=${m.yes_ask}`);
        console.log(`      No: bid=${m.no_bid}, ask=${m.no_ask}`);
      });
    }

    // Check if there's a pattern
    console.log('\n\n🔬 PATTERN ANALYSIS:');

    const withBids = categories.hasBidPrices;
    if (withBids.length > 0) {
      const categories_found = [...new Set(withBids.map(m => m.category))];
      const types_found = [...new Set(withBids.map(m => m.market_type))];

      console.log(`   Categories with active trading: ${categories_found.join(', ')}`);
      console.log(`   Market types with active trading: ${types_found.join(', ')}`);
    }

    const withoutBids = categories.zeroAskOnly;
    if (withoutBids.length > 0) {
      const categories_found = [...new Set(withoutBids.slice(0, 50).map(m => m.category))];
      const types_found = [...new Set(withoutBids.slice(0, 50).map(m => m.market_type))];

      console.log(`   Categories WITHOUT trading: ${categories_found.join(', ') || 'N/A'}`);
      console.log(`   Market types WITHOUT trading: ${types_found.join(', ') || 'N/A'}`);
    }

    // Recommendation
    console.log('\n\n💡 RECOMMENDATION:');
    if (categories.hasBidPrices.length > 0) {
      console.log(`   ✅ Use ${categories.hasBidPrices.length} markets with bid prices`);
      console.log(`   These markets have active trading and real prices`);
    } else if (categories.hasLastPrice.length > 0) {
      console.log(`   ⚠️ Only ${categories.hasLastPrice.length} markets have last_price`);
      console.log(`   You could use last_price as a fallback, but liquidity may be low`);
    } else {
      console.log(`   ❌ No markets with usable prices found`);
      console.log(`   Kalshi may not have active markets right now, or API structure changed`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeKalshiMarkets();
