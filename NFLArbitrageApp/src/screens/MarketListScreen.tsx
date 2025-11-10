// src/screens/MarketListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MarketData, KalshiGroupedGame } from '../types';
import { RootStackParamList } from '../../App';
import { extractTeamsFromTitle } from '../utils/nflTeamMappings';

type MarketListRouteProp = RouteProp<RootStackParamList, 'MarketList'>;

const MarketListScreen = () => {
  const route = useRoute<MarketListRouteProp>();
  const navigation = useNavigation();
  const { markets, platform } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMarkets, setFilteredMarkets] = useState<MarketData[]>(markets);
  const [groupedKalshiGames, setGroupedKalshiGames] = useState<KalshiGroupedGame[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'title'>('volume');

  // Get unique categories
  const categories = ['All', ...new Set(markets.map(m => m.category || 'General'))];

  // Group Kalshi markets by game
  const groupKalshiMarkets = (kalshiMarkets: MarketData[]): KalshiGroupedGame[] => {
    const gameMap = new Map<string, MarketData[]>();

    // Group markets by game
    for (const market of kalshiMarkets) {
      const teams = extractTeamsFromTitle(market.title);
      if (teams.length === 2) {
        const gameKey = [teams[0].abbr, teams[1].abbr].sort().join('-');
        if (!gameMap.has(gameKey)) {
          gameMap.set(gameKey, []);
        }
        gameMap.get(gameKey)!.push(market);
      }
    }

    // Convert to grouped games
    const groupedGames: KalshiGroupedGame[] = [];
    for (const [gameKey, gameMarkets] of gameMap.entries()) {
      if (gameMarkets.length === 2) {
        const teams = extractTeamsFromTitle(gameMarkets[0].title);

        // Find which market belongs to which team
        const team1Market = gameMarkets.find(m =>
          m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === teams[0].abbr.toUpperCase()
        );
        const team2Market = gameMarkets.find(m =>
          m.teams && m.teams.length > 0 && m.teams[0].toUpperCase() === teams[1].abbr.toUpperCase()
        );

        if (team1Market && team2Market) {
          groupedGames.push({
            gameTitle: `${teams[0].name} vs ${teams[1].name}`,
            team1: {
              name: teams[0].name,
              abbr: teams[0].abbr,
              yesPrice: team1Market.yesPrice,
              noPrice: team1Market.noPrice,
            },
            team2: {
              name: teams[1].name,
              abbr: teams[1].abbr,
              yesPrice: team2Market.yesPrice,
              noPrice: team2Market.noPrice,
            },
            volume: team1Market.volume + team2Market.volume,
            endDate: team1Market.endDate,
            url: team1Market.url,
          });
        }
      }
    }

    return groupedGames;
  };
  
  // Filter and sort markets
  useEffect(() => {
    if (platform === 'Kalshi') {
      // Group Kalshi markets by game
      let grouped = groupKalshiMarkets(markets);

      // Apply search filter
      if (searchQuery) {
        grouped = grouped.filter(game =>
          game.gameTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.team1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.team2.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply sorting
      grouped.sort((a, b) => {
        switch (sortBy) {
          case 'volume':
            return b.volume - a.volume;
          case 'price':
            return b.team1.yesPrice - a.team1.yesPrice;
          case 'title':
            return a.gameTitle.localeCompare(b.gameTitle);
          default:
            return 0;
        }
      });

      setGroupedKalshiGames(grouped);
    } else {
      // Polymarket - use normal market filtering
      let filtered = [...markets];

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(market =>
          market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (market.category?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      // Apply category filter
      if (selectedCategory !== 'All') {
        filtered = filtered.filter(market =>
          (market.category || 'General') === selectedCategory
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'volume':
            return b.volume - a.volume;
          case 'price':
            return b.yesPrice - a.yesPrice;
          case 'title':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });

      setFilteredMarkets(filtered);
    }
  }, [searchQuery, selectedCategory, sortBy, markets, platform]);
  
  const handleMarketPress = (market: MarketData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Open the market URL or show more details
    // You could navigate to a detail screen or open the URL
    console.log('Market pressed:', market.title);
  };

  const handleKalshiGamePress = (game: KalshiGroupedGame) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Game pressed:', game.gameTitle);
  };

  const getPlatformColor = () => {
    return platform === 'Polymarket' ? '#8B5CF6' : '#3B82F6';
  };

  // Render grouped Kalshi game card (like Kalshi website)
  const renderKalshiGameCard = (game: KalshiGroupedGame) => {
    return (
      <TouchableOpacity
        key={game.gameTitle}
        style={styles.kalshiGameCard}
        onPress={() => handleKalshiGamePress(game)}
        activeOpacity={0.7}
      >
        <View style={styles.kalshiGameHeader}>
          <Text style={styles.kalshiGameTitle}>{game.gameTitle}</Text>
          {game.volume > 0 && (
            <Text style={styles.kalshiVolume}>${game.volume.toLocaleString()} vol</Text>
          )}
        </View>

        {/* Team 1 */}
        <View style={styles.kalshiTeamRow}>
          <View style={styles.kalshiTeamInfo}>
            <Text style={styles.kalshiTeamName}>{game.team1.name}</Text>
          </View>
          <View style={styles.kalshiPricesRow}>
            <View style={styles.kalshiPriceBox}>
              <Text style={styles.kalshiPriceLabel}>Yes</Text>
              <Text style={styles.kalshiYesPrice}>{(game.team1.yesPrice * 100).toFixed(0)}¢</Text>
            </View>
            <View style={styles.kalshiPriceBox}>
              <Text style={styles.kalshiPriceLabel}>No</Text>
              <Text style={styles.kalshiNoPrice}>{(game.team1.noPrice * 100).toFixed(0)}¢</Text>
            </View>
          </View>
        </View>

        {/* Team 2 */}
        <View style={styles.kalshiTeamRow}>
          <View style={styles.kalshiTeamInfo}>
            <Text style={styles.kalshiTeamName}>{game.team2.name}</Text>
          </View>
          <View style={styles.kalshiPricesRow}>
            <View style={styles.kalshiPriceBox}>
              <Text style={styles.kalshiPriceLabel}>Yes</Text>
              <Text style={styles.kalshiYesPrice}>{(game.team2.yesPrice * 100).toFixed(0)}¢</Text>
            </View>
            <View style={styles.kalshiPriceBox}>
              <Text style={styles.kalshiPriceLabel}>No</Text>
              <Text style={styles.kalshiNoPrice}>{(game.team2.noPrice * 100).toFixed(0)}¢</Text>
            </View>
          </View>
        </View>

        {game.endDate && (
          <Text style={styles.kalshiEndDate}>
            Ends: {new Date(game.endDate).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderMarketCard = (market: MarketData) => {
    const impliedYesProb = (market.yesPrice * 100).toFixed(1);
    const impliedNoProb = (market.noPrice * 100).toFixed(1);
    
    return (
      <TouchableOpacity
        key={market.id}
        style={styles.marketCard}
        onPress={() => handleMarketPress(market)}
        activeOpacity={0.7}
      >
        <View style={styles.marketHeader}>
          <Text style={styles.marketTitle} numberOfLines={2}>
            {market.title}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: getPlatformColor() }]}>
            <Text style={styles.categoryText}>{market.category || 'General'}</Text>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Yes</Text>
            <Text style={styles.priceValue}>${market.yesPrice.toFixed(3)}</Text>
            <Text style={styles.probValue}>{impliedYesProb}%</Text>
          </View>
          
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>No</Text>
            <Text style={styles.priceValue}>${market.noPrice.toFixed(3)}</Text>
            <Text style={styles.probValue}>{impliedNoProb}%</Text>
          </View>
          
          {market.volume > 0 && (
            <View style={styles.volumeBox}>
              <Text style={styles.volumeLabel}>Volume</Text>
              <Text style={styles.volumeValue}>${market.volume.toLocaleString()}</Text>
            </View>
          )}
        </View>
        
        {market.endDate && (
          <Text style={styles.endDate}>
            Ends: {new Date(market.endDate).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={platform === 'Polymarket' ? ['#8B5CF6', '#7C3AED'] : ['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{platform} Markets</Text>
        <Text style={styles.headerSubtitle}>
          {platform === 'Kalshi'
            ? `${groupedKalshiGames.length} games`
            : `${markets.length} markets`}
        </Text>
      </LinearGradient>
      
      <View style={styles.controls}>
        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search markets..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.slice(0, 10).map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'volume' && styles.sortButtonActive]}
              onPress={() => setSortBy('volume')}
            >
              <Text style={styles.sortButtonText}>Volume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
              onPress={() => setSortBy('price')}
            >
              <Text style={styles.sortButtonText}>Price</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'title' && styles.sortButtonActive]}
              onPress={() => setSortBy('title')}
            >
              <Text style={styles.sortButtonText}>Name</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <ScrollView
        style={styles.marketList}
        contentContainerStyle={styles.marketListContent}
        showsVerticalScrollIndicator={false}
      >
        {platform === 'Kalshi' ? (
          groupedKalshiGames.length > 0 ? (
            groupedKalshiGames.map(game => renderKalshiGameCard(game))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No games found matching your criteria
              </Text>
            </View>
          )
        ) : (
          filteredMarkets.length > 0 ? (
            filteredMarkets.map(market => renderMarketCard(market))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No markets found matching your criteria
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 5,
  },
  controls: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchBar: {
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
  },
  categoryScroll: {
    marginBottom: 10,
    maxHeight: 40,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 20,
    marginRight: 8,
    height: 35,
  },
  categoryChipActive: {
    backgroundColor: '#10B981',
  },
  categoryChipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  sortButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sortButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  marketList: {
    flex: 1,
  },
  marketListContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  marketCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  marketHeader: {
    marginBottom: 12,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    opacity: 0.8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 2,
  },
  probValue: {
    fontSize: 13,
    color: '#60A5FA',
  },
  volumeBox: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  volumeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  volumeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Kalshi grouped game card styles
  kalshiGameCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  kalshiGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  kalshiGameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  kalshiVolume: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 10,
  },
  kalshiTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  kalshiTeamInfo: {
    flex: 1,
  },
  kalshiTeamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  kalshiPricesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kalshiPriceBox: {
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
  },
  kalshiPriceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  kalshiYesPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  kalshiNoPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  kalshiEndDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    paddingTop: 8,
  },
});

export default MarketListScreen;