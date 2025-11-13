import React, {useEffect, useState, useRef, useMemo} from 'react';
import {StyleSheet, Dimensions, View, Text, TouchableOpacity, Alert, ActivityIndicator, Animated} from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, Path, Defs, RadialGradient, Stop} from 'react-native-svg';
import {miningAPI} from '../services/api';

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
    <Circle cx={width * 0.8} cy={height * 0.3} r="90" fill="#E8DFF5" opacity={0.2} />
    <Circle cx={width * 0.5} cy={height * 0.7} r="150" fill="#FDE2E4" opacity={0.25} />
    <Circle cx={width * 0.9} cy={height * 0.8} r="100" fill="#DEEDF0" opacity={0.2} />
    <Path
      d={`M 0 ${height * 0.6} Q ${width * 0.25} ${height * 0.55} ${width * 0.5} ${height * 0.6} T ${width} ${height * 0.6} L ${width} ${height} L 0 ${height} Z`}
      fill="#F8EDEB"
      opacity={0.3}
    />
  </Svg>
);

interface Props {
  navigation: any;
  route: any;
}

const BASE_RATE = 0.01;
const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-7618137451217129/6689745040';

const MiningScreen: React.FC<Props> = ({navigation, route}) => {
  const sessionId = route?.params?.sessionId;
  const [session, setSession] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [earned, setEarned] = useState<number>(0);
  const [upgrading, setUpgrading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [adShowing, setAdShowing] = useState(false);
  const intervalRef = useRef<any>(null);
  const rewardedRef = useRef(
    RewardedAd.createForAdRequest(adUnitId, { keywords: ['gaming','rewards'] })
  );

  // Animation values for stars twinkling
  const starOpacities = useRef(
    Array.from({length: 50}, () => new Animated.Value(Math.random()))
  ).current;

  // Halo animation
  const haloAnim = useRef(new Animated.Value(0)).current;

  // Multiplier button animations (scale + glow)
  const multiplierAnims = useRef(
    Array.from({length: 6}, () => ({
      scale: new Animated.Value(1),
      glow: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  // Particle animations for active multiplier
  const particleAnims = useRef(
    Array.from({length: 8}, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
    }))
  ).current;

  // Progress bar shimmer
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Earned counter animation
  const earnedScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!sessionId) {
      Alert.alert('No session', 'No mining session specified', [{text: 'OK', onPress: () => navigation.goBack()}]);
      return;
    }
    loadSession();
    startStarAnimation();
    startHaloAnimation();
    startShimmerAnimation();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId]);

  // Animate earned counter on update
  useEffect(() => {
    Animated.sequence([
      Animated.timing(earnedScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(earnedScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [Math.floor(earned)]);

  const startStarAnimation = () => {
    starOpacities.forEach((opacity) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const startHaloAnimation = () => {
    haloAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(haloAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  };

  const startShimmerAnimation = () => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  // Animate multiplier button (pulse + glow + rotate)
  const animateMultiplierButton = (index: number, isActive: boolean) => {
    const anim = multiplierAnims[index];
    
    if (isActive) {
      // Continuous pulse for active button
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(anim.scale, { toValue: 1.15, duration: 800, useNativeDriver: true }),
            Animated.timing(anim.glow, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(anim.rotate, { toValue: 1, duration: 1600, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(anim.scale, { toValue: 1.05, duration: 800, useNativeDriver: true }),
            Animated.timing(anim.glow, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          ]),
        ])
      ).start();

      // Start particle animation
      startParticleAnimation();
    } else {
      // Reset animation
      Animated.parallel([
        Animated.timing(anim.scale, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(anim.glow, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(anim.rotate, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  };

  // Particle burst animation
  const startParticleAnimation = () => {
    const animations = particleAnims.map((particle, i) => {
      const angle = (i / particleAnims.length) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateX, {
              toValue: Math.cos(angle) * distance,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: Math.sin(angle) * distance,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.translateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.stagger(100, animations).start();
  };

  useEffect(() => {
    if (session) {
      multiplierAnims.forEach((anim, idx) => {
        animateMultiplierButton(idx, session.multiplier === idx + 1);
      });
    }
  }, [session?.multiplier]);

  const loadSession = async () => {
    try {
      const resp = await miningAPI.getStatus();
      if (resp && resp.session && resp.session._id === sessionId) {
        setSession(resp.session);
        startLocalTimer(resp.session);
      } else if (resp && resp.session && resp.session._id !== sessionId) {
        setSession(resp.session);
        startLocalTimer(resp.session);
      } else {
        Alert.alert('Session not found', 'No active session found.', [{text: 'OK', onPress: () => navigation.goBack()}]);
      }
    } catch (err) {
      console.error('Error loading session:', err);
    }
  };

  const startLocalTimer = (sess: any) => {
    const start = new Date(sess.miningStartTime || sess.createdDate).getTime();
    const planned = (sess.selectedHour || 1) * 3600;
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    const left = Math.max(0, planned - elapsed);
    setSecondsLeft(left);

    const initialEarned = Math.min(elapsed, planned) * BASE_RATE * (sess.multiplier || 1);
    setEarned(initialEarned);

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!paused) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => Math.max(0, prev - 1));
        setEarned(prev => prev + BASE_RATE * (sess.multiplier || 1));
      }, 1000);
    }
  };

  const pauseMining = () => {
    setPaused(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resumeMining = (sess?: any) => {
    setPaused(false);
    const s = sess || session;
    if (s) startLocalTimer(s);
  };

  const setMultiplier = async (target: number) => {
    if (!session) return;
    if (session.multiplier >= target) {
      setSession((s: any) => ({ ...s, multiplier: Math.min(target, s.multiplier) }));
      return;
    }
    setUpgrading(true);
    pauseMining();
    setAdShowing(true);
    let rewardEarned = false;
    const rewarded = rewardedRef.current;
    const unsubReward = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardEarned = true;
    });
    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, async () => {
      setAdShowing(false);
      try {
        if (rewardEarned) {
          let current = session.multiplier || 1;
          while (current < target && current < 6) {
            const resp = await miningAPI.upgradeMultiplier(session._id);
            if (resp && resp.session) {
              setSession(resp.session);
              current = resp.session.multiplier || current + 1;
            } else {
              break;
            }
            await new Promise(res => setTimeout(res, 400));
          }
          if (target === 2) {
            setTimeout(() => {
              setEarned(prev => prev + 2);
            }, 1000);
          }
        }
      } catch (err) {
        console.error('setMultiplier error:', err);
        Alert.alert('Error', 'Could not set multiplier');
      } finally {
        setUpgrading(false);
        unsubReward();
        unsubClosed();
        if (unsubLoad) unsubLoad();
        if (unsubError) unsubError();
        resumeMining();
      }
    });
    const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      setAdShowing(false);
      setUpgrading(false);
      unsubReward();
      unsubClosed();
      if (unsubLoad) unsubLoad();
      resumeMining();
      Alert.alert('Ad Error', 'Could not load ad. Please try again.');
    });
    rewarded.load();
    const unsubLoad = rewarded.addAdEventListener(AdEventType.LOADED, () => {
      rewarded.show();
    });
  };

  const formatTime = (s: number) => {
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`;
  };

  const progress = () => {
    if (!session) return 0;
    const planned = (session.selectedHour || 1) * 3600;
    return ((planned - secondsLeft) / planned) || 0;
  };

  const circlePositions = useMemo(() => {
    const positions: Array<{x:number,y:number}> = [];
    const radiusPercent = 36;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = 50 + Math.cos(angle) * radiusPercent;
      const y = 50 + Math.sin(angle) * radiusPercent;
      positions.push({ x, y });
    }
    return positions;
  }, []);

  const multiplierEmojis = ['🌱','🌿','✨','💎','🚀','🌟'];
  const multiplierColors = [
    ['#10b981', '#059669'],
    ['#3b82f6', '#2563eb'],
    ['#8b5cf6', '#7c3aed'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'],
    ['#ec4899', '#db2777'],
  ];

  const haloLarge = (width - 40) * 0.9;
  const haloMed = (width - 40) * 0.6;
  const haloSmall = (width - 40) * 0.4;

  const [starPositions] = useState(() => {
    return Array.from({length: 50}, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
    }));
  });

  const [flowerPositions] = useState(() => {
    return Array.from({length: 15}, () => ({
      left: 5 + Math.random() * 90,
      bottom: Math.random() * 40,
      size: 12 + Math.random() * 8,
    }));
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <LinearGradient colors={['#749BC2', '#4682A9', '#91C8E4', '#98A1BC']} style={styles.container} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
      <BackgroundSVG />
      <View style={styles.inner}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>⛏️ Mining</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{paused || adShowing ? 'Paused' : 'Active'}</Text>
            </View>
          </View>

        <Animated.View style={[styles.box, {transform: [{scale: earnedScale}]}]}>
          <Text style={styles.boxLabel}>💰 Total Earned</Text>
          <Text style={styles.boxValue}>{earned.toFixed(2)} CMT</Text>
          <View style={styles.boxGlow} />
        </Animated.View>

        <View style={styles.timerRow}>
          <View style={styles.timerLeft}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>Time Left</Text>
          </View>
          <Text style={styles.timerValue}>{formatTime(secondsLeft)}</Text>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.multBadge}>
            <Text style={styles.multBadgeText}>{session?.multiplier || 1}x</Text>
          </View>
          <View style={styles.progressBar}>
            {(() => {
              const pct = Math.min(100, Math.max(0, Math.floor(progress() * 100)));
              return (
                <>
                  <LinearGradient
                    colors={['#10b981', '#059669', '#047857']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={[styles.progressFill, {width: `${pct}%`}]}
                  />
                  <Animated.View
                    style={[
                      styles.shimmer,
                      {
                        transform: [{translateX: shimmerTranslateX}],
                      },
                    ]}
                  />
                </>
              );
            })()}
          </View>
        </View>

        <View style={styles.multRow}>
          <Text style={styles.multLabel}>⚡ Multiplier</Text>
          <Text style={styles.multValue}>{session?.multiplier || 1}x</Text>
        </View>

        <View style={styles.svgContainer}>
          {starPositions.map((pos, i) => (
            <Animated.View
              key={`star-${i}`}
              style={[
                styles.star,
                {
                  left: `${pos.left}%`,
                  top: `${pos.top}%`,
                  opacity: starOpacities[i],
                }
              ]}
            />
          ))}

          <View pointerEvents="none" style={{position: 'absolute', left: 0, top: 0, width: width - 40, height: 350}}>
            <Animated.View style={[styles.halo, { width: haloLarge, height: haloLarge, borderRadius: haloLarge / 2, left: ((width - 40) / 2) - (haloLarge / 2), top: 175 - (haloLarge / 2), backgroundColor: 'rgba(16,185,129,0.08)', transform: [{ scale: haloAnim.interpolate({ inputRange: [0,1], outputRange: [0.98, 1.03] }) }], opacity: haloAnim.interpolate({ inputRange: [0,1], outputRange: [0.1, 0.2] }) }]} />
            <Animated.View style={[styles.halo, { width: haloMed, height: haloMed, borderRadius: haloMed / 2, left: ((width - 40) / 2) - (haloMed / 2), top: 175 - (haloMed / 2), backgroundColor: 'rgba(59,130,246,0.12)', transform: [{ scale: haloAnim.interpolate({ inputRange: [0,1], outputRange: [1, 1.06] }) }], opacity: haloAnim.interpolate({ inputRange: [0,1], outputRange: [0.12, 0.22] }) }]} />
            <Animated.View style={[styles.halo, { width: haloSmall, height: haloSmall, borderRadius: haloSmall / 2, left: ((width - 40) / 2) - (haloSmall / 2), top: 175 - (haloSmall / 2), backgroundColor: 'rgba(139,92,246,0.16)', transform: [{ scale: haloAnim.interpolate({ inputRange: [0,1], outputRange: [1.02, 1.08] }) }], opacity: haloAnim.interpolate({ inputRange: [0,1], outputRange: [0.14, 0.28] }) }]} />
          </View>

          {flowerPositions.map((pos, i) => (
            <Text
              key={`flower-${i}`}
              style={[
                styles.flower,
                {
                  left: `${pos.left}%`,
                  bottom: `${pos.bottom}%`,
                  fontSize: pos.size,
                }
              ]}
            >
              ❀
            </Text>
          ))}

          {circlePositions.map((pos, idx) => {
            const multiplier = idx + 1;
            const isActive = session?.multiplier === multiplier;
            const isPassed = (session?.multiplier || 1) > multiplier;
            const anim = multiplierAnims[idx];
            const colors = multiplierColors[idx];

            const rotateZ = anim.rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            });

            return (
              <Animated.View
                key={multiplier}
                style={[
                  styles.multiplierBtnWrapper,
                  {
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: [
                      {translateX: -32},
                      {translateY: -32},
                      {scale: anim.scale},
                      {rotate: isActive ? rotateZ : '0deg'},
                    ],
                  },
                ]}
              >
                {isActive && (
                  <>
                    {particleAnims.map((particle, pIdx) => (
                      <Animated.View
                        key={`particle-${pIdx}`}
                        style={[
                          styles.particle,
                          {
                            opacity: particle.opacity,
                            transform: [
                              {translateX: particle.translateX},
                              {translateY: particle.translateY},
                            ],
                          },
                        ]}
                      />
                    ))}
                  </>
                )}

                <TouchableOpacity
                  onPress={() => setMultiplier(multiplier)}
                  disabled={upgrading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isActive ? colors : isPassed ? ['#4a5568', '#2d3748'] : ['#1e3a5f', '#0f2950']}
                    style={[
                      styles.multiplierBtn,
                      isPassed && styles.multiplierBtnPassed,
                    ]}
                  >
                    {isActive && (
                      <Animated.View
                        style={[
                          styles.btnGlow,
                          {
                            opacity: anim.glow,
                            backgroundColor: colors[0],
                          },
                        ]}
                      />
                    )}
                    <View style={styles.multiplierBtnInner}>
                      <Text style={styles.multiplierEmoji}>{multiplierEmojis[idx]}</Text>
                      <Text style={[styles.multiplierBtnText, isActive && styles.multiplierBtnTextActive]}>{multiplier}x</Text>
                      {isActive && (
                        <View style={styles.activeBadge}>
                          <View style={styles.activeDot} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {(upgrading || adShowing) && (
            <View style={styles.upgradingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.upgradingText}>{adShowing ? '🎦 Watching Ad...' : '✨ Upgrading...'}</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 60 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  box: {
    backgroundColor: '#0f2950',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  boxGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16,185,129,0.05)',
    borderRadius: 16,
  },
  boxLabel: { color: '#9fb7da', fontSize: 14, fontWeight: '600' },
  boxValue: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 8 },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(15,41,80,0.5)',
    padding: 12,
    borderRadius: 12,
  },
  timerLeft: { flexDirection: 'row', alignItems: 'center' },
  timerIcon: { fontSize: 18, marginRight: 8 },
  timerText: { color: '#9fb7da', fontWeight: '600' },
  timerValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  progressBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#12334f',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  progressFill: {
    height: 16,
    borderRadius: 10,
  },
  shimmer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 100,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  multBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#08263f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  multBadgeText: { color: '#10b981', fontWeight: '700', fontSize: 18 },
  multRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'rgba(15,41,80,0.5)',
    padding: 12,
    borderRadius: 12,
  },
  multLabel: { color: '#9fb7da', fontWeight: '600' },
  multValue: { color: '#fff', fontWeight: '700', fontSize: 16 },
  svgContainer: {
    width: width - 40,
    height: 350,
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  halo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flower: {
    position: 'absolute',
    color: '#4a90e2',
    opacity: 0.4,
  },
  multiplierBtnWrapper: {
    position: 'absolute',
    width: 64,
    height: 64,
  },
  multiplierBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  multiplierBtnPassed: {
    opacity: 0.5,
  },
  btnGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 15,
  },
  multiplierBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierEmoji: { fontSize: 24, marginBottom: 2 },
  multiplierBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  multiplierBtnTextActive: {
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeBadge: {
    marginTop: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    top: 30,
    left: 30,
  },
  upgradingOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  upgradingText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MiningScreen;
