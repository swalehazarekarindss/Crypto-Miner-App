import React, { useEffect, useState } from 'react';
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

