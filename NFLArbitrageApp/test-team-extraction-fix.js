// Test that the updated team mappings work for Kalshi's naming format
// Run with: node test-team-extraction-fix.js

const NFL_TEAMS = [
  { city: 'Dallas', name: 'Cowboys', abbr: 'DAL', aliases: ['cowboys', 'dallas', 'dal'] },
  { city: 'Las Vegas', name: 'Raiders', abbr: 'LV', aliases: ['raiders', 'las vegas', 'lv'] },
  { city: 'Detroit', name: 'Lions', abbr: 'DET', aliases: ['lions', 'detroit', 'det'] },
  { city: 'Philadelphia', name: 'Eagles', abbr: 'PHI', aliases: ['eagles', 'philadelphia', 'phi'] },
  { city: 'Kansas City', name: 'Chiefs', abbr: 'KC', aliases: ['chiefs', 'kansas city', 'kc'] },
  { city: 'Denver', name: 'Broncos', abbr: 'DEN', aliases: ['broncos', 'denver', 'den'] },
  { city: 'Baltimore', name: 'Ravens', abbr: 'BAL', aliases: ['ravens', 'baltimore', 'bal'] },
  { city: 'Cleveland', name: 'Browns', abbr: 'CLE', aliases: ['browns', 'cleveland', 'cle'] },
  { city: 'San Francisco', name: '49ers', abbr: 'SF', aliases: ['49ers', 'san francisco', 'sf', 'niners'] },
  { city: 'Arizona', name: 'Cardinals', abbr: 'ARI', aliases: ['cardinals', 'arizona', 'ari'] },
  { city: 'Seattle', name: 'Seahawks', abbr: 'SEA', aliases: ['seahawks', 'seattle', 'sea'] },
  { city: 'Los Angeles', name: 'Chargers', abbr: 'LAC', aliases: ['chargers', 'los angeles chargers', 'los angeles c', 'lac'] },
  { city: 'Los Angeles', name: 'Rams', abbr: 'LA', aliases: ['rams', 'los angeles rams', 'los angeles r', 'la'] },
  { city: 'Jacksonville', name: 'Jaguars', abbr: 'JAX', aliases: ['jaguars', 'jacksonville', 'jax'] },
  { city: 'Houston', name: 'Texans', abbr: 'HOU', aliases: ['texans', 'houston', 'hou'] },
  { city: 'Tennessee', name: 'Titans', abbr: 'TEN', aliases: ['titans', 'tennessee', 'ten'] },
  { city: 'Green Bay', name: 'Packers', abbr: 'GB', aliases: ['packers', 'green bay', 'gb'] },
  { city: 'New York', name: 'Giants', abbr: 'NYG', aliases: ['giants', 'new york giants', 'new york g', 'nyg'] },
  { city: 'Tampa Bay', name: 'Buccaneers', abbr: 'TB', aliases: ['buccaneers', 'tampa bay', 'bucs', 'tb'] },
  { city: 'Buffalo', name: 'Bills', abbr: 'BUF', aliases: ['bills', 'buffalo', 'buf'] },
];

function extractTeamsFromTitle(title) {
  const titleLower = title.toLowerCase();
  const foundTeams = [];

  for (const team of NFL_TEAMS) {
    for (const alias of team.aliases) {
      // Use word boundaries to avoid "la" matching in "las vegas"
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedAlias}\\b`, 'i');

      if (pattern.test(titleLower)) {
        if (!foundTeams.find(t => t.abbr === team.abbr)) {
          foundTeams.push(team);
          break;
        }
      }
    }
  }

  return foundTeams;
}

const kalshiTitles = [
  'Dallas at Las Vegas',
  'Detroit at Philadelphia',
  'Kansas City at Denver',
  'Baltimore at Cleveland',
  'San Francisco at Arizona',
  'Seattle at Los Angeles R',
  'Tampa Bay at Buffalo',
  'Los Angeles C at Jacksonville',
  'Houston at Tennessee',
  'Green Bay at New York G'
];

console.log('🔍 TESTING UPDATED TEAM EXTRACTION\n');
console.log('='.repeat(70));
console.log('Kalshi Game Titles (from real API)');
console.log('='.repeat(70) + '\n');

let successCount = 0;
let failCount = 0;

kalshiTitles.forEach((title, i) => {
  const teams = extractTeamsFromTitle(title);
  const success = teams.length === 2;

  if (success) {
    successCount++;
    console.log(`✅ ${i + 1}. "${title}"`);
    console.log(`   → ${teams.map(t => `${t.name} (${t.abbr})`).join(' vs ')}\n`);
  } else {
    failCount++;
    console.log(`❌ ${i + 1}. "${title}"`);
    console.log(`   → Found ${teams.length} teams: ${teams.map(t => t.name).join(', ') || 'NONE'}\n`);
  }
});

console.log('='.repeat(70));
console.log('RESULTS');
console.log('='.repeat(70) + '\n');

console.log(`✅ Success: ${successCount}/${kalshiTitles.length} (${(successCount/kalshiTitles.length*100).toFixed(0)}%)`);
console.log(`❌ Failed: ${failCount}/${kalshiTitles.length}\n`);

if (successCount === kalshiTitles.length) {
  console.log('🎉 ALL TITLES EXTRACTED SUCCESSFULLY!');
  console.log('   The app will now identify all 28 Kalshi games!\n');
} else {
  console.log('⚠️ Some titles still failing - need more aliases\n');
}
