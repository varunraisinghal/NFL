import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Linking,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

// NFL Team mappings for market matching
const NFL_TEAMS = {
  'Arizona Cardinals': ['ARI', 'Cardinals', 'Arizona'],
  'Atlanta Falcons': ['ATL', 'Falcons', 'Atlanta'],
  'Baltimore Ravens': ['BAL', 'Ravens', 'Baltimore'],
  'Buffalo Bills': ['BUF', 'Bills', 'Buffalo'],
  'Carolina Panthers': ['CAR', 'Panthers', 'Carolina'],
  'Chicago Bears': ['CHI', 'Bears', 'Chicago'],
  'Cincinnati Bengals': ['CIN', 'Bengals', 'Cincinnati'],
  'Cleveland Browns': ['CLE', 'Browns', 'Cleveland'],
  'Dallas Cowboys': ['DAL', 'Cowboys', 'Dallas'],
  'Denver Broncos': ['DEN', 'Broncos', 'Denver'],
  'Detroit Lions': ['DET', 'Lions', 'Detroit'],
  'Green Bay Packers': ['GB', 'Packers', 'Green Bay'],
  'Houston Texans': ['HOU', 'Texans', 'Houston'],
  'Indianapolis Colts': ['IND', 'Colts', 'Indianapolis'],
  'Jacksonville Jaguars': ['JAX', 'Jaguars', 'Jacksonville'],
  'Kansas City Chiefs': ['KC', 'Chiefs', 'Kansas City'],
  'Las Vegas Raiders': ['LV', 'Raiders', 'Las Vegas'],
  'Los Angeles Chargers': ['LAC', 'Chargers', 'LA Chargers'],
  'Los Angeles Rams': ['LAR', 'Rams', 'LA Rams'],
  'Miami Dolphins': ['MIA', 'Dolphins', 'Miami'],
  'Minnesota Vikings': ['MIN', 'Vikings', 'Minnesota'],
  'New England Patriots': ['NE', 'Patriots', 'New England'],
  'New Orleans Saints': ['NO', 'Saints', 'New Orleans'],
  'New York Giants': ['NYG', 'Giants', 'NY Giants'],
  'New York Jets': ['NYJ', 'Jets', 'NY Jets'],
  'Philadelphia Eagles': ['PHI', 'Eagles', 'Philadelphia'],
  'Pittsburgh Steelers': ['PIT', 'Steelers', 'Pittsburgh'],
  'San Francisco 49ers': ['SF', '49ers', 'San Francisco'],
  'Seattle Seahawks': ['SEA', 'Seahawks', 'Seattle'],
  'Tampa Bay Buccaneers': ['TB', 'Buccaneers', 'Tampa Bay'],
  'Tennessee Titans': ['TEN', 'Titans', 'Tennessee'],
  'Washington Commanders': ['WAS', 'Commanders', 'Washington'],
};

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NFLArbitrageApp = () => {
  // State management
  const [opportunities, setOpportunities] = useState([]);
  const [polymarkets, setPolymarkets] = useState([]);
  const [kalshiMarkets, setKalshiMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Settings state
  const [settings, setSettings] = useState({
    profitThreshold: 2.0, // Default 2% minimum
    refreshInterval: 30, // seconds
    notifications: true,
    stakeStrategy: 'equal', // 'equal' or 'kelly'
    targetPayout: 100, // Default $100 payout target
    autoRefresh: true,
    includeFees: true, // Account for platform fees
  });
  
  // Kelly Criterion settings (advanced)
  const [kellyProbabilities, setKellyProbabilities] = useState({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fetch Polymarket NFL markets using Gamma API
  const fetchPolymarketNFL = async () => {
    try {
      // First get sports metadata to find NFL tag
      const sportsResponse = await fetch('https://gamma-api.polymarket.com/sports');
      const sportsData = await sportsResponse.json();
      
      // Find NFL sport entry
      const nflSport = sportsData.find(sport => 
        sport.name === 'NFL' || sport.name === 'American Football'
      );
      
      if (!nflSport) {
        console.log('NFL sport not found in Polymarket');
        return [];
      }
      
      // Fetch NFL markets using the tag or series ID
      const marketsUrl = nflSport.tag_id 
        ? `https://gamma-api.polymarket.com/markets?tag_id=${nflSport.tag_id}&status=open`
        : `https://gamma-api.polymarket.com/markets?series=${nflSport.series}&status=open`;
        
      const marketsResponse = await fetch(marketsUrl);
      const markets = await marketsResponse.json();
      
      // Process markets to extract NFL game data
      return markets.map(market => {
        // Extract team names from market question
        const teams = extractTeamsFromTitle(market.question || market.title);
        
        return {
          id: market.id,
          slug: market.slug,
          platform: 'Polymarket',
          title: market.question || market.title,
          teams: teams,
          yesPrice: parseFloat(market.outcomes?.Yes || market.yes_price || 0.5),
          noPrice: parseFloat(market.outcomes?.No || market.no_price || 0.5),
          volume: parseFloat(market.volume || 0),
          liquidity: parseFloat(market.liquidity || 0),
          url: `https://polymarket.com/market/${market.slug}`,
          lastUpdate: new Date().toISOString(),
        };
      }).filter(m => m.teams.length === 2); // Only binary team matchups
      
    } catch (error) {
      console.error('Error fetching Polymarket data:', error);
      return [];
    }
  };

  // Fetch Kalshi NFL markets
  const fetchKalshiNFL = async () => {
    try {
      // Using Kalshi's public Trade API v2
      const response = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?status=open');
      const data = await response.json();
      
      // Filter for NFL markets
      const nflMarkets = (data.markets || []).filter(market => {
        const title = (market.title || '').toLowerCase();
        const category = (market.category || '').toLowerCase();
        
        // Check if it's an NFL market
        return category === 'sports' || category === 'football' || 
               Object.keys(NFL_TEAMS).some(team => 
                 title.includes(team.toLowerCase()) ||
                 NFL_TEAMS[team].some(variant => 
                   title.includes(variant.toLowerCase())
                 )
               );
      });
      
      return nflMarkets.map(market => {
        const teams = extractTeamsFromTitle(market.title);
        
        // Kalshi provides yes_price in cents, convert to decimal
        const yesPrice = market.yes_price ? market.yes_price / 100 : 0.5;
        const noPrice = 1 - yesPrice; // Complementary pricing
        
        return {
          id: market.ticker || market.id,
          platform: 'Kalshi',
          title: market.title,
          teams: teams,
          yesPrice: yesPrice,
          noPrice: noPrice,
          volume: parseFloat(market.volume || 0),
          openInterest: parseFloat(market.open_interest || 0),
          url: `https://kalshi.com/markets/${market.ticker || market.id}`,
          lastUpdate: new Date().toISOString(),
        };
      }).filter(m => m.teams.length === 2);
      
    } catch (error) {
      console.error('Error fetching Kalshi data:', error);
      return [];
    }
  };

  // Extract team names from market title
  const extractTeamsFromTitle = (title) => {
    const teams = [];
    const normalizedTitle = title.toLowerCase();
    
    for (const [fullName, variants] of Object.entries(NFL_TEAMS)) {
      const allVariants = [fullName.toLowerCase(), ...variants.map(v => v.toLowerCase())];
      
      if (allVariants.some(variant => normalizedTitle.includes(variant))) {
        teams.push(fullName);
        if (teams.length === 2) break;
      }
    }
    
    return teams;
  };

  // Match markets between platforms
  const matchMarkets = (polyMarkets, kalshiMarkets) => {
    const matched = [];
    
    polyMarkets.forEach(polyMarket => {
      kalshiMarkets.forEach(kalshiMarket => {
        // Check if both markets have the same teams (order-independent)
        const polyTeamsSet = new Set(polyMarket.teams);
        const kalshiTeamsSet = new Set(kalshiMarket.teams);
        
        const intersection = [...polyTeamsSet].filter(x => kalshiTeamsSet.has(x));
        
        if (intersection.length === 2) {
          // Markets match!
          matched.push({
            polymarket: polyMarket,
            kalshi: kalshiMarket,
            teams: polyMarket.teams,
            matchTitle: `${polyMarket.teams[0]} vs ${polyMarket.teams[1]}`,
          });
        }
      });
    });
    
    return matched;
  };

  // Calculate arbitrage opportunities
  const calculateArbitrage = (matchedMarkets) => {
    const arbs = [];
    
    matchedMarkets.forEach(match => {
      const poly = match.polymarket;
      const kalshi = match.kalshi;
      
      // Option A: Buy Yes on Polymarket, No on Kalshi
      const costA = poly.yesPrice + kalshi.noPrice;
      
      // Option B: Buy No on Polymarket, Yes on Kalshi  
      const costB = poly.noPrice + kalshi.yesPrice;
      
      // Check for arbitrage (cost < 1 means guaranteed profit)
      let arbOption = null;
      let totalCost = 0;
      let profitMargin = 0;
      
      if (costA < 1) {
        arbOption = 'A';
        totalCost = costA;
        profitMargin = (1 - costA) * 100;
      } else if (costB < 1) {
        arbOption = 'B';
        totalCost = costB;
        profitMargin = (1 - costB) * 100;
      }
      
      // Apply fee adjustment if enabled
      if (settings.includeFees && profitMargin > 0) {
        // Polymarket: ~2% on winnings, Kalshi: ~0.5% per contract
        const feeAdjustment = 2.5; // Conservative estimate
        profitMargin = Math.max(0, profitMargin - feeAdjustment);
      }
      
      // Only include if above threshold
      if (profitMargin >= settings.profitThreshold) {
        const targetPayout = settings.targetPayout || 100;
        
        // Calculate stakes for target payout
        let polyStake, kalshiStake, polyOutcome, kalshiOutcome;
        
        if (arbOption === 'A') {
          polyStake = poly.yesPrice * targetPayout;
          kalshiStake = kalshi.noPrice * targetPayout;
          polyOutcome = 'Yes';
          kalshiOutcome = 'No';
        } else {
          polyStake = poly.noPrice * targetPayout;
          kalshiStake = kalshi.yesPrice * targetPayout;
          polyOutcome = 'No';
          kalshiOutcome = 'Yes';
        }
        
        arbs.push({
          id: `${poly.id}_${kalshi.id}`,
          matchTitle: match.matchTitle,
          teams: match.teams,
          profitMargin: profitMargin,
          profitAmount: (targetPayout * profitMargin / 100).toFixed(2),
          totalCost: totalCost,
          arbOption: arbOption,
          polymarket: {
            ...poly,
            stake: polyStake.toFixed(2),
            outcome: polyOutcome,
            displayPrice: arbOption === 'A' ? poly.yesPrice : poly.noPrice,
          },
          kalshi: {
            ...kalshi,
            stake: kalshiStake.toFixed(2),
            outcome: kalshiOutcome,
            displayPrice: arbOption === 'A' ? kalshi.noPrice : kalshi.yesPrice,
          },
          totalStake: (polyStake + kalshiStake).toFixed(2),
          targetPayout: targetPayout,
          timestamp: new Date().toISOString(),
        });
      }
    });
    
    // Sort by profit margin (highest first)
    return arbs.sort((a, b) => b.profitMargin - a.profitMargin);
  };

  // Kelly Criterion calculation (advanced mode)
  const calculateKellyStakes = (opportunity, userProbability) => {
    // Kelly formula: f = (p*b - q) / b
    // where f = fraction of bankroll, p = probability of win,
    // q = 1-p, b = net odds (decimal odds - 1)
    
    const p = userProbability;
    const q = 1 - p;
    
    // Calculate for both sides
    const polyOdds = 1 / opportunity.polymarket.displayPrice;
    const kalshiOdds = 1 / opportunity.kalshi.displayPrice;
    
    const kellyPoly = Math.max(0, (p * (polyOdds - 1) - q) / (polyOdds - 1));
    const kellyKalshi = Math.max(0, (q * (kalshiOdds - 1) - p) / (kalshiOdds - 1));
    
    // Scale to target amount (conservative Kelly at 25% of full Kelly)
    const conservativeFactor = 0.25;
    const polyStake = (settings.targetPayout * kellyPoly * conservativeFactor).toFixed(2);
    const kalshiStake = (settings.targetPayout * kellyKalshi * conservativeFactor).toFixed(2);
    
    return {
      polyStake,
      kalshiStake,
      totalStake: (parseFloat(polyStake) + parseFloat(kalshiStake)).toFixed(2),
      expectedValue: ((p * polyOdds * polyStake) + (q * kalshiOdds * kalshiStake) - 
                     (parseFloat(polyStake) + parseFloat(kalshiStake))).toFixed(2),
    };
  };

  // Main refresh function
  const refreshData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch from both platforms in parallel
      const [polyData, kalshiData] = await Promise.all([
        fetchPolymarketNFL(),
        fetchKalshiNFL()
      ]);
      
      setPolymarkets(polyData);
      setKalshiMarkets(kalshiData);
      
      // Match markets
      const matched = matchMarkets(polyData, kalshiData);
      
      // Calculate arbitrage opportunities
      const arbs = calculateArbitrage(matched);
      
      // Check for new high-value opportunities
      if (settings.notifications && arbs.length > 0) {
        const bestArb = arbs[0];
        const previousBest = opportunities[0];
        
        if (!previousBest || bestArb.profitMargin > previousBest.profitMargin) {
          await sendNotification(
            `🏈 ${bestArb.profitMargin.toFixed(2)}% NFL Arbitrage!`,
            `${bestArb.matchTitle} - Profit: $${bestArb.profitAmount}`
          );
          
          // Haptic feedback for new opportunity
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      
      setOpportunities(arbs);
      setLastUpdated(new Date());
      
      // Animate updates
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
      console.error('Refresh error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Send push notification
  const sendNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'nfl_arbitrage' },
        sound: true,
      },
      trigger: null,
    });
  };

  // Open market in browser/app
  const openMarket = (url, platform) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Try deep linking first (if apps are installed)
    const deepLink = platform === 'Polymarket' 
      ? url.replace('https://', 'polymarket://') 
      : url.replace('https://', 'kalshi://');
    
    Linking.canOpenURL(deepLink).then(supported => {
      if (supported) {
        Linking.openURL(deepLink);
      } else {
        Linking.openURL(url);
      }
    }).catch(() => {
      Linking.openURL(url);
    });
  };

  // Initialize and setup auto-refresh
  useEffect(() => {
    // Load saved settings
    AsyncStorage.getItem('arbSettings').then(saved => {
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    });
    
    // Request notification permissions
    Notifications.requestPermissionsAsync();
    
    // Initial data load
    refreshData();
    
    // Pulse animation for live indicator
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    if (settings.autoRefresh) {
      const interval = setInterval(refreshData, settings.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [settings.autoRefresh, settings.refreshInterval]);

  // Save settings when changed
  useEffect(() => {
    AsyncStorage.setItem('arbSettings', JSON.stringify(settings));
  }, [settings]);

  // Render opportunity card
  const OpportunityCard = ({ opportunity }) => {
    const [expanded, setExpanded] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const handlePress = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      setExpanded(!expanded);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    
    return (
      <Animated.View style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          <LinearGradient
            colors={
              opportunity.profitMargin > 5 
                ? ['#10B981', '#059669'] 
                : opportunity.profitMargin > 3
                ? ['#3B82F6', '#2563EB']
                : ['#8B5CF6', '#7C3AED']
            }
            style={styles.profitHeader}
          >
            <View style={styles.profitHeaderContent}>
              <View>
                <Text style={styles.matchTitle}>{opportunity.matchTitle}</Text>
                <Text style={styles.matchTime}>
                  Last updated: {new Date(opportunity.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.profitBadge}>
                <Text style={styles.profitPercent}>
                  +{opportunity.profitMargin.toFixed(2)}%
                </Text>
                <Text style={styles.profitDollar}>
                  ${opportunity.profitAmount}
                </Text>
              </View>
            </View>
          </LinearGradient>
          
          <View style={styles.cardContent}>
            {/* Stakes Summary */}
            <View style={styles.stakesContainer}>
              <View style={styles.stakeBox}>
                <Text style={styles.platformLabel}>Polymarket</Text>
                <Text style={styles.outcomeText}>
                  {opportunity.polymarket.outcome} @ {opportunity.polymarket.displayPrice.toFixed(3)}
                </Text>
                <Text style={styles.stakeAmount}>${opportunity.polymarket.stake}</Text>
              </View>
              
              <View style={styles.plusSign}>
                <Text style={styles.plusText}>+</Text>
              </View>
              
              <View style={styles.stakeBox}>
                <Text style={styles.platformLabel}>Kalshi</Text>
                <Text style={styles.outcomeText}>
                  {opportunity.kalshi.outcome} @ {opportunity.kalshi.displayPrice.toFixed(3)}
                </Text>
                <Text style={styles.stakeAmount}>${opportunity.kalshi.stake}</Text>
              </View>
            </View>
            
            {/* Total and Actions */}
            <View style={styles.summaryRow}>
              <Text style={styles.totalText}>
                Total Stake: ${opportunity.totalStake} → ${opportunity.targetPayout}
              </Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.polyButton]}
                onPress={() => openMarket(opportunity.polymarket.url, 'Polymarket')}
              >
                <Text style={styles.actionButtonText}>Open Polymarket</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.kalshiButton]}
                onPress={() => openMarket(opportunity.kalshi.url, 'Kalshi')}
              >
                <Text style={styles.actionButtonText}>Open Kalshi</Text>
              </TouchableOpacity>
            </View>
            
            {/* Expanded Details */}
            {expanded && (
              <View style={styles.expandedContent}>
                <Text style={styles.detailsTitle}>Arbitrage Details</Text>
                <Text style={styles.detailsText}>
                  This opportunity exists because Polymarket implies {opportunity.teams[0]} has a{' '}
                  {(opportunity.polymarket.yesPrice * 100).toFixed(1)}% chance to win, 
                  while Kalshi implies a {(opportunity.kalshi.yesPrice * 100).toFixed(1)}% chance.
                  {'\n\n'}
                  By betting opposite sides, you lock in a ${opportunity.profitAmount} profit 
                  regardless of the game outcome.
                  {settings.includeFees && '\n\nNote: Profit accounts for estimated platform fees.'}
                </Text>
                
                {/* Kelly Mode Option */}
                {settings.stakeStrategy === 'kelly' && (
                  <View style={styles.kellySection}>
                    <Text style={styles.kellySectionTitle}>Kelly Criterion Adjustment</Text>
                    <Text style={styles.kellyText}>
                      Enter your estimated probability for {opportunity.teams[0]} to win:
                    </Text>
                    <TextInput
                      style={styles.kellyInput}
                      placeholder="0.50"
                      keyboardType="decimal-pad"
                      onChangeText={(text) => {
                        const prob = parseFloat(text);
                        if (prob >= 0 && prob <= 1) {
                          setKellyProbabilities({
                            ...kellyProbabilities,
                            [opportunity.id]: prob,
                          });
                        }
                      }}
                    />
                    {kellyProbabilities[opportunity.id] && (
                      <View style={styles.kellyResults}>
                        {(() => {
                          const kelly = calculateKellyStakes(
                            opportunity,
                            kellyProbabilities[opportunity.id]
                          );
                          return (
                            <>
                              <Text style={styles.kellyResultText}>
                                Suggested Stakes (Kelly):
                              </Text>
                              <Text style={styles.kellyResultText}>
                                Polymarket: ${kelly.polyStake}
                              </Text>
                              <Text style={styles.kellyResultText}>
                                Kalshi: ${kelly.kalshiStake}
                              </Text>
                              <Text style={styles.kellyResultText}>
                                Expected Value: ${kelly.expectedValue}
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Settings Modal Component
  const SettingsModal = ({ visible, onClose }) => {
    if (!visible) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Settings</Text>
          
          {/* Profit Threshold */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Minimum Profit %</Text>
            <TextInput
              style={styles.settingInput}
              value={settings.profitThreshold.toString()}
              keyboardType="decimal-pad"
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                setSettings({ ...settings, profitThreshold: value });
              }}
            />
          </View>
          
          {/* Target Payout */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Target Payout ($)</Text>
            <TextInput
              style={styles.settingInput}
              value={settings.targetPayout.toString()}
              keyboardType="numeric"
              onChangeText={(text) => {
                const value = parseInt(text) || 100;
                setSettings({ ...settings, targetPayout: value });
              }}
            />
          </View>
          
          {/* Refresh Interval */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Refresh (seconds)</Text>
            <TextInput
              style={styles.settingInput}
              value={settings.refreshInterval.toString()}
              keyboardType="numeric"
              onChangeText={(text) => {
                const value = Math.max(10, parseInt(text) || 30);
                setSettings({ ...settings, refreshInterval: value });
              }}
            />
          </View>
          
          {/* Auto Refresh Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Refresh</Text>
            <Switch
              value={settings.autoRefresh}
              onValueChange={(value) => {
                setSettings({ ...settings, autoRefresh: value });
              }}
              trackColor={{ false: '#767577', true: '#10B981' }}
              thumbColor={settings.autoRefresh ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          {/* Notifications Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => {
                setSettings({ ...settings, notifications: value });
              }}
              trackColor={{ false: '#767577', true: '#10B981' }}
              thumbColor={settings.notifications ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          {/* Include Fees Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Account for Fees</Text>
            <Switch
              value={settings.includeFees}
              onValueChange={(value) => {
                setSettings({ ...settings, includeFees: value });
              }}
              trackColor={{ false: '#767577', true: '#10B981' }}
              thumbColor={settings.includeFees ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          {/* Stake Strategy */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Strategy</Text>
            <View style={styles.strategyButtons}>
              <TouchableOpacity
                style={[
                  styles.strategyButton,
                  settings.stakeStrategy === 'equal' && styles.strategyButtonActive
                ]}
                onPress={() => setSettings({ ...settings, stakeStrategy: 'equal' })}
              >
                <Text style={[
                  styles.strategyButtonText,
                  settings.stakeStrategy === 'equal' && styles.strategyButtonTextActive
                ]}>
                  Equal Payout
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.strategyButton,
                  settings.stakeStrategy === 'kelly' && styles.strategyButtonActive
                ]}
                onPress={() => setSettings({ ...settings, stakeStrategy: 'kelly' })}
              >
                <Text style={[
                  styles.strategyButtonText,
                  settings.stakeStrategy === 'kelly' && styles.strategyButtonTextActive
                ]}>
                  Kelly Criterion
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const [showSettings, setShowSettings] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>🏈 NFL Arbitrage</Text>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{opportunities.length}</Text>
            <Text style={styles.statLabel}>Opportunities</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{polymarkets.length}</Text>
            <Text style={styles.statLabel}>Polymarket</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{kalshiMarkets.length}</Text>
            <Text style={styles.statLabel}>Kalshi</Text>
          </View>
          <View style={styles.statBox}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.liveIndicator} />
            </Animated.View>
            <Text style={styles.statLabel}>Live</Text>
          </View>
        </View>
      </LinearGradient>
      
      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              refreshData();
            }}
            tintColor="#10B981"
          />
        }
      >
        {isLoading && opportunities.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Scanning NFL markets...</Text>
          </View>
        ) : opportunities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏈</Text>
            <Text style={styles.emptyTitle}>No Arbitrage Found</Text>
            <Text style={styles.emptySubtitle}>
              {settings.profitThreshold > 0 
                ? `No opportunities above ${settings.profitThreshold}% profit`
                : 'Pull down to refresh'}
            </Text>
            {lastUpdated && (
              <Text style={styles.lastUpdateText}>
                Last checked: {lastUpdated.toLocaleTimeString()}
              </Text>
            )}
          </View>
        ) : (
          <>
            {opportunities.map(opp => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Found {opportunities.length} arbitrage opportunities
              </Text>
              <Text style={styles.footerSubtext}>
                Best profit: {opportunities[0]?.profitMargin.toFixed(2)}% 
                (${opportunities[0]?.profitAmount})
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      
      {/* Settings Modal */}
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginTop: 7,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  profitHeader: {
    padding: 15,
  },
  profitHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  matchTime: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  profitBadge: {
    alignItems: 'flex-end',
  },
  profitPercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profitDollar: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  cardContent: {
    padding: 15,
  },
  stakesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  stakeBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  plusSign: {
    marginHorizontal: 10,
  },
  plusText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  platformLabel: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '600',
    marginBottom: 4,
  },
  outcomeText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stakeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  summaryRow: {
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  polyButton: {
    backgroundColor: '#8B5CF6',
  },
  kalshiButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  detailsText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  kellySection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  kellySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 8,
  },
  kellyText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  kellyInput: {
    backgroundColor: '#374151',
    borderRadius: 6,
    padding: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  kellyResults: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
  },
  kellyResultText: {
    fontSize: 13,
    color: '#10B981',
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 15,
    color: '#9CA3AF',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 10,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  settingInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 16,
    width: 100,
    textAlign: 'right',
  },
  strategyButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  strategyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  strategyButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  strategyButtonText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  strategyButtonTextActive: {
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NFLArbitrageApp;