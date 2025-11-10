// src/screens/DebugScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { polymarketAPI } from '../services/polymarketAPI';
import { kalshiAPI } from '../services/kalshiAPI';
import { MarketData } from '../types';

const DebugScreen = () => {
  const [polymarketData, setPolymarketData] = useState<MarketData[]>([]);
  const [kalshiData, setKalshiData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedSection, setExpandedSection] = useState<'poly' | 'kalshi' | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    console.log('🔄 Debug Screen: Fetching data...');

    try {
      const [polyMarkets, kalshiMarkets] = await Promise.all([
        polymarketAPI.fetchAllMarkets(),
        kalshiAPI.fetchAllMarkets(),
      ]);

      console.log(`📊 Debug: Poly=${polyMarkets.length}, Kalshi=${kalshiMarkets.length}`);

      setPolymarketData(polyMarkets);
      setKalshiData(kalshiMarkets);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Debug fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchData}
            tintColor="#10B981"
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          style={styles.header}
        >
          <Text style={styles.title}>API Debug</Text>
          {lastUpdate && (
            <Text style={styles.lastUpdate}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
          <Text style={styles.subtitle}>Pull down to refresh</Text>
        </LinearGradient>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Fetching API data...</Text>
          </View>
        )}

        {/* Polymarket Section */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedSection(expandedSection === 'poly' ? null : 'poly')}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionTitle}>Polymarket</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{polymarketData.length}</Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>
            {expandedSection === 'poly' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {expandedSection === 'poly' && (
          <View style={styles.sectionContent}>
            {polymarketData.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No markets found</Text>
                <Text style={styles.emptySubtext}>
                  Polymarket may not have active markets accepting orders
                </Text>
              </View>
            ) : (
              polymarketData.map((market, index) => (
                <View key={market.id || index} style={styles.marketCard}>
                  <Text style={styles.marketTitle} numberOfLines={3}>
                    {market.title}
                  </Text>
                  <View style={styles.marketDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ID:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {market.id}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category:</Text>
                      <Text style={styles.detailValue}>{market.category || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Yes Price:</Text>
                      <Text style={styles.priceValue}>${market.yesPrice.toFixed(3)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>No Price:</Text>
                      <Text style={styles.priceValue}>${market.noPrice.toFixed(3)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Volume:</Text>
                      <Text style={styles.detailValue}>
                        ${market.volume?.toLocaleString() || '0'}
                      </Text>
                    </View>
                    {market.endDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>End Date:</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {new Date(market.endDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Kalshi Section */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedSection(expandedSection === 'kalshi' ? null : 'kalshi')}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionTitle}>Kalshi</Text>
            <View style={[styles.badge, styles.badgeKalshi]}>
              <Text style={styles.badgeText}>{kalshiData.length}</Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>
            {expandedSection === 'kalshi' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {expandedSection === 'kalshi' && (
          <View style={styles.sectionContent}>
            {kalshiData.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No markets found</Text>
                <Text style={styles.emptySubtext}>
                  Kalshi markets may have no active trading
                </Text>
              </View>
            ) : (
              kalshiData.map((market, index) => (
                <View key={market.id || index} style={styles.marketCard}>
                  <Text style={styles.marketTitle} numberOfLines={3}>
                    {market.title}
                  </Text>
                  <View style={styles.marketDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ticker:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {market.id}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category:</Text>
                      <Text style={styles.detailValue}>{market.category || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Yes Price:</Text>
                      <Text style={styles.priceValue}>${market.yesPrice.toFixed(3)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>No Price:</Text>
                      <Text style={styles.priceValue}>${market.noPrice.toFixed(3)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Volume:</Text>
                      <Text style={styles.detailValue}>
                        ${market.volume?.toLocaleString() || '0'}
                      </Text>
                    </View>
                    {market.openInterest && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Open Interest:</Text>
                        <Text style={styles.detailValue}>
                          ${market.openInterest.toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryText}>
            Total Markets: {polymarketData.length + kalshiData.length}
          </Text>
          <Text style={styles.summaryText}>
            Polymarket: {polymarketData.length} active
          </Text>
          <Text style={styles.summaryText}>
            Kalshi: {kalshiData.length} with prices
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 5,
    opacity: 0.8,
  },
  subtitle: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 2,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 15,
    marginTop: 10,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeKalshi: {
    backgroundColor: '#2563EB',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  expandIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  sectionContent: {
    backgroundColor: '#1F2937',
    padding: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  marketCard: {
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  marketTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  marketDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#E5E7EB',
    flex: 2,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  summary: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 15,
    margin: 15,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 5,
  },
});

export default DebugScreen;
