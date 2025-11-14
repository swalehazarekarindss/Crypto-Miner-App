/*import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { authAPI } from '../services/api';

interface Props { navigation: any; }

const LeaderboardScreen: React.FC<Props> = ({ navigation }) => {
  const [items, setItems] = useState<Array<{ walletId: string; totalToken: number }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await authAPI.getLeaderboard();
        setItems(resp?.leaderboard || []);
      } catch (err) {
        setItems([]);
      }
    })();
  }, []);

  return (
    <LinearGradient colors={['#749BC2', '#98A1BC']} style={styles.container} start={{x:0,y:0}} end={{x:1,y:1}}>
      <StatusBar barStyle="light-content" backgroundColor="#749BC2" />
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.walletId}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item, index }) => (
          <LinearGradient colors={['rgba(255,255,255,0.25)','rgba(255,255,255,0.15)']} style={styles.row}>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.wallet}>{item.walletId}</Text>
              <Text style={styles.tokens}>{Number(item.totalToken || 0).toFixed(2)} CMT</Text>
            </View>
          </LinearGradient>
        )}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  backText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  rank: { color: '#fff', fontSize: 18, fontWeight: '800', width: 32, textAlign: 'center' },
  wallet: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tokens: { color: '#E8F4F8', fontSize: 14, fontWeight: '600' },
});

export default LeaderboardScreen;

*/


import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, Path, Defs, RadialGradient, Stop} from 'react-native-svg';
import { authAPI } from '../services/api';

const {width, height} = Dimensions.get('window');

// Same Background SVG as HomeScreen
const BackgroundSVG = () => (
  <Svg height={height} width={width} style={styles.svgBackground}>
    <Defs>
      <RadialGradient id="grad1" cx="50%" cy="50%">
        <Stop offset="0%" stopColor="#9BB4C0" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#E6D8C3" stopOpacity="0.1" />
      </RadialGradient>
    </Defs>
    <Circle cx={width * 0.2} cy={height * 0.15} r="120" fill="url(#grad1)" />
    <Circle cx={width * 0.8} cy={height * 0.3} r="90" fill="#E6D8C3" opacity="0.2" />
    <Circle cx={width * 0.5} cy={height * 0.7} r="150" fill="#016B61" opacity="0.25" />
    <Circle cx={width * 0.9} cy={height * 0.8} r="100" fill="#E6D8C3" opacity="0.2" />
    <Path
      d={`M 0 ${height * 0.6} Q ${width * 0.25} ${height * 0.55} ${width * 0.5} ${height * 0.6} T ${width} ${height * 0.6} L ${width} ${height} L 0 ${height} Z`}
      fill="#F8EDEB"
      opacity="0.3"
    />
  </Svg>
);

interface Props { 
  navigation: any; 
}

const LeaderboardScreen: React.FC<Props> = ({ navigation }) => {
  const [items, setItems] = useState<Array<{ walletId: string; totalToken: number }>>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    (async () => {
      try {
        const resp = await authAPI.getLeaderboard();
        setItems(resp?.leaderboard || []);
        
        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      } catch (err) {
        setItems([]);
      }
    })();
  }, []);

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '🏅';
  };

  const getGradientColors = (index: number): [string, string] => {
    if (index === 0) return ['#B95E82', '#FFA500']; // Gold
    if (index === 1) return ['#B95E82', '#A8A8A8']; // Silver
    if (index === 2) return ['#B95E82', '#B87333']; // Bronze
    return ['#F2EAD3', '#DDC3C3']; // Default
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B3C53', '#1B3C53', '#1B3C53', '#1B3C53']}
        style={StyleSheet.absoluteFill}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      />
      <StatusBar barStyle="light-content" backgroundColor="#1B3C53" />
      
      <BackgroundSVG />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🏆</Text>
          <View>
            <Text style={styles.title}>Leaderboard</Text>
            <Text style={styles.subtitle}>Top Crypto Miners</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
            style={styles.backBtnGradient}>
            <Text style={styles.backText}>← Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Leaderboard List */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.walletId}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No miners yet</Text>
              <Text style={styles.emptySubtext}>Be the first to mine tokens!</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <LeaderboardItem 
              item={item} 
              index={index} 
              getMedalEmoji={getMedalEmoji}
              getGradientColors={getGradientColors}
            />
          )}
        />
      </Animated.View>
    </View>
  );
};

// Separate component for each leaderboard item
const LeaderboardItem: React.FC<{
  item: { walletId: string; totalToken: number };
  index: number;
  getMedalEmoji: (index: number) => string;
  getGradientColors: (index: number) => [string, string];
}> = ({ item, index, getMedalEmoji, getGradientColors }) => {
  const itemAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: itemAnim,
        transform: [
          {
            translateY: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          },
        ],
      }}>
      <TouchableOpacity activeOpacity={0.9}>
        <LinearGradient
          colors={getGradientColors(index)}
          style={[
            styles.row,
            index < 3 && styles.topThreeRow,
          ]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          {/* Rank Badge */}
          <View style={[styles.rankBadge, index < 3 && styles.topThreeRankBadge]}>
            <Text style={styles.rankEmoji}>{getMedalEmoji(index)}</Text>
            <Text style={[styles.rank, index < 3 && styles.topThreeRank]}>#{index + 1}</Text>
          </View>

          {/* Wallet Info */}
          <View style={styles.walletInfo}>
            <View style={styles.walletRow}>
              <Text style={styles.walletIcon}>👤</Text>
              <Text style={[styles.wallet, index < 3 && styles.topThreeText]} numberOfLines={1}>
                {item.walletId}
              </Text>
            </View>
            <View style={styles.tokensRow}>
              <Text style={styles.tokenIcon}>💎</Text>
              <Text style={[styles.tokens, index < 3 && styles.topThreeTokens]}>
                {Number(item.totalToken || 0).toFixed(2)} CMT
              </Text>
            </View>
          </View>

          {/* Arrow Indicator */}
          {index < 3 && (
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>▶</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    fontSize: 40,
  },
  title: { 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#E8F4F8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  backBtn: { 
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  backBtnGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backText: { 
    color: '#fff', 
    fontWeight: '800',
    fontSize: 15,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 18, 
    marginBottom: 12, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.25)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  topThreeRow: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    elevation: 8,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    marginBottom: 16,
  },
  rankBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  topThreeRankBadge: {
    minWidth: 60,
  },
  rankEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  rank: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  topThreeRank: {
    fontSize: 16,
    color: '#FFF',
  },
  walletInfo: {
    flex: 1,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  walletIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  wallet: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '700',
    flex: 1,
  },
  topThreeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  tokensRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  tokens: { 
    color: '#E8F4F8', 
    fontSize: 14, 
    fontWeight: '700',
  },
  topThreeTokens: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#E8F4F8',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LeaderboardScreen;