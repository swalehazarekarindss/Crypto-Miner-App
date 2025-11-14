/*import React, {useEffect, useState, useRef} from 'react';
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
} from 'react-native';
// use require to avoid missing TS types in this repo (vector icons optional)
const _IconModule = require('react-native-vector-icons/MaterialCommunityIcons');
const Icon = _IconModule && _IconModule.default ? _IconModule.default : _IconModule;
import ClockIcon from './Icons/ClockIcon';
import LinearGradient from 'react-native-linear-gradient';
// safe require Lottie (optional dependency)
let LottieView: any = null;
try {
  const _l = require('lottie-react-native');
  LottieView = _l && _l.default ? _l.default : _l;
} catch (e) {
  // lottie not installed, silently ignore
}
import Svg, {Circle, Path, Defs, RadialGradient, Stop} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI} from '../services/api';
import { bindNavigation, showImmediate } from '../services/NotifcationService';

const {width, height} = Dimensions.get('window');

// Background SVG Component
const BackgroundSVG = () => (
  <Svg height={height} width={width} style={styles.svgBackground}>
    <Defs>
      <RadialGradient id="grad1" cx="50%" cy="50%">
        <Stop offset="0%" stopColor="#FFD6E8" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#C9B6E4" stopOpacity="0.1" />
      </RadialGradient>
    </Defs>
    <Circle cx={width * 0.2} cy={height * 0.15} r="120" fill="url(#grad1)" />
    <Circle cx={width * 0.8} cy={height * 0.3} r="90" fill="#E8DFF5" opacity="0.2" />
    <Circle cx={width * 0.5} cy={height * 0.7} r="150" fill="#FDE2E4" opacity="0.25" />
    <Circle cx={width * 0.9} cy={height * 0.8} r="100" fill="#DEEDF0" opacity="0.2" />
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
  const [checkingSession, setCheckingSession] = useState(true);
  const BASE_RATE = 0.01; // tokens per second

  useEffect(() => {
    // Ensure vector icon font is loaded (helps if icons don't render)
    if (Icon && (Icon as any).loadFont) {
      (Icon as any).loadFont();
    }

    console.log('HomeScreen: Component mounted, checking for active session...');
    loadUserData();
    
    // Delay to ensure navigation is ready, then check for active mining session
    const checkActiveSession = setTimeout(() => {
      console.log('HomeScreen: Fetching status with auto-navigate enabled');
      fetchStatus(true);
    }, 300);

    // Poll backend every 10 seconds to check if mining is complete
    const statusCheckInterval = setInterval(() => {
      console.log('HomeScreen: Periodic status check...');
      fetchStatus(false);
    }, 10000);

    // Add focus listener to refresh data when returning to screen
    // Don't auto-navigate when returning from other screens
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen: Screen focused, refreshing status');
      fetchStatus(false);
    });

    return () => {
      clearTimeout(checkActiveSession);
      clearInterval(statusCheckInterval);
      unsubscribe();
    };
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const storedWalletId = await AsyncStorage.getItem('walletId');
      if (storedWalletId) {
        setWalletId(storedWalletId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchStatus = async (autoNavigate = false) => {
    try {
      const userResp = await authAPI.getUser();
      if (userResp) {
        const balance = Number(userResp.balance || 0).toFixed(2);
        console.log('💰 HomeScreen: Updated balance from backend:', balance, 'CMT');
        console.log('   - User mining status:', userResp.miningStatus);
        setTokens(balance);
        setMiningStatus(userResp.miningStatus || 'idle');
        setUserMultiplier(userResp.multiplier || 1);
      }

      const { miningAPI } = await import('../services/api');
      const statusResp = await miningAPI.getStatus();
      if (statusResp && statusResp.session) {
        const sess = statusResp.session;
        console.log('HomeScreen: Mining session status:', sess.status);
        setMiningSession(sess);
        setMiningStatus(sess.status || 'idle');
        
        // Check if mining is complete (timer reached 0)
        if (sess.status === 'mining') {
          const start = new Date(sess.miningStartTime || sess.createdDate).getTime();
          const now = Date.now();
          const planned = (sess.selectedHour || 1) * 3600;
          const elapsed = Math.floor((now - start) / 1000);
          const remaining = Math.max(0, planned - elapsed);
          const currentEarned = Math.min(elapsed, planned) * 0.01 * (sess.multiplier || 1);
          
          // If timer is complete, show notification
          if (remaining === 0) {
            console.log('⏰ HomeScreen: Mining complete detected!');
            console.log('   - Earned:', currentEarned.toFixed(2), 'CMT');
            
            // Show notification
            await NotificationService.showCustomNotification(
              '⏰ Mining Complete!',
              `Your rewards are ready! You earned ${currentEarned.toFixed(2)} CMT. Tap to claim now!`,
              {
                type: 'mining_complete',
                screen: 'Mining',
                sessionId: String(sess._id),
              }
            );
            console.log('✅ Notification shown from HomeScreen');
          }
        }
        
        // Auto-navigate to MiningScreen if there's an active mining session
        if (autoNavigate && sess.status === 'mining' && sess._id) {
          console.log('✅ HomeScreen: Active mining session found!');
          console.log('   - Session ID:', sess._id);
          console.log('   - Session status:', sess.status);
          console.log('   - Session start time:', sess.miningStartTime);
          console.log('   - Navigating to MiningScreen...');
          // Use setTimeout to ensure navigation happens after render
          setTimeout(() => {
            console.log('🚀 HomeScreen: Executing navigation to Mining screen');
            navigation.navigate('Mining', { sessionId: sess._id });
          }, 200);
        } else if (autoNavigate) {
          console.log('ℹ️ HomeScreen: No active mining session found');
          console.log('   - Session exists:', !!sess);
          console.log('   - Session status:', sess?.status);
          console.log('   - Session ID:', sess?._id);
        }
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      if (autoNavigate) {
        setCheckingSession(false);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authAPI.logout();
          navigation.replace('Signup');
        },
      },
    ]);
  };

  const handleStartClaiming = () => {
    // If there's an active session, navigate directly to mining screen
    if (miningSession && miningSession.status === 'mining') {
      navigation.navigate('Mining', { sessionId: miningSession._id });
      return;
    }

    // open our animated duration panel (centered)
    setSelectedHours(1);
    setShowDurationModal(true);
    setAnimatedVisible(true);
    // animate backdrop fade and scale in
    slideAnim.setValue(0.8);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const startMiningWithHours = async (hours: number) => {
    try {
      const { miningAPI } = await import('../services/api');
      console.log('Starting mining with hours:', hours);
      const resp = await miningAPI.startMining(hours);
      console.log('Mining start response:', resp);
      
      if (resp && resp.session && resp.session._id) {
        setMiningSession(resp.session);
        setMiningStatus('mining');
        console.log('Navigating to Mining screen with sessionId:', resp.session._id);
        
        // Schedule notification for when mining completes
        const BASE_RATE = 0.01;
        const expectedEarned = hours * 3600 * BASE_RATE * (resp.session.multiplier || 1);
        const miningStartTime = new Date(resp.session.miningStartTime || resp.session.createdDate);
        
        console.log('📅 Scheduling notification for mining completion');
        await NotificationService.scheduleMiningCompleteNotification(
          miningStartTime,
          hours,
          expectedEarned,
          resp.session._id
        );
        
        navigation.navigate('Mining', { sessionId: resp.session._id });
      } else {
        console.error('Invalid response from startMining:', resp);
        Alert.alert('Error', 'Failed to start mining session. Invalid response from server.');
      }
    } catch (err) {
      console.error('Error starting mining:', err);
      const msg = (err as any)?.response?.data?.message || String((err as any)?.message || 'Could not start mining');
      Alert.alert('Error', msg);
    }
  };

  const handleModalNext = async () => {
    const hours = selectedHours || 1;
    // animate out then start
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
      startMiningWithHours(hours);
    });
  };

  const handleModalBack = () => {
    // animate out and close
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#749BC2', '#98A1BC', '#91C8E4', '#749BC2']}
        style={StyleSheet.absoluteFill}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      />
      <StatusBar barStyle="light-content" backgroundColor="#749BC2" />
      
      <BackgroundSVG />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crypto Miner</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        
        <View style={styles.walletCard}>
          <ImageBackground
            source={require('./assets/wallet.png')}
            style={styles.walletBackground}
            imageStyle={styles.walletBackgroundImage}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)']}
              style={styles.walletGradient}>
              <Text style={styles.walletLabel}>Wallet ID</Text>
              <Text style={styles.walletId}>{walletId}</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        
        <View style={styles.tokensContainer}>
          <View
            style={[
              styles.tokensGradient,
              { backgroundColor: '#ffffff', paddingTop: 28, overflow: 'hidden' }, // white box
            ]}>
            {LottieView ? (
              <LottieView
                source={require('./assets/star.json')}
                autoPlay
                loop
                // fill the whole box but keep a low opacity so text remains readable
                style={styles.tokensLottie}
                pointerEvents="none"
              />
            ) : null}

            <Text style={[styles.tokensLabel, { color: '#0f172a' }]}>Total Tokens</Text>
            <Text style={[styles.tokensValue, { color: '#0f172a' }]}>{tokens}</Text>
            <Text style={[styles.tokensCurrency, { color: '#0f172a' }]}>CMT</Text>
          </View>
        </View>

        
        <TouchableOpacity
          onPress={handleStartClaiming}
          activeOpacity={0.8}
          style={styles.claimButtonContainer}>
          <LinearGradient
            colors={['#234C6A', '#456882']}
            style={styles.claimButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.claimButtonText}>⛏️ Start Claiming</Text>
          </LinearGradient>
        </TouchableOpacity>

        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>Fast</Text>
              <Text style={styles.statLabel}>Mining</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>🔒</Text>
              <Text style={styles.statValue}>Secure</Text>
              <Text style={styles.statLabel}>Wallet</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>Profit</Text>
              <Text style={styles.statLabel}>24/7</Text>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      
      {animatedVisible && (
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleModalBack}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.modalCard,
              { 
                transform: [{ scale: slideAnim }],
                opacity: slideAnim,
              },
            ]}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={[styles.modalGradient, { marginTop: 12 }]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              
              <Text style={[styles.modalTitle, { color: '#0f2b4a' }]}>Select Duration</Text>
              <Text style={[styles.modalSub, { color: '#475569' }]}>Choose how long you want to mine</Text>

            
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Estimated rewards</Text>
                <Text style={styles.estimateValue}>{(() => {
                  const hrs = selectedHours || 1;
                  const estimate = hrs * 3600 * BASE_RATE * (userMultiplier || 1);
                  return `${Number(estimate).toFixed(2)} CMT`;
                })()}</Text>
              </View>

              <View style={styles.durationRow}>
                {[
                  { hr: 1, icon: 'timer-sand' },
                  { hr: 2, icon: 'clock-time-two-outline' },
                  { hr: 4, icon: 'clock-time-four-outline' },
                  { hr: 12, icon: 'clock-time-twelve-outline' },
                  { hr: 18, icon: 'clock-alert-outline' },
                  { hr: 24, icon: 'hours-24' },
                ].map(item => {
                  const active = selectedHours === item.hr;
                  return (
                    <TouchableOpacity
                      key={item.hr}
                      activeOpacity={0.9}
                      style={[
                        styles.hourBtn,
                        active && styles.hourBtnActive,
                      ]}
                      onPress={() => setSelectedHours(item.hr)}>
                      <View style={[styles.watchIconContainer, active && styles.watchIconContainerActive]}>
                        <ClockIcon size={14} color={active ? '#234C6A' : '#64748b'} />
                      </View>

                      <ClockIcon size={32} color={active ? '#234C6A' : '#0f172a'} />
                      <Text style={[styles.hourBtnText, active && styles.hourBtnTextActive]}>{item.hr}h</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBack} onPress={handleModalBack}>
                  <LinearGradient
                    colors={['#234C6A', '#BADFDB']}
                    style={styles.modalBackGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                  <Text style={styles.modalBackText}>Back</Text>
                  </LinearGradient>

                </TouchableOpacity>

                <TouchableOpacity style={styles.modalNext} onPress={handleModalNext}>
                  <LinearGradient
                    colors={['#234C6A', '#BADFDB']}
                    style={styles.modalNextGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    <Text style={styles.modalNextText}>Next</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      )}
    </View>
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  walletCard: {
    marginBottom: 30,
  },
  walletBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  walletBackgroundImage: {
    borderRadius: 16,
    resizeMode: 'cover',
  },
  walletGradient: {
    padding: 20,
    borderRadius: 16,
  },
  walletLabel: {
    fontSize: 14,
    color: '#E8F4F8',
    marginBottom: 8,
    fontWeight: '600',
  },
  walletId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  tokensContainer: {
    marginBottom: 30,
  },
  tokensGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#26667F',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tokensLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: '600',
  },
  tokensValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  tokensCurrency: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 5,
    fontWeight: '600',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: width - 60,
    maxWidth: 450,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  modalGradient: {
    padding: 24,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  modalSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  hourBtn: {
    width: '30%',
    marginHorizontal: 4,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#E5E9C5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(15, 43, 74, 0.06)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  hourBtnActive: {
    backgroundColor: '#ffffff', // <-- changed to white
    borderColor: '#e6f5fb',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    transform: [{scale: 1.02}],
  },
  watchIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  watchIconContainerActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  hourIcon: {
    marginBottom: 4,
  },
  hourBtnText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 6,
  },
  hourBtnTextActive: {
    color: '#234C6A', // dark text when active on white bg
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalBack: {
     flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  modalBackGradient:{
     paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',

  },
  modalBackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalNext: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalNextGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  estimateRow: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  estimateLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontSize: 14,
  },
  estimateValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  tokensLottie: {
    position: 'absolute',
    // medium intensity: spread across box but not overpower text
    width: '140%',
    height: '140%',
    left: '-10%',
    top: '-10%',
    opacity: 0.45,
    zIndex: 0,
    transform: [{ scale: 1.05 }],
  },
  claimButtonContainer: {
    marginBottom: 30,
  },
  claimButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  claimButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statGradient: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#E8F4F8',
    fontWeight: '500',
  },
});

export default HomeScreen;

*/



/*import React, {useEffect, useState, useRef} from 'react';
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
} from 'react-native';
// use require to avoid missing TS types in this repo (vector icons optional)
const _IconModule = require('react-native-vector-icons/MaterialCommunityIcons');
const Icon = _IconModule && _IconModule.default ? _IconModule.default : _IconModule;
import ClockIcon from './Icons/ClockIcon';
import LinearGradient from 'react-native-linear-gradient';
// safe require Lottie (optional dependency)
let LottieView: any = null;
try {
  const _l = require('lottie-react-native');
  LottieView = _l && _l.default ? _l.default : _l;
} catch (e) {
  // lottie not installed, silently ignore
}
import Svg, {Circle, Path, Defs, RadialGradient, Stop} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI} from '../services/api';
import { showImmediate } from '../services/NotifcationService';
import NotificationService from '../services/NotifcationService';

const {width, height} = Dimensions.get('window');

// Background SVG Component
const BackgroundSVG = () => (
  <Svg height={height} width={width} style={styles.svgBackground}>
    <Defs>
      <RadialGradient id="grad1" cx="50%" cy="50%">
        <Stop offset="0%" stopColor="#FFD6E8" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#C9B6E4" stopOpacity="0.1" />
      </RadialGradient>
    </Defs>
    <Circle cx={width * 0.2} cy={height * 0.15} r="120" fill="url(#grad1)" />
    <Circle cx={width * 0.8} cy={height * 0.3} r="90" fill="#E8DFF5" opacity="0.2" />
    <Circle cx={width * 0.5} cy={height * 0.7} r="150" fill="#FDE2E4" opacity="0.25" />
    <Circle cx={width * 0.9} cy={height * 0.8} r="100" fill="#DEEDF0" opacity="0.2" />
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
  const [checkingSession, setCheckingSession] = useState(true);
  const BASE_RATE = 0.01; // tokens per second

  useEffect(() => {
    // Ensure vector icon font is loaded (helps if icons don't render)
    if (Icon && (Icon as any).loadFont) {
      (Icon as any).loadFont();
    }

    console.log('HomeScreen: Component mounted, checking for active session...');
    loadUserData();
    
    // Delay to ensure navigation is ready, then check for active mining session
    const checkActiveSession = setTimeout(() => {
      console.log('HomeScreen: Fetching status with auto-navigate enabled');
      fetchStatus(true);
    }, 300);

    // Poll backend every 10 seconds to check if mining is complete
    const statusCheckInterval = setInterval(() => {
      console.log('HomeScreen: Periodic status check...');
      fetchStatus(false);
    }, 10000);

    // Add focus listener to refresh data when returning to screen
    // Don't auto-navigate when returning from other screens
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen: Screen focused, refreshing status');
      fetchStatus(false);
    });

    return () => {
      clearTimeout(checkActiveSession);
      clearInterval(statusCheckInterval);
      unsubscribe();
    };
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const storedWalletId = await AsyncStorage.getItem('walletId');
      if (storedWalletId) {
        setWalletId(storedWalletId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchStatus = async (autoNavigate = false) => {
    try {
      const userResp = await authAPI.getUser();
      if (userResp) {
        const balance = Number(userResp.balance || 0).toFixed(2);
        console.log('💰 HomeScreen: Updated balance from backend:', balance, 'CMT');
        console.log('   - User mining status:', userResp.miningStatus);
        setTokens(balance);
        setMiningStatus(userResp.miningStatus || 'idle');
        setUserMultiplier(userResp.multiplier || 1);
      }

      const { miningAPI } = await import('../services/api');
      const statusResp = await miningAPI.getStatus();
      if (statusResp && statusResp.session) {
        const sess = statusResp.session;
        console.log('HomeScreen: Mining session status:', sess.status);
        setMiningSession(sess);
        setMiningStatus(sess.status || 'idle');
        
        // Check if mining is complete (timer reached 0)
        if (sess.status === 'mining') {
          const start = new Date(sess.miningStartTime || sess.createdDate).getTime();
          const now = Date.now();
          const planned = (sess.selectedHour || 1) * 3600;
          const elapsed = Math.floor((now - start) / 1000);
          const remaining = Math.max(0, planned - elapsed);
          const currentEarned = Math.min(elapsed, planned) * 0.01 * (sess.multiplier || 1);
          
          // If timer is complete, show notification
          if (remaining === 0) {
            console.log('⏰ HomeScreen: Mining complete detected!');
            console.log('   - Earned:', currentEarned.toFixed(2), 'CMT');
            
            // Show notification
            await NotificationService.showCustomNotification(
              '⏰ Mining Complete!',
              `Your rewards are ready! You earned ${currentEarned.toFixed(2)} CMT. Tap to claim now!`,
              {
                type: 'mining_complete',
                screen: 'Mining',
                sessionId: String(sess._id),
              }
            );
            console.log('✅ Notification shown from HomeScreen');
          }
        }
        
        // Auto-navigate to MiningScreen if there's an active mining session
        if (autoNavigate && sess.status === 'mining' && sess._id) {
          console.log('✅ HomeScreen: Active mining session found!');
          console.log('   - Session ID:', sess._id);
          console.log('   - Session status:', sess.status);
          console.log('   - Session start time:', sess.miningStartTime);
          console.log('   - Navigating to MiningScreen...');
          // Use setTimeout to ensure navigation happens after render
          setTimeout(() => {
            console.log('🚀 HomeScreen: Executing navigation to Mining screen');
            navigation.navigate('Mining', { sessionId: sess._id });
          }, 200);
        } else if (autoNavigate) {
          console.log('ℹ️ HomeScreen: No active mining session found');
          console.log('   - Session exists:', !!sess);
          console.log('   - Session status:', sess?.status);
          console.log('   - Session ID:', sess?._id);
        }
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      if (autoNavigate) {
        setCheckingSession(false);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authAPI.logout();
          navigation.replace('Signup');
        },
      },
    ]);
  };

  const handleStartClaiming = () => {
    // If there's an active session, navigate directly to mining screen
    if (miningSession && miningSession.status === 'mining') {
      navigation.navigate('Mining', { sessionId: miningSession._id });
      return;
    }

    // open our animated duration panel (centered)
    setSelectedHours(1);
    setShowDurationModal(true);
    setAnimatedVisible(true);
    // animate backdrop fade and scale in
    slideAnim.setValue(0.8);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const startMiningWithHours = async (hours: number) => {
    try {
      const { miningAPI } = await import('../services/api');
      console.log('Starting mining with hours:', hours);
      const resp = await miningAPI.startMining(hours);
      console.log('Mining start response:', resp);
      
      if (resp && resp.session && resp.session._id) {
        setMiningSession(resp.session);
        setMiningStatus('mining');
        console.log('Navigating to Mining screen with sessionId:', resp.session._id);
        
        // Schedule notification for when mining completes
        const BASE_RATE = 0.01;
        const expectedEarned = hours * 3600 * BASE_RATE * (resp.session.multiplier || 1);
        const miningStartTime = new Date(resp.session.miningStartTime || resp.session.createdDate);
        
        console.log('📅 Scheduling notification for mining completion');
        await NotificationService.scheduleMiningCompleteNotification(
          miningStartTime,
          hours,
          expectedEarned,
          resp.session._id
        );
        
        navigation.navigate('Mining', { sessionId: resp.session._id });
      } else {
        console.error('Invalid response from startMining:', resp);
        Alert.alert('Error', 'Failed to start mining session. Invalid response from server.');
      }
    } catch (err) {
      console.error('Error starting mining:', err);
      const msg = (err as any)?.response?.data?.message || String((err as any)?.message || 'Could not start mining');
      Alert.alert('Error', msg);
    }
  };

  const handleModalNext = async () => {
    const hours = selectedHours || 1;
    // animate out then start
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
      startMiningWithHours(hours);
    });
  };

  const handleModalBack = () => {
    // animate out and close
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#749BC2', '#98A1BC', '#91C8E4', '#749BC2']}
        style={StyleSheet.absoluteFill}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      />
      <StatusBar barStyle="light-content" backgroundColor="#749BC2" />
      
      <BackgroundSVG />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crypto Miner</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        
        <View style={styles.walletCard}>
          <ImageBackground
            source={require('./assets/wallet.png')}
            style={styles.walletBackground}
            imageStyle={styles.walletBackgroundImage}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)']}
              style={styles.walletGradient}>
              <Text style={styles.walletLabel}>Wallet ID</Text>
              <Text style={styles.walletId}>{walletId}</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        
        <View style={styles.tokensContainer}>
          <View
            style={[
              styles.tokensGradient,
              { backgroundColor: '#ffffff', paddingTop: 28, overflow: 'hidden' }, // white box
            ]}>
            {LottieView ? (
              <LottieView
                source={require('./assets/star.json')}
                autoPlay
                loop
                // fill the whole box but keep a low opacity so text remains readable
                style={styles.tokensLottie}
                pointerEvents="none"
              />
            ) : null}

            <Text style={[styles.tokensLabel, { color: '#0f172a' }]}>Total Tokens</Text>
            <Text style={[styles.tokensValue, { color: '#0f172a' }]}>{tokens}</Text>
            <Text style={[styles.tokensCurrency, { color: '#0f172a' }]}>CMT</Text>
          </View>
        </View>

        
        <TouchableOpacity
          onPress={handleStartClaiming}
          activeOpacity={0.8}
          style={styles.claimButtonContainer}>
          <LinearGradient
            colors={['#234C6A', '#456882']}
            style={styles.claimButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.claimButtonText}>⛏️ Start Claiming</Text>
          </LinearGradient>
        </TouchableOpacity>

        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>Fast</Text>
              <Text style={styles.statLabel}>Mining</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>🔒</Text>
              <Text style={styles.statValue}>Secure</Text>
              <Text style={styles.statLabel}>Wallet</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>Profit</Text>
              <Text style={styles.statLabel}>24/7</Text>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      
      {animatedVisible && (
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleModalBack}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.modalCard,
              { 
                transform: [{ scale: slideAnim }],
                opacity: slideAnim,
              },
            ]}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={[styles.modalGradient, { marginTop: 12 }]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              
              <Text style={[styles.modalTitle, { color: '#0f2b4a' }]}>Select Duration</Text>
              <Text style={[styles.modalSub, { color: '#475569' }]}>Choose how long you want to mine</Text>

            
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Estimated rewards</Text>
                <Text style={styles.estimateValue}>{(() => {
                  const hrs = selectedHours || 1;
                  const estimate = hrs * 3600 * BASE_RATE * (userMultiplier || 1);
                  return `${Number(estimate).toFixed(2)} CMT`;
                })()}</Text>
              </View>

              <View style={styles.durationRow}>
                {[
                  { hr: 1, icon: 'timer-sand' },
                  { hr: 2, icon: 'clock-time-two-outline' },
                  { hr: 4, icon: 'clock-time-four-outline' },
                  { hr: 12, icon: 'clock-time-twelve-outline' },
                  { hr: 18, icon: 'clock-alert-outline' },
                  { hr: 24, icon: 'hours-24' },
                ].map(item => {
                  const active = selectedHours === item.hr;
                  return (
                    <TouchableOpacity
                      key={item.hr}
                      activeOpacity={0.9}
                      style={[
                        styles.hourBtn,
                        active && styles.hourBtnActive,
                      ]}
                      onPress={() => setSelectedHours(item.hr)}>
                      <View style={[styles.watchIconContainer, active && styles.watchIconContainerActive]}>
                        <ClockIcon size={14} color={active ? '#234C6A' : '#64748b'} />
                      </View>

                      <ClockIcon size={32} color={active ? '#234C6A' : '#0f172a'} />
                      <Text style={[styles.hourBtnText, active && styles.hourBtnTextActive]}>{item.hr}h</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBack} onPress={handleModalBack}>
                  <LinearGradient
                    colors={['#234C6A', '#BADFDB']}
                    style={styles.modalBackGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                  <Text style={styles.modalBackText}>Back</Text>
                  </LinearGradient>

                </TouchableOpacity>

                <TouchableOpacity style={styles.modalNext} onPress={handleModalNext}>
                  <LinearGradient
                    colors={['#234C6A', '#BADFDB']}
                    style={styles.modalNextGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    <Text style={styles.modalNextText}>Next</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      )}
    </View>
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  walletCard: {
    marginBottom: 30,
  },
  walletBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  walletBackgroundImage: {
    borderRadius: 16,
    resizeMode: 'cover',
  },
  walletGradient: {
    padding: 20,
    borderRadius: 16,
  },
  walletLabel: {
    fontSize: 14,
    color: '#E8F4F8',
    marginBottom: 8,
    fontWeight: '600',
  },
  walletId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  tokensContainer: {
    marginBottom: 30,
  },
  tokensGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#26667F',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tokensLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: '600',
  },
  tokensValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  tokensCurrency: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 5,
    fontWeight: '600',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: width - 60,
    maxWidth: 450,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  modalGradient: {
    padding: 24,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  modalSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  hourBtn: {
    width: '30%',
    marginHorizontal: 4,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#E5E9C5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(15, 43, 74, 0.06)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  hourBtnActive: {
    backgroundColor: '#ffffff', // <-- changed to white
    borderColor: '#e6f5fb',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    transform: [{scale: 1.02}],
  },
  watchIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  watchIconContainerActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  hourIcon: {
    marginBottom: 4,
  },
  hourBtnText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 6,
  },
  hourBtnTextActive: {
    color: '#234C6A', // dark text when active on white bg
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalBack: {
     flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  modalBackGradient:{
     paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',

  },
  modalBackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalNext: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalNextGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  estimateRow: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  estimateLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontSize: 14,
  },
  estimateValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  tokensLottie: {
    position: 'absolute',
    // medium intensity: spread across box but not overpower text
    width: '140%',
    height: '140%',
    left: '-10%',
    top: '-10%',
    opacity: 0.45,
    zIndex: 0,
    transform: [{ scale: 1.05 }],
  },
  claimButtonContainer: {
    marginBottom: 30,
  },
  claimButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  claimButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statGradient: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#E8F4F8',
    fontWeight: '500',
  },
});

export default HomeScreen;

*/

















/*import React, {useEffect, useState, useRef} from 'react';
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
} from 'react-native';
// use require to avoid missing TS types in this repo (vector icons optional)
const _IconModule = require('react-native-vector-icons/MaterialCommunityIcons');
const Icon = _IconModule && _IconModule.default ? _IconModule.default : _IconModule;
import ClockIcon from './Icons/ClockIcon';
import LinearGradient from 'react-native-linear-gradient';
// safe require Lottie (optional dependency)
let LottieView: any = null;
try {
  const _l = require('lottie-react-native');
  LottieView = _l && _l.default ? _l.default : _l;
} catch (e) {
  // lottie not installed, silently ignore
}
import Svg, {Circle, Path, Defs, RadialGradient, Stop} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI} from '../services/api';
import { showImmediate } from '../services/NotifcationService';
import NotificationService from '../services/NotifcationService';

const {width, height} = Dimensions.get('window');

// Background SVG Component
const BackgroundSVG = () => (
  <Svg height={height} width={width} style={styles.svgBackground}>
    <Defs>
      <RadialGradient id="grad1" cx="50%" cy="50%">
        <Stop offset="0%" stopColor="#FFD6E8" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#C9B6E4" stopOpacity="0.1" />
      </RadialGradient>
    </Defs>
    <Circle cx={width * 0.2} cy={height * 0.15} r="120" fill="url(#grad1)" />
    <Circle cx={width * 0.8} cy={height * 0.3} r="90" fill="#E8DFF5" opacity="0.2" />
    <Circle cx={width * 0.5} cy={height * 0.7} r="150" fill="#FDE2E4" opacity="0.25" />
    <Circle cx={width * 0.9} cy={height * 0.8} r="100" fill="#DEEDF0" opacity="0.2" />
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
  const [checkingSession, setCheckingSession] = useState(true);
  const BASE_RATE = 0.01; // tokens per second

  useEffect(() => {
    // Ensure vector icon font is loaded (helps if icons don't render)
    if (Icon && (Icon as any).loadFont) {
      (Icon as any).loadFont();
    }

    console.log('HomeScreen: Component mounted, checking for active session...');
    loadUserData();
    
    // Delay to ensure navigation is ready, then check for active mining session
    const checkActiveSession = setTimeout(() => {
      console.log('HomeScreen: Fetching status with auto-navigate enabled');
      fetchStatus(true);
    }, 300);

    // Poll backend every 10 seconds to check if mining is complete
    const statusCheckInterval = setInterval(() => {
      console.log('HomeScreen: Periodic status check...');
      fetchStatus(false);
    }, 10000);

    // Add focus listener to refresh data when returning to screen
    // Don't auto-navigate when returning from other screens
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen: Screen focused, refreshing status');
      fetchStatus(false);
    });

    return () => {
      clearTimeout(checkActiveSession);
      clearInterval(statusCheckInterval);
      unsubscribe();
    };
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const storedWalletId = await AsyncStorage.getItem('walletId');
      if (storedWalletId) {
        setWalletId(storedWalletId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchStatus = async (autoNavigate = false) => {
    try {
      const userResp = await authAPI.getUser();
      if (userResp) {
        const balance = Number(userResp.balance || 0).toFixed(2);
        console.log('💰 HomeScreen: Updated balance from backend:', balance, 'CMT');
        console.log('   - User mining status:', userResp.miningStatus);
        setTokens(balance);
        setMiningStatus(userResp.miningStatus || 'idle');
        setUserMultiplier(userResp.multiplier || 1);
      }

      const { miningAPI } = await import('../services/api');
      const statusResp = await miningAPI.getStatus();
      if (statusResp && statusResp.session) {
        const sess = statusResp.session;
        console.log('HomeScreen: Mining session status:', sess.status);
        setMiningSession(sess);
        setMiningStatus(sess.status || 'idle');
        
        // Check if mining is complete (timer reached 0)
        if (sess.status === 'mining') {
          const start = new Date(sess.miningStartTime || sess.createdDate).getTime();
          const now = Date.now();
          const planned = (sess.selectedHour || 1) * 3600;
          const elapsed = Math.floor((now - start) / 1000);
          const remaining = Math.max(0, planned - elapsed);
          const currentEarned = Math.min(elapsed, planned) * 0.01 * (sess.multiplier || 1);
          
          // If timer is complete, show notification
          if (remaining === 0) {
            console.log('⏰ HomeScreen: Mining complete detected!');
            console.log('   - Earned:', currentEarned.toFixed(2), 'CMT');
            
            // Show notification
            await NotificationService.showCustomNotification(
              '⏰ Mining Complete!',
              `Your rewards are ready! You earned ${currentEarned.toFixed(2)} CMT. Tap to claim now!`,
              {
                type: 'mining_complete',
                screen: 'Mining',
                sessionId: String(sess._id),
              }
            );
            console.log('✅ Notification shown from HomeScreen');
          }
        }
        
        // Auto-navigate to MiningScreen if there's an active mining session
        if (autoNavigate && sess.status === 'mining' && sess._id) {
          console.log('✅ HomeScreen: Active mining session found!');
          console.log('   - Session ID:', sess._id);
          console.log('   - Session status:', sess.status);
          console.log('   - Session start time:', sess.miningStartTime);
          console.log('   - Navigating to MiningScreen...');
          // Use setTimeout to ensure navigation happens after render
          setTimeout(() => {
            console.log('🚀 HomeScreen: Executing navigation to Mining screen');
            navigation.navigate('Mining', { sessionId: sess._id });
          }, 200);
        } else if (autoNavigate) {
          console.log('ℹ️ HomeScreen: No active mining session found');
          console.log('   - Session exists:', !!sess);
          console.log('   - Session status:', sess?.status);
          console.log('   - Session ID:', sess?._id);
        }
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      if (autoNavigate) {
        setCheckingSession(false);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authAPI.logout();
          navigation.replace('Signup');
        },
      },
    ]);
  };

  const handleStartClaiming = () => {
    // If there's an active session, navigate directly to mining screen
    if (miningSession && miningSession.status === 'mining') {
      navigation.navigate('Mining', { sessionId: miningSession._id });
      return;
    }

    // open our animated duration panel (centered)
    setSelectedHours(1);
    setShowDurationModal(true);
    setAnimatedVisible(true);
    // animate backdrop fade and scale in
    slideAnim.setValue(0.8);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const startMiningWithHours = async (hours: number) => {
    try {
      const { miningAPI } = await import('../services/api');
      console.log('Starting mining with hours:', hours);
      const resp = await miningAPI.startMining(hours);
      console.log('Mining start response:', resp);
      
      if (resp && resp.session && resp.session._id) {
        setMiningSession(resp.session);
        setMiningStatus('mining');
        console.log('Navigating to Mining screen with sessionId:', resp.session._id);
        
        // Schedule notification for when mining completes
        const BASE_RATE = 0.01;
        const expectedEarned = hours * 3600 * BASE_RATE * (resp.session.multiplier || 1);
        const miningStartTime = new Date(resp.session.miningStartTime || resp.session.createdDate);
        
        console.log('📅 Scheduling notification for mining completion');
        await NotificationService.scheduleMiningCompleteNotification(
          miningStartTime,
          hours,
          expectedEarned,
          resp.session._id
        );
        
        navigation.navigate('Mining', { sessionId: resp.session._id });
      } else {
        console.error('Invalid response from startMining:', resp);
        Alert.alert('Error', 'Failed to start mining session. Invalid response from server.');
      }
    } catch (err) {
      console.error('Error starting mining:', err);
      const msg = (err as any)?.response?.data?.message || String((err as any)?.message || 'Could not start mining');
      Alert.alert('Error', msg);
    }
  };

  const handleModalNext = async () => {
    const hours = selectedHours || 1;
    // animate out then start
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
      startMiningWithHours(hours);
    });
  };

  const handleModalBack = () => {
    // animate out and close
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#749BC2', '#98A1BC', '#91C8E4', '#749BC2']}
        style={StyleSheet.absoluteFill}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      />
      <StatusBar barStyle="light-content" backgroundColor="#749BC2" />
      
      <BackgroundSVG />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crypto Miner</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        
        <View style={styles.walletCard}>
          <ImageBackground
            source={require('./assets/wallet.png')}
            style={styles.walletBackground}
            imageStyle={styles.walletBackgroundImage}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)']}
              style={styles.walletGradient}>
              <Text style={styles.walletLabel}>Wallet ID</Text>
              <Text style={styles.walletId}>{walletId}</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        
        <View style={styles.tokensContainer}>
          <View
            style={[
              styles.tokensGradient,
              { backgroundColor: '#ffffff', paddingTop: 28, overflow: 'hidden' }, // white box
            ]}>
            {LottieView ? (
              <LottieView
                source={require('./assets/star.json')}
                autoPlay
                loop
                // fill the whole box but keep a low opacity so text remains readable
                style={styles.tokensLottie}
                pointerEvents="none"
              />
            ) : null}

            <Text style={[styles.tokensLabel, { color: '#0f172a' }]}>Total Tokens</Text>
            <Text style={[styles.tokensValue, { color: '#0f172a' }]}>{tokens}</Text>
            <Text style={[styles.tokensCurrency, { color: '#0f172a' }]}>CMT</Text>
          </View>
        </View>

        
        <TouchableOpacity
          onPress={handleStartClaiming}
          activeOpacity={0.8}
          style={styles.claimButtonContainer}>
          <LinearGradient
            colors={['#234C6A', '#456882']}
            style={styles.claimButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.claimButtonText}>⛏️ Start Claiming</Text>
          </LinearGradient>
        </TouchableOpacity>

        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>Fast</Text>
              <Text style={styles.statLabel}>Mining</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>🔒</Text>
              <Text style={styles.statValue}>Secure</Text>
              <Text style={styles.statLabel}>Wallet</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>Profit</Text>
              <Text style={styles.statLabel}>24/7</Text>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      
      {animatedVisible && (
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleModalBack}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.modalCard,
              { 
                transform: [{ scale: slideAnim }],
                opacity: slideAnim,
              },
            ]}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={[styles.modalGradient, { marginTop: 12 }]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              
              <Text style={[styles.modalTitle, { color: '#0f2b4a' }]}>Select Duration</Text>
              <Text style={[styles.modalSub, { color: '#475569' }]}>Choose how long you want to mine</Text>

            
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Estimated rewards</Text>
                <Text style={styles.estimateValue}>{(() => {
                  const hrs = selectedHours || 1;
                  const estimate = hrs * 3600 * BASE_RATE * (userMultiplier || 1);
                  return `${Number(estimate).toFixed(2)} CMT`;
                })()}</Text>
              </View>

              <View style={styles.durationRow}>
                {[
                  { hr: 1, icon: 'timer-sand' },
                  { hr: 2, icon: 'clock-time-two-outline' },
                  { hr: 4, icon: 'clock-time-four-outline' },
                  { hr: 12, icon: 'clock-time-twelve-outline' },
                  { hr: 18, icon: 'clock-alert-outline' },
                  { hr: 24, icon: 'hours-24' },
                ].map(item => {
                  const active = selectedHours === item.hr;
                  return (
                    <TouchableOpacity
                      key={item.hr}
                      activeOpacity={0.9}
                      style={[
                        styles.hourBtn,
                        active && styles.hourBtnActive,
                      ]}
                      onPress={() => setSelectedHours(item.hr)}>
                      <View style={[styles.watchIconContainer, active && styles.watchIconContainerActive]}>
                        <ClockIcon size={14} color={active ? '#234C6A' : '#64748b'} />
                      </View>

                      <ClockIcon size={32} color={active ? '#234C6A' : '#0f172a'} />
                      <Text style={[styles.hourBtnText, active && styles.hourBtnTextActive]}>{item.hr}h</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBack} onPress={handleModalBack}>
                  <LinearGradient
                    colors={['#234C6A', '#BADFDB']}
                    style={styles.modalBackGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                  <Text style={styles.modalBackText}>Back</Text>
                  </LinearGradient>

                </TouchableOpacity>

                <TouchableOpacity style={styles.modalNext} onPress={handleModalNext}>
                  <LinearGradient
                    colors={['#234C6A', '#BADFDB']}
                    style={styles.modalNextGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    <Text style={styles.modalNextText}>Next</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      )}
    </View>
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  walletCard: {
    marginBottom: 30,
  },
  walletBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  walletBackgroundImage: {
    borderRadius: 16,
    resizeMode: 'cover',
  },
  walletGradient: {
    padding: 20,
    borderRadius: 16,
  },
  walletLabel: {
    fontSize: 14,
    color: '#E8F4F8',
    marginBottom: 8,
    fontWeight: '600',
  },
  walletId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  tokensContainer: {
    marginBottom: 30,
  },
  tokensGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#26667F',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tokensLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: '600',
  },
  tokensValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  tokensCurrency: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 5,
    fontWeight: '600',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: width - 60,
    maxWidth: 450,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  modalGradient: {
    padding: 24,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  modalSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  hourBtn: {
    width: '30%',
    marginHorizontal: 4,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#E5E9C5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(15, 43, 74, 0.06)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  hourBtnActive: {
    backgroundColor: '#ffffff', // <-- changed to white
    borderColor: '#e6f5fb',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    transform: [{scale: 1.02}],
  },
  watchIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  watchIconContainerActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  hourIcon: {
    marginBottom: 4,
  },
  hourBtnText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 6,
  },
  hourBtnTextActive: {
    color: '#234C6A', // dark text when active on white bg
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalBack: {
     flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  modalBackGradient:{
     paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',

  },
  modalBackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalNext: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalNextGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  estimateRow: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  estimateLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontSize: 14,
  },
  estimateValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  tokensLottie: {
    position: 'absolute',
    // medium intensity: spread across box but not overpower text
    width: '140%',
    height: '140%',
    left: '-10%',
    top: '-10%',
    opacity: 0.45,
    zIndex: 0,
    transform: [{ scale: 1.05 }],
  },
  claimButtonContainer: {
    marginBottom: 30,
  },
  claimButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  claimButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statGradient: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#E8F4F8',
    fontWeight: '500',
  },
});

export default HomeScreen;

*/




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
} from 'react-native';
// use require to avoid missing TS types in this repo (vector icons optional)
const _IconModule = require('react-native-vector-icons/MaterialCommunityIcons');
const Icon = _IconModule && _IconModule.default ? _IconModule.default : _IconModule;
import ClockIcon from './Icons/ClockIcon';
import LinearGradient from 'react-native-linear-gradient';
// safe require Lottie (optional dependency)
let LottieView: any = null;
try {
  const _l = require('lottie-react-native');
  LottieView = _l && _l.default ? _l.default : _l;
} catch (e) {
  // lottie not installed, silently ignore
}
import Svg, {Circle, Path, Defs, RadialGradient, Stop} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI} from '../services/api';
import {showImmediate } from '../services/NotifcationService';

