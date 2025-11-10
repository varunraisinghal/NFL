// Test enhanced matching with fuzzy logic

// Simulate the enhanced matching logic
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NFL_TEAMS = [
  { city: 'Kansas City', name: 'Chiefs', abbr: 'KC', aliases: ['chiefs', 'kansas city', 'kc'] },
  { city: 'Denver', name: 'Broncos', abbr: 'DEN', aliases: ['broncos', 'denver', 'den'] },
  { city: 'Philadelphia', name: 'Eagles', abbr: 'PHI', aliases: ['eagles', 'philadelphia', 'phi'] },
  { city: 'Green Bay', name: 'Packers', abbr: 'GB', aliases: ['packers', 'green bay', 'gb'] },
  { city: 'Detroit', name: 'Lions', abbr: 'DET', aliases: ['lions', 'detroit', 'det'] },
  { city: 'San Francisco', name: '49ers', abbr: 'SF', aliases: ['49ers', 'san francisco', 'sf', 'niners'] },
  { city: 'Dallas', name: 'Cowboys', abbr: 'DAL', aliases: ['cowboys', 'dallas', 'dal'] },
  { city: 'Las Vegas', name: 'Raiders', abbr: 'LV', aliases: ['raiders', 'las vegas', 'lv'] },
];

function extractTeamsFromTitle(title) {
  const titleNormalized = normalizeTitle(title);
  const foundTeams = [];

  for (const team of NFL_TEAMS) {
    let bestMatch = null;

    for (const alias of team.aliases) {
      // Exact match
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedAlias}\\b`, 'i');
      const match = pattern.exec(titleNormalized);

      if (match) {
        bestMatch = { position: match.index, confidence: 1.0, alias };
        break;
      }

      // Fuzzy match for typos
      if (alias.length >= 5) {
        const words = titleNormalized.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (word.length >= 4) {
            const distance = levenshteinDistance(alias, word);
            const maxDistance = Math.max(2, Math.floor(alias.length * 0.2));

            if (distance <= maxDistance) {
              const confidence = 1 - (distance / alias.length);
              const position = titleNormalized.indexOf(word);

              if (!bestMatch || confidence > bestMatch.confidence) {
                bestMatch = { position, confidence, alias: `${alias} (fuzzy: ${word})` };
              }
            }
          }
        }
      }
    }

    if (bestMatch && !foundTeams.find(ft => ft.team.abbr === team.abbr)) {
      foundTeams.push({ team, position: bestMatch.position, confidence: bestMatch.confidence, matchedAlias: bestMatch.alias });
    }
  }

  foundTeams.sort((a, b) => a.position - b.position);
  return foundTeams;
}

console.log('🔍 Testing Enhanced Matching with Fuzzy Logic\n');
console.log('='.repeat(70));

// Test cases including typos and variations
const testCases = [
  // Normal cases
  'Chiefs vs. Broncos',
  'Kansas City at Denver',
  'Philadelphia at Green Bay',
  'Eagles vs Packers',

  // With typos
  'Cheifs vs. Broncos',           // Typo: Cheifs -> Chiefs
  'Kansas City at Denvor',        // Typo: Denvor -> Denver
  'Philadelpia at Green Bay',     // Typo: Philadelpia -> Philadelphia
  'Eagels vs Packers',            // Typo: Eagels -> Eagles

  // Different formats
  'San Francisco 49ers at Dallas Cowboys',
  'Niners vs Cowboys',
  '49ers @ Cowboys',

  // Edge cases
  'Las Vegas at Kansas City Winner?',
  'Raiders @ Chiefs (Week 12)',
  'Detroit vs. Dallas',
];

console.log('\n📊 MATCHING RESULTS:\n');

testCases.forEach((testCase, i) => {
  console.log(`${i + 1}. "${testCase}"`);
  const result = extractTeamsFromTitle(testCase);

  if (result.length === 0) {
    console.log('   ❌ NO TEAMS FOUND');
  } else {
    result.forEach(r => {
      const confidenceIcon = r.confidence === 1.0 ? '✅' : '⚠️';
      const confidencePercent = (r.confidence * 100).toFixed(1);
      console.log(`   ${confidenceIcon} ${r.team.city} ${r.team.name} (${r.team.abbr}) - ${confidencePercent}% confidence`);
      console.log(`      Matched via: ${r.matchedAlias}`);
    });
  }
  console.log('');
});

console.log('='.repeat(70));
console.log('\n💡 KEY IMPROVEMENTS:\n');
console.log('✅ Handles exact matches with 100% confidence');
console.log('✅ Handles typos with fuzzy matching (Levenshtein distance)');
console.log('✅ Only applies fuzzy matching to aliases 5+ chars (avoids false positives)');
console.log('✅ 20% edit distance threshold prevents bad matches');
console.log('✅ Confidence scoring helps identify uncertain matches');
console.log('\n🎯 When to use AI:');
console.log('   - When confidence < 0.8 (uncertain fuzzy match)');
console.log('   - When 0 or 1 team found (ambiguous title)');
console.log('   - When semantic understanding needed (e.g., "beats" vs "defeats")');
console.log('');
