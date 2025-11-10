// NBA Team and City Mappings for cross-platform market matching

export interface NBATeam {
  city: string;
  name: string;
  abbr: string;
  conference: 'Eastern' | 'Western';
  division: string;
  aliases: string[];
}

export const NBA_TEAMS: NBATeam[] = [
  // Eastern Conference - Atlantic Division
  {
    city: 'Boston',
    name: 'Celtics',
    abbr: 'BOS',
    conference: 'Eastern',
    division: 'Atlantic',
    aliases: ['celtics', 'boston', 'bos', 'boston celtics']
  },
  {
    city: 'Brooklyn',
    name: 'Nets',
    abbr: 'BKN',
    conference: 'Eastern',
    division: 'Atlantic',
    aliases: ['nets', 'brooklyn', 'bkn', 'brooklyn nets']
  },
  {
    city: 'New York',
    name: 'Knicks',
    abbr: 'NYK',
    conference: 'Eastern',
    division: 'Atlantic',
    aliases: ['knicks', 'new york knicks', 'new york', 'nyk']
  },
  {
    city: 'Philadelphia',
    name: '76ers',
    abbr: 'PHI',
    conference: 'Eastern',
    division: 'Atlantic',
    aliases: ['76ers', 'sixers', 'philadelphia', 'phi', 'philadelphia 76ers']
  },
  {
    city: 'Toronto',
    name: 'Raptors',
    abbr: 'TOR',
    conference: 'Eastern',
    division: 'Atlantic',
    aliases: ['raptors', 'toronto', 'tor', 'toronto raptors']
  },

  // Eastern Conference - Central Division
  {
    city: 'Chicago',
    name: 'Bulls',
    abbr: 'CHI',
    conference: 'Eastern',
    division: 'Central',
    aliases: ['bulls', 'chicago', 'chi', 'chicago bulls']
  },
  {
    city: 'Cleveland',
    name: 'Cavaliers',
    abbr: 'CLE',
    conference: 'Eastern',
    division: 'Central',
    aliases: ['cavaliers', 'cavs', 'cleveland', 'cle', 'cleveland cavaliers']
  },
  {
    city: 'Detroit',
    name: 'Pistons',
    abbr: 'DET',
    conference: 'Eastern',
    division: 'Central',
    aliases: ['pistons', 'detroit', 'det', 'detroit pistons']
  },
  {
    city: 'Indiana',
    name: 'Pacers',
    abbr: 'IND',
    conference: 'Eastern',
    division: 'Central',
    aliases: ['pacers', 'indiana', 'ind', 'indiana pacers']
  },
  {
    city: 'Milwaukee',
    name: 'Bucks',
    abbr: 'MIL',
    conference: 'Eastern',
    division: 'Central',
    aliases: ['bucks', 'milwaukee', 'mil', 'milwaukee bucks']
  },

  // Eastern Conference - Southeast Division
  {
    city: 'Atlanta',
    name: 'Hawks',
    abbr: 'ATL',
    conference: 'Eastern',
    division: 'Southeast',
    aliases: ['hawks', 'atlanta', 'atl', 'atlanta hawks']
  },
  {
    city: 'Charlotte',
    name: 'Hornets',
    abbr: 'CHA',
    conference: 'Eastern',
    division: 'Southeast',
    aliases: ['hornets', 'charlotte', 'cha', 'charlotte hornets']
  },
  {
    city: 'Miami',
    name: 'Heat',
    abbr: 'MIA',
    conference: 'Eastern',
    division: 'Southeast',
    aliases: ['heat', 'miami', 'mia', 'miami heat']
  },
  {
    city: 'Orlando',
    name: 'Magic',
    abbr: 'ORL',
    conference: 'Eastern',
    division: 'Southeast',
    aliases: ['magic', 'orlando', 'orl', 'orlando magic']
  },
  {
    city: 'Washington',
    name: 'Wizards',
    abbr: 'WAS',
    conference: 'Eastern',
    division: 'Southeast',
    aliases: ['wizards', 'washington', 'was', 'washington wizards']
  },

  // Western Conference - Northwest Division
  {
    city: 'Denver',
    name: 'Nuggets',
    abbr: 'DEN',
    conference: 'Western',
    division: 'Northwest',
    aliases: ['nuggets', 'denver', 'den', 'denver nuggets']
  },
  {
    city: 'Minnesota',
    name: 'Timberwolves',
    abbr: 'MIN',
    conference: 'Western',
    division: 'Northwest',
    aliases: ['timberwolves', 'wolves', 'minnesota', 'min', 'minnesota timberwolves', 't-wolves']
  },
  {
    city: 'Oklahoma City',
    name: 'Thunder',
    abbr: 'OKC',
    conference: 'Western',
    division: 'Northwest',
    aliases: ['thunder', 'oklahoma city', 'okc', 'oklahoma city thunder']
  },
  {
    city: 'Portland',
    name: 'Trail Blazers',
    abbr: 'POR',
    conference: 'Western',
    division: 'Northwest',
    aliases: ['trail blazers', 'blazers', 'portland', 'por', 'portland trail blazers']
  },
  {
    city: 'Utah',
    name: 'Jazz',
    abbr: 'UTA',
    conference: 'Western',
    division: 'Northwest',
    aliases: ['jazz', 'utah', 'uta', 'utah jazz']
  },

  // Western Conference - Pacific Division
  {
    city: 'Golden State',
    name: 'Warriors',
    abbr: 'GSW',
    conference: 'Western',
    division: 'Pacific',
    aliases: ['warriors', 'golden state', 'gsw', 'golden state warriors']
  },
  {
    city: 'Los Angeles',
    name: 'Clippers',
    abbr: 'LAC',
    conference: 'Western',
    division: 'Pacific',
    aliases: ['clippers', 'los angeles clippers', 'la clippers', 'lac']
  },
  {
    city: 'Los Angeles',
    name: 'Lakers',
    abbr: 'LAL',
    conference: 'Western',
    division: 'Pacific',
    aliases: ['lakers', 'los angeles lakers', 'la lakers', 'lal', 'l.a. lakers']
  },
  {
    city: 'Phoenix',
    name: 'Suns',
    abbr: 'PHX',
    conference: 'Western',
    division: 'Pacific',
    aliases: ['suns', 'phoenix', 'phx', 'phoenix suns']
  },
  {
    city: 'Sacramento',
    name: 'Kings',
    abbr: 'SAC',
    conference: 'Western',
    division: 'Pacific',
    aliases: ['kings', 'sacramento', 'sac', 'sacramento kings']
  },

  // Western Conference - Southwest Division
  {
    city: 'Dallas',
    name: 'Mavericks',
    abbr: 'DAL',
    conference: 'Western',
    division: 'Southwest',
    aliases: ['mavericks', 'mavs', 'dallas', 'dal', 'dallas mavericks']
  },
  {
    city: 'Houston',
    name: 'Rockets',
    abbr: 'HOU',
    conference: 'Western',
    division: 'Southwest',
    aliases: ['rockets', 'houston', 'hou', 'houston rockets']
  },
  {
    city: 'Memphis',
    name: 'Grizzlies',
    abbr: 'MEM',
    conference: 'Western',
    division: 'Southwest',
    aliases: ['grizzlies', 'grizz', 'memphis', 'mem', 'memphis grizzlies']
  },
  {
    city: 'New Orleans',
    name: 'Pelicans',
    abbr: 'NOP',
    conference: 'Western',
    division: 'Southwest',
    aliases: ['pelicans', 'pels', 'new orleans', 'nop', 'new orleans pelicans']
  },
  {
    city: 'San Antonio',
    name: 'Spurs',
    abbr: 'SAS',
    conference: 'Western',
    division: 'Southwest',
    aliases: ['spurs', 'san antonio', 'sas', 'san antonio spurs']
  },
];

/**
 * Extract teams from NBA market title
 * Works for both Polymarket ("Lakers vs. Celtics") and Kalshi ("Los Angeles at Boston")
 * Returns teams in the order they appear in the title (left to right)
 */
export function extractNBATeamsFromTitle(title: string): NBATeam[] {
  const titleLower = title.toLowerCase();
  const foundTeams: { team: NBATeam; position: number }[] = [];

  for (const team of NBA_TEAMS) {
    for (const alias of team.aliases) {
      // Use word boundaries to avoid false matches
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
 * Check if two NBA markets represent the same game
 */
export function isSameNBAGame(title1: string, title2: string): boolean {
  const teams1 = extractNBATeamsFromTitle(title1);
  const teams2 = extractNBATeamsFromTitle(title2);

  // Must find exactly 2 teams in each title
  if (teams1.length !== 2 || teams2.length !== 2) {
    return false;
  }

  // Check if both sets contain the same teams (order independent)
  const abbrs1 = teams1.map(t => t.abbr).sort();
  const abbrs2 = teams2.map(t => t.abbr).sort();

  return abbrs1[0] === abbrs2[0] && abbrs1[1] === abbrs2[1];
}
