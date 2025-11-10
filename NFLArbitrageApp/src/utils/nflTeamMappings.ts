// NFL Team and City Mappings for cross-platform market matching

export interface NFLTeam {
  city: string;
  name: string;
  abbr: string;
  aliases: string[];
}

export const NFL_TEAMS: NFLTeam[] = [
  { city: 'Arizona', name: 'Cardinals', abbr: 'ARI', aliases: ['cardinals', 'arizona', 'ari'] },
  { city: 'Atlanta', name: 'Falcons', abbr: 'ATL', aliases: ['falcons', 'atlanta', 'atl'] },
  { city: 'Baltimore', name: 'Ravens', abbr: 'BAL', aliases: ['ravens', 'baltimore', 'bal'] },
  { city: 'Buffalo', name: 'Bills', abbr: 'BUF', aliases: ['bills', 'buffalo', 'buf'] },
  { city: 'Carolina', name: 'Panthers', abbr: 'CAR', aliases: ['panthers', 'carolina', 'car'] },
  { city: 'Chicago', name: 'Bears', abbr: 'CHI', aliases: ['bears', 'chicago', 'chi'] },
  { city: 'Cincinnati', name: 'Bengals', abbr: 'CIN', aliases: ['bengals', 'cincinnati', 'cin'] },
  { city: 'Cleveland', name: 'Browns', abbr: 'CLE', aliases: ['browns', 'cleveland', 'cle'] },
  { city: 'Dallas', name: 'Cowboys', abbr: 'DAL', aliases: ['cowboys', 'dallas', 'dal'] },
  { city: 'Denver', name: 'Broncos', abbr: 'DEN', aliases: ['broncos', 'denver', 'den'] },
  { city: 'Detroit', name: 'Lions', abbr: 'DET', aliases: ['lions', 'detroit', 'det'] },
  { city: 'Green Bay', name: 'Packers', abbr: 'GB', aliases: ['packers', 'green bay', 'gb'] },
  { city: 'Houston', name: 'Texans', abbr: 'HOU', aliases: ['texans', 'houston', 'hou'] },
  { city: 'Indianapolis', name: 'Colts', abbr: 'IND', aliases: ['colts', 'indianapolis', 'ind'] },
  { city: 'Jacksonville', name: 'Jaguars', abbr: 'JAX', aliases: ['jaguars', 'jacksonville', 'jax'] },
  { city: 'Kansas City', name: 'Chiefs', abbr: 'KC', aliases: ['chiefs', 'kansas city', 'kc'] },
  { city: 'Las Vegas', name: 'Raiders', abbr: 'LV', aliases: ['raiders', 'las vegas', 'lv'] },
  { city: 'Los Angeles', name: 'Chargers', abbr: 'LAC', aliases: ['chargers', 'los angeles chargers', 'los angeles c', 'lac'] },
  { city: 'Los Angeles', name: 'Rams', abbr: 'LA', aliases: ['rams', 'los angeles rams', 'los angeles r', 'la'] },
  { city: 'Miami', name: 'Dolphins', abbr: 'MIA', aliases: ['dolphins', 'miami', 'mia'] },
  { city: 'Minnesota', name: 'Vikings', abbr: 'MIN', aliases: ['vikings', 'minnesota', 'min'] },
  { city: 'New England', name: 'Patriots', abbr: 'NE', aliases: ['patriots', 'new england', 'ne'] },
  { city: 'New Orleans', name: 'Saints', abbr: 'NO', aliases: ['saints', 'new orleans', 'no'] },
  { city: 'New York', name: 'Giants', abbr: 'NYG', aliases: ['giants', 'new york giants', 'new york g', 'nyg'] },
  { city: 'New York', name: 'Jets', abbr: 'NYJ', aliases: ['jets', 'new york jets', 'new york j', 'nyj'] },
  { city: 'Philadelphia', name: 'Eagles', abbr: 'PHI', aliases: ['eagles', 'philadelphia', 'phi'] },
  { city: 'Pittsburgh', name: 'Steelers', abbr: 'PIT', aliases: ['steelers', 'pittsburgh', 'pit'] },
  { city: 'San Francisco', name: '49ers', abbr: 'SF', aliases: ['49ers', 'san francisco', 'sf', 'niners'] },
  { city: 'Seattle', name: 'Seahawks', abbr: 'SEA', aliases: ['seahawks', 'seattle', 'sea'] },
  { city: 'Tampa Bay', name: 'Buccaneers', abbr: 'TB', aliases: ['buccaneers', 'tampa bay', 'bucs', 'tb'] },
  { city: 'Tennessee', name: 'Titans', abbr: 'TEN', aliases: ['titans', 'tennessee', 'ten'] },
  { city: 'Washington', name: 'Commanders', abbr: 'WAS', aliases: ['commanders', 'washington', 'was'] },
];

/**
 * Extract team from market title
 * Works for both Polymarket ("Falcons vs. Colts") and Kalshi ("Atlanta at Indianapolis")
 * IMPORTANT: Returns teams in the order they appear in the title (left to right)
 */
export function extractTeamsFromTitle(title: string): NFLTeam[] {
  const titleLower = title.toLowerCase();
  const foundTeams: { team: NFLTeam; position: number }[] = [];

  for (const team of NFL_TEAMS) {
    for (const alias of team.aliases) {
      // Use word boundaries to avoid false matches like "la" in "las vegas"
      // Escape special regex characters in the alias
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedAlias}\\b`, 'i');

      const match = pattern.exec(titleLower);
      if (match) {
        // Avoid duplicates
        if (!foundTeams.find(ft => ft.team.abbr === team.abbr)) {
          foundTeams.push({ team, position: match.index });
          break;
        }
      }
    }
  }

  // Sort by position in title to preserve left-to-right order
  foundTeams.sort((a, b) => a.position - b.position);

  return foundTeams.map(ft => ft.team);
}

/**
 * Check if two markets represent the same game
 */
export function isSameGame(title1: string, title2: string): boolean {
  const teams1 = extractTeamsFromTitle(title1);
  const teams2 = extractTeamsFromTitle(title2);

  // Must find exactly 2 teams in each title
  if (teams1.length !== 2 || teams2.length !== 2) {
    return false;
  }

  // Check if both sets contain the same teams
  const abbrs1 = teams1.map(t => t.abbr).sort();
  const abbrs2 = teams2.map(t => t.abbr).sort();

  return abbrs1[0] === abbrs2[0] && abbrs1[1] === abbrs2[1];
}

/**
 * Extract specific team from market
 * Used for Kalshi markets that specify which team in the ticker
 */
export function extractSpecificTeam(title: string, teamAbbr?: string): NFLTeam | null {
  if (teamAbbr) {
    // Find team by abbreviation
    const team = NFL_TEAMS.find(t => t.abbr.toUpperCase() === teamAbbr.toUpperCase());
    if (team) return team;
  }

  // Extract from title
  const teams = extractTeamsFromTitle(title);
  return teams.length > 0 ? teams[0] : null;
}