const {width, height} = Dimensions.get('window');

// Background SVG Component
const BackgroundSVG = () => (
  <Svg height={height} width={width} style={styles.svgBackground}>
    <Defs>
      <RadialGradient id="grad1" cx="50%" cy="50%">
        <Stop offset="0%" stopColor="#FFD6E8" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#C9B6E4" stopOpacity="0.1" />
      </RadialGradient>
    </Defs>
    <Circle cx={width * 0.2} cy={height * 0.15} r="120" fill="url(#grad1)" />
    <Circle cx={width * 0.8} cy={height * 0.3} r="90" fill="#E8DFF5" opacity="0.2" />
    <Circle cx={width * 0.5} cy={height * 0.7} r="150" fill="#FDE2E4" opacity="0.25" />
    <Circle cx={width * 0.9} cy={height * 0.8} r="100" fill="#DEEDF0" opacity="0.2" />
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
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const [userMultiplier, setUserMultiplier] = useState<number>(1);
  const BASE_RATE = 0.01; // tokens per second

  useEffect(() => {
    // Ensure vector icon font is loaded (helps if icons don't render)
    if (Icon && (Icon as any).loadFont) {
      (Icon as any).loadFont();
    }

    loadUserData();
    //bindNavigation(navigation).catch(() => {});
    fetchStatus();

    const interval = setInterval(async () => {
      try {
        const { miningAPI } = await import('../services/api');
        const statusResp = await miningAPI.getStatus();
        if (statusResp && statusResp.session) {
          const sess = statusResp.session;
          const start = new Date(sess.miningStartTime || sess.createdDate).getTime();
          const planned = (sess.selectedHour || 1) * 3600;
          const nowTs = Date.now();
          const elapsed = Math.floor((nowTs - start) / 1000);
          const remaining = Math.max(0, planned - elapsed);
          if (remaining === 0 && sess.status !== 'claimed') {
            await showImmediate('Timer ended', 'Timer is end — please claim your reward', { screen: 'Mining', sessionId: String(sess._id) });
            if (sess._id) {
              navigation.navigate('Mining', { sessionId: sess._id });
            }
          }
        }
      } catch {}
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const storedWalletId = await AsyncStorage.getItem('walletId');
      if (storedWalletId) {
        setWalletId(storedWalletId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const userResp = await authAPI.getUser();
      if (userResp) {
        setTokens(String(Number(userResp.totalToken || 0).toFixed(2)));
      }

      const { miningAPI } = await import('../services/api');
      const statusResp = await miningAPI.getStatus();
      if (statusResp && statusResp.session) {
        setMiningSession(statusResp.session);
        setMiningStatus(statusResp.session.status || 'idle');
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authAPI.logout();
          navigation.replace('Signup');
        },
      },
    ]);
  };

  const handleStartClaiming = () => {
    // If there's an active session, navigate directly to mining screen
    if (miningSession && miningSession.status === 'mining') {
      navigation.navigate('Mining', { sessionId: miningSession._id });
      return;
    }

    // open our animated duration panel
    setSelectedHours(1);
    setShowDurationModal(true);
    setAnimatedVisible(true);
    // animate backdrop fade and panel slide up
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const startMiningWithHours = async (hours: number) => {
    try {
      const { miningAPI } = await import('../services/api');
      const resp = await miningAPI.startMining(hours);
      if (resp && resp.session) {
        setMiningSession(resp.session);
        setMiningStatus('mining');
        navigation.navigate('Mining', { sessionId: resp.session._id });
      }
    } catch (err) {
      console.error('Error starting mining:', err);
      const msg = (err as any)?.response?.data?.message || String((err as any)?.message || 'Could not start mining');
      Alert.alert('Error', msg);
    }
  };

  const handleModalNext = async () => {
    const hours = selectedHours || 1;
    // animate down then start (fade backdrop too)
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
      startMiningWithHours(hours);
    });
  };

  const handleModalBack = () => {
    // animate down and close (fade backdrop)
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setShowDurationModal(false);
      setAnimatedVisible(false);
    });
  };

  return (
    <LinearGradient
      colors={['#749BC2', '#98A1BC', '#91C8E4', '#749BC2']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <StatusBar barStyle="light-content" backgroundColor="#749BC2" />
      
      <BackgroundSVG />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crypto Miner</Text>
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
              colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)']}
              style={styles.walletGradient}>
              <Text style={styles.walletLabel}>Wallet ID</Text>
              <Text style={styles.walletId}>{walletId}</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Total Tokens Earned (white background with Lottie star) */}
        <View style={styles.tokensContainer}>
          <View
            style={[
              styles.tokensGradient,
              { backgroundColor: '#ffffff', paddingTop: 28, overflow: 'hidden' }, // white box
            ]}>
            {LottieView ? (
              <LottieView
                source={require('./assets/star.json')}
                autoPlay
                loop
                // fill the whole box but keep a low opacity so text remains readable
                style={styles.tokensLottie}
                pointerEvents="none"
              />
            ) : null}

            <Text style={[styles.tokensLabel, { color: '#0f172a' }]}>Total Tokens</Text>
            <Text style={[styles.tokensValue, { color: '#0f172a' }]}>{tokens}</Text>
            <Text style={[styles.tokensCurrency, { color: '#0f172a' }]}>CMT</Text>
          </View>
        </View>

        {/* Start Claiming Button */}
        <TouchableOpacity
          onPress={handleStartClaiming}
          activeOpacity={0.8}
          style={styles.claimButtonContainer}>
          <LinearGradient
            colors={['#234C6A', '#456882']}
            style={styles.claimButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.claimButtonText}>⛏️ Start Claiming</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Animated Duration Selection Panel (slide-up) */}
        {animatedVisible && (
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={handleModalBack}>
              <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
            </TouchableWithoutFeedback>

            <Animated.View
              style={[
                styles.modalCard,
                { transform: [{ translateY: slideAnim }] },
              ]}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={[styles.modalGradient, { marginTop: 12 }]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                
                <Text style={[styles.modalTitle, { color: '#0f2b4a' }]}>Select Duration</Text>
                <Text style={[styles.modalSub, { color: '#475569' }]}>Choose how long you want to mine</Text>

                {/* Estimated tokens preview */}
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Estimated rewards</Text>
                  <Text style={styles.estimateValue}>{(() => {
                    const hrs = selectedHours || 1;
                    const estimate = hrs * 3600 * BASE_RATE * (userMultiplier || 1);
                    return `${Number(estimate).toFixed(2)} CMT`;
                  })()}</Text>
                </View>

                <View style={styles.durationRow}>
                  {[
                    { hr: 1, icon: 'timer-sand' },
                    { hr: 2, icon: 'clock-time-two-outline' },
                    { hr: 4, icon: 'clock-time-four-outline' },
                    { hr: 12, icon: 'clock-time-twelve-outline' },
                    { hr: 18, icon: 'clock-alert-outline' },
                    { hr: 24, icon: 'hours-24' },
                  ].map(item => {
                    const active = selectedHours === item.hr;
                    return (
                      <TouchableOpacity
                        key={item.hr}
                        activeOpacity={0.9}
                        style={[
                          styles.hourBtn,
                          active && styles.hourBtnActive,
                        ]}
                        onPress={() => setSelectedHours(item.hr)}>
                        <View style={[styles.watchIconContainer, active && styles.watchIconContainerActive]}>
                          <ClockIcon size={14} color={active ? '#234C6A' : '#64748b'} />
                        </View>

                        <ClockIcon size={32} color={active ? '#234C6A' : '#0f172a'} />
                        <Text style={[styles.hourBtnText, active && styles.hourBtnTextActive]}>{item.hr}h</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalBack} onPress={handleModalBack}>
                    <LinearGradient
                      colors={['#234C6A', '#BADFDB']}
                      style={styles.modalBackGradient}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}>
                    <Text style={styles.modalBackText}>Back</Text>
                    </LinearGradient>

                  </TouchableOpacity>

                  <TouchableOpacity style={styles.modalNext} onPress={handleModalNext}>
                    <LinearGradient
                      colors={['#234C6A', '#BADFDB']}
                      style={styles.modalNextGradient}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}>
                      <Text style={styles.modalNextText}>Next</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        )}

        {/* Leaderboard Card */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.9} onPress={() => navigation.navigate('Leaderboard')}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.statGradient}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statValue}>Leaderboard</Text>
              <Text style={styles.statLabel}>Top total tokens</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  walletCard: {
    marginBottom: 30,
  },
  walletBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  walletBackgroundImage: {
    borderRadius: 16,
    resizeMode: 'cover',
  },
  walletGradient: {
    padding: 20,
    borderRadius: 16,
  },
  walletLabel: {
    fontSize: 14,
    color: '#E8F4F8',
    marginBottom: 8,
    fontWeight: '600',
  },
  walletId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  tokensContainer: {
    marginBottom: 30,
  },
  tokensGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#26667F',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tokensLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: '600',
  },
  tokensValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  tokensCurrency: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 5,
    fontWeight: '600',
  },
  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  modalGradient: {
    padding: 24,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  modalSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  hourBtn: {
    width: '30%',
    marginHorizontal: 4,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#E5E9C5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(15, 43, 74, 0.06)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  hourBtnActive: {
    backgroundColor: '#ffffff', // <-- changed to white
    borderColor: '#e6f5fb',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    transform: [{scale: 1.02}],
  },
  watchIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  watchIconContainerActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  hourIcon: {
    marginBottom: 4,
  },
  hourBtnText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 6,
  },
  hourBtnTextActive: {
    color: '#234C6A', // dark text when active on white bg
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalBack: {
     flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  modalBackGradient:{
     paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',

  },
  modalBackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalNext: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalNextGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  estimateRow: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  estimateLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontSize: 14,
  },
  estimateValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  tokensLottie: {
    position: 'absolute',
    // medium intensity: spread across box but not overpower text
    width: '140%',
    height: '140%',
    left: '-10%',
    top: '-10%',
    opacity: 0.45,
    zIndex: 0,
    transform: [{ scale: 1.05 }],
  },
  claimButtonContainer: {
    marginBottom: 30,
  },
  claimButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#234C6A',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  claimButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statGradient: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#E8F4F8',
    fontWeight: '500',
  },
});

export default HomeScreen;
