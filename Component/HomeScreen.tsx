import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  ImageBackground,
  Animated,
  TouchableWithoutFeedback,
  Easing,
  Modal,
  ActivityIndicator,
} from 'react-native';
const _IconModule = require('react-native-vector-icons/MaterialCommunityIcons');
const Icon = _IconModule && _IconModule.default ? _IconModule.default : _IconModule;
import ClockIcon from './Icons/ClockIcon';
import LinearGradient from 'react-native-linear-gradient';
let LottieView: any = null;
try {
  const _l = require('lottie-react-native');
  LottieView = _l && _l.default ? _l.default : _l;
} catch (e) {}
import Svg, {Circle, Path, Defs, RadialGradient, Stop} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI, rewardAPI} from '../services/api';
import {showImmediate} from '../services/NotifcationService';

const {width, height} = Dimensions.get('window');

// Your Original Background SVG
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

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const [walletId, setWalletId] = useState('');
  const [tokens, setTokens] = useState('0');
  const [miningSession, setMiningSession] = useState<any>(null);
  const [miningStatus, setMiningStatus] = useState<string>('idle');
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number | null>(1);
  const [animatedVisible, setAnimatedVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(0.8)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const [userMultiplier, setUserMultiplier] = useState<number>(1);
  
  // Watch Ad states
  const [showAdModal, setShowAdModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [earnedReward, setEarnedReward] = useState(0);
  const rewardScale = useRef(new Animated.Value(0)).current;
  const BASE_RATE = 0.01;

  // keep pulseAnim but don't apply it to tokens
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // ⭐ NEW animations for cards
  const cardPulse = useRef(new Animated.Value(1)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;

  // 🔥 NEW — Start Mining Button Border Animation
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {toValue: 1, duration: 1400, useNativeDriver: false}),
        Animated.timing(glowAnim, {toValue: 0, duration: 1400, useNativeDriver: false}),
      ]),
    ).start();
  }, []);

  const animatedBorder = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.7)'],
  });

  // ---- Your original useEffect ----
  useEffect(() => {
    if (Icon && (Icon as any).loadFont) {
      (Icon as any).loadFont();
    }
    loadUserData();
    fetchStatus();

    // Keep pulse + float animation alive (for Start button)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {toValue: -8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        Animated.timing(floatAnim, {toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
      ]),
    ).start();

    // ⭐ Start animations for cards
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardPulse, {toValue: 1.05, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        Animated.timing(cardPulse, {toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {toValue: -6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        Animated.timing(cardFloat, {toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
      ]),
    ).start();

  }, []);

  const loadUserData = async () => {
    const storedWalletId = await AsyncStorage.getItem('walletId');
    if (storedWalletId) setWalletId(storedWalletId);
  };

  const fetchStatus = async () => {
    try {
      const userResp = await authAPI.getUser();
      if (userResp) setTokens(String(Number(userResp.totalToken || 0).toFixed(2)));

      const {miningAPI} = await import('../services/api');
      const statusResp = await miningAPI.getStatus();
      if (statusResp && statusResp.session) {
        setMiningSession(statusResp.session);
        setMiningStatus(statusResp.session.status || 'idle');
      }
    } catch {}
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await authAPI.logout();
            navigation.replace('Login');
          } catch {}
        },
      },
    ]);
  };

  const handleStartClaiming = () => {
    if (miningSession && miningSession.status === 'mining') {
      navigation.navigate('Mining', {sessionId: miningSession._id});
      return;
    }

    setSelectedHours(1);
    setShowDurationModal(true);
    setAnimatedVisible(true);
    slideAnim.setValue(0.8);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, {toValue: 1, duration: 250, useNativeDriver: true}),
      Animated.spring(slideAnim, {toValue: 1, friction: 8, tension: 40, useNativeDriver: true}),
    ]).start();
  };

  const startMiningWithHours = async (hours: number) => {
    try {
      const {miningAPI} = await import('../services/api');
      const resp = await miningAPI.startMining(hours);
      if (resp && resp.session) {
        setMiningSession(resp.session);
        setMiningStatus('mining');
        navigation.navigate('Mining', {sessionId: resp.session._id});
      }
    } catch (err) {}
  };

  const handleModalNext = () => {
    const hours = selectedHours || 1;
    Animated.parallel([
      Animated.timing(backdropOpacity, {toValue: 0, duration: 200, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0.8, duration: 200, useNativeDriver: true}),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
      startMiningWithHours(hours);
    });
  };

  const handleModalBack = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {toValue: 0, duration: 200, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0.8, duration: 200, useNativeDriver: true}),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
    });
  };

  const handleWatchAd = () => {
    setShowAdModal(true);
  };

  const handleWatchNow = async () => {
    setShowAdModal(false);
    setAdLoading(true);

    // Simulate ad loading for 2 seconds
    setTimeout(async () => {
      try {
        const response = await rewardAPI.watchAd(walletId);
        setEarnedReward(response.randomRewardEarned);
        setTokens(response.newTotalToken.toString());
        setAdLoading(false);
        setShowRewardModal(true);

        // Animate reward popup
        Animated.spring(rewardScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        setAdLoading(false);
        Alert.alert('Error', 'Failed to claim ad reward');
      }
    }, 2000);
  };

  const closeRewardModal = () => {
    Animated.timing(rewardScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowRewardModal(false);
      setEarnedReward(0);
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B3C53', '#1B3C53']}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar barStyle="light-content" backgroundColor="#1B3C53" />

      <BackgroundSVG />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header (Crypto Miner removed) */}
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <ImageBackground
            source={require('./assets/wallet.png')}
            style={styles.walletBackground}
            imageStyle={styles.walletBackgroundImage}>
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)']}
              style={styles.walletGradient}>
              <Text style={styles.walletLabel}>Wallet ID</Text>
              <Text style={styles.walletId}>{walletId}</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Total Tokens */}
        <View style={styles.tokensContainer}>
          <View style={styles.tokensGradient}>
            {LottieView && (
              <LottieView
                source={require('./assets/star.json')}
                autoPlay
                loop
                style={styles.tokensLottie}
              />
            )}
            <Text style={styles.tokensLabel}>Total Tokens</Text>
            <Text style={styles.tokensValue}>{tokens}</Text>
            <Text style={styles.tokensCurrency}>CMT</Text>
          </View>
        </View>

        {/* Start Mining Button */}
        <Animated.View style={[styles.startMiningWrapper, {borderColor: animatedBorder}]}>
          <TouchableOpacity
            onPress={handleStartClaiming}
            activeOpacity={0.8}
            style={styles.claimButtonContainer}>
            <LinearGradient
              colors={['#80A1BA', '#70B2B2']}
              style={styles.claimButton}>
              <Text style={styles.claimButtonText}>
                {miningSession && miningSession.status === 'mining'
                  ? '⚡ Mining in Progress...'
                  : '⛏️ Start Mining'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* 3 Animated Cards */}
        <View style={styles.actionCardsContainer}>

          {/* Leaderboard */}
          <Animated.View
            style={[
              styles.smallCard,
              {transform: [{scale: cardPulse}, {translateY: cardFloat}]},
            ]}>
            <TouchableOpacity
              style={styles.smallCardInner}
              onPress={() => navigation.navigate('Leaderboard')}
              activeOpacity={0.8}>
              <Text style={styles.smallCardIcon}>🏆</Text>
              <Text style={styles.smallCardTitle}>Leaderboard</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Refer */}
          <Animated.View
            style={[
              styles.smallCard,
              {transform: [{scale: cardPulse}, {translateY: cardFloat}]},
            ]}>
            <TouchableOpacity
              style={styles.smallCardInner}
              onPress={() => navigation.navigate('Refer')}
              activeOpacity={0.8}>
              <Text style={styles.smallCardIcon}>🎁</Text>
              <Text style={styles.smallCardTitle}>Refer & Earn</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Watch Ad */}
          <Animated.View
            style={[
              styles.smallCard,
              {transform: [{scale: cardPulse}, {translateY: cardFloat}]},
            ]}>
            <TouchableOpacity
              style={styles.smallCardInner}
              onPress={handleWatchAd}
              activeOpacity={0.8}>
              <Text style={styles.smallCardIcon}>🎬</Text>
              <Text style={styles.smallCardTitle}>Watch Ad</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>

      </ScrollView>

      {/* Modal (unchanged) */}
      {animatedVisible && (
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleModalBack}>
            <Animated.View style={[styles.backdrop, {opacity: backdropOpacity}]} />
          </TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.modalCard,
              {transform: [{scale: slideAnim}], opacity: slideAnim},
            ]}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={[styles.modalGradient, {marginTop: 12}]}>
              <Text style={[styles.modalTitle, {color: '#0f2b4a'}]}>Select Duration</Text>
              <Text style={[styles.modalSub, {color: '#475569'}]}>
                Choose how long you want to mine
              </Text>

              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Estimated rewards</Text>
                <Text style={styles.estimateValue}>
                  {(() => {
                    const hrs = selectedHours || 1;
                    const estimate = hrs * 3600 * BASE_RATE * (userMultiplier || 1);
                    return `${Number(estimate).toFixed(2)} CMT`;
                  })()}
                </Text>
              </View>

              <View style={styles.durationRow}>
                {[1, 2, 4, 12, 18, 24].map(hr => {
                  const active = selectedHours === hr;
                  return (
                    <TouchableOpacity
                      key={hr}
                      activeOpacity={0.9}
                      onPress={() => setSelectedHours(hr)}
                      style={[styles.hourBtn, active && styles.hourBtnActive]}>
                      <Text style={[styles.hourBtnText, active && styles.hourBtnTextActive]}>
                        {hr}h
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBack} onPress={handleModalBack}>
                  <LinearGradient colors={['#234C6A', '#BADFDB']} style={styles.modalBackGradient}>
                    <Text style={styles.modalBackText}>Back</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalNext} onPress={handleModalNext}>
                  <LinearGradient colors={['#234C6A', '#BADFDB']} style={styles.modalNextGradient}>
                    <Text style={styles.modalNextText}>Start Mining</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </LinearGradient>
          </Animated.View>
        </View>
      )}

      {/* Watch Ad Confirmation Modal */}
      <Modal visible={showAdModal} transparent animationType="fade">
        <View style={styles.adModalOverlay}>
          <Animated.View style={styles.adModalContent}>
            <LinearGradient colors={['#1B3C53', '#234C6A']} style={styles.adModalGradient}>
              <Text style={styles.adModalIcon}>🎬</Text>
              <Text style={styles.adModalTitle}>Watch Ad & Earn</Text>
              <Text style={styles.adModalMessage}>Watch this short ad and receive a surprise reward!</Text>
              
              <View style={styles.adModalButtons}>
                <TouchableOpacity onPress={() => setShowAdModal(false)} style={styles.adCancelBtn}>
                  <Text style={styles.adCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleWatchNow} style={styles.adWatchBtn}>
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.adWatchGradient}>
                    <Text style={styles.adWatchText}>Watch Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Ad Loading Modal */}
      <Modal visible={adLoading} transparent animationType="fade">
        <View style={styles.adModalOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading ad...</Text>
          </View>
        </View>
      </Modal>

      {/* Reward Success Modal */}
      <Modal visible={showRewardModal} transparent animationType="fade">
        <View style={styles.adModalOverlay}>
          <Animated.View style={[styles.rewardModalContent, {transform: [{scale: rewardScale}]}]}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.rewardGradient}>
              <View style={styles.neonBorder} />
              <Text style={styles.rewardIcon}>🎉</Text>
              <Text style={styles.rewardTitle}>Congratulations!</Text>
              <Text style={styles.rewardAmount}>You earned {earnedReward} tokens!</Text>
              <TouchableOpacity onPress={closeRewardModal} style={styles.rewardCloseBtn}>
                <Text style={styles.rewardCloseText}>Awesome!</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  svgBackground: {position: 'absolute', top:0, left: 0},

  scrollContent: {padding: 20, paddingTop: 50, paddingBottom: 20},

  headerRight: {
    alignItems: 'flex-end',
    marginBottom:35 ,
    marginTop: 15,
  },

  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  logoutText: {color: '#fff', fontSize: 14, fontWeight: '700'},

  walletCard: {marginBottom: 35},
  walletBackground: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#BBDCE5',
  },
  walletBackgroundImage: {borderRadius: 14},
  walletGradient: {padding: 18},
  walletLabel: {color: '#E8F4F8', fontSize: 14, marginBottom: 5},
  walletId: {color: '#D6DAC8', fontSize: 18, fontWeight: '700'},

  tokensContainer: {marginBottom: 40, alignItems: 'center'},
  tokensGradient: {
    width: '95%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#BBDCE5',
    overflow: 'hidden',
  },
  tokensLabel: {color: '#0f172a', fontSize: 14, fontWeight: '600'},
  tokensValue: {color: '#0f172a', fontSize: 44, fontWeight: '900'},
  tokensCurrency: {color: '#0f172a', fontSize: 16, fontWeight: '600'},
  tokensLottie: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    top: '-30%',
    opacity: 0.4,
  },

  startMiningWrapper: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 4,
    marginBottom: 25,
  },
  claimButtonContainer: {},
  claimButton: {
    height: 65,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },

  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 20,
    marginBottom: 20, // reduced to remove empty space
  },

  smallCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    height: 115, // slightly smaller
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  smallCardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  smallCardIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  smallCardTitle: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },

  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: width - 60,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {padding: 24},
  modalTitle: {fontSize: 22, fontWeight: '800', marginBottom: 6},
  modalSub: {fontSize: 14, marginBottom: 20},
  estimateRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 10, backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 10, marginBottom: 16,
  },
  estimateLabel: {fontSize: 14},
  estimateValue: {fontSize: 14, fontWeight: '800'},

  durationRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  hourBtn: {
    width: '30%', paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#e5e7eb', marginBottom: 12,
    alignItems: 'center',
  },
  hourBtnActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
  },
  hourBtnText: {
    fontSize: 16, fontWeight: '700', color: '#374151',
  },
  hourBtnTextActive: {
    color: '#234C6A',
  },

  modalActions: {flexDirection: 'row', marginTop: 50},
  modalBack: {flex: 1, marginRight: 8, borderRadius: 12, overflow: 'hidden'},
  modalNext: {flex: 1, marginLeft: 8, borderRadius: 12, overflow: 'hidden'},
  modalBackGradient: {paddingVertical: 14, alignItems: 'center'},
  modalNextGradient: {paddingVertical: 14, alignItems: 'center'},
  modalBackText: {color: '#fff', fontSize: 16, fontWeight: '800'},
  modalNextText: {color: '#fff', fontSize: 16, fontWeight: '800'},

  // Watch Ad Modal Styles
  adModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adModalContent: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
  },
  adModalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  adModalIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  adModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  adModalMessage: {
    fontSize: 16,
    color: '#E8F4F8',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  adModalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  adCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  adCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  adWatchBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  adWatchGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  adWatchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingBox: {
    backgroundColor: '#1B3C53',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '600',
  },
  rewardModalContent: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rewardGradient: {
    padding: 40,
    alignItems: 'center',
    position: 'relative',
  },
  neonBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: '#00eaff',
    borderRadius: 20,
    shadowColor: '#00eaff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  rewardIcon: {
    fontSize: 80,
    marginBottom: 15,
  },
  rewardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  rewardAmount: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 25,
    fontWeight: '600',
  },
  rewardCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rewardCloseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default HomeScreen;
