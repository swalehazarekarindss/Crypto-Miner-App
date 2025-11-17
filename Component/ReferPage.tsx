import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Share,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { referralAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

/* ---------- Background SVG ----------- */
const BackgroundSVG = () => (
  <Svg height={height} width={width} style={styles.svgBackground}>
    <Defs>
      <RadialGradient id="grad1" cx="50%" cy="50%">
        <Stop offset="0%" stopColor="#9BB4C0" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#E6D8C3" stopOpacity="0.1" />
      </RadialGradient>
    </Defs>

    <Circle cx={width * 0.2} cy={height * 0.15} r="120" fill="url(#grad1)" />
    <Circle cx={width * 0.8} cy={height * 0.3} r="90" fill="#E6D8C3" opacity={0.2} />
    <Circle cx={width * 0.5} cy={height * 0.7} r="150" fill="#016B61" opacity={0.25} />
    <Circle cx={width * 0.9} cy={height * 0.8} r="100" fill="#E6D8C3" opacity={0.2} />

    <Path
      d={`M 0 ${height * 0.6} Q ${width * 0.25} ${height * 0.55} ${width * 0.5} ${height * 0.6} 
         T ${width} ${height * 0.6} L ${width} ${height} L 0 ${height} Z`}
      fill="#F8EDEB"
      opacity="0.3"
    />
  </Svg>
);

/* ------------------------------------------------------------- */

const ReferPage = ({ navigation }: any) => {
  const [walletId, setWalletId] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUsedReferral, setHasUsedReferral] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  /* ---------- Entrance Animation ----------- */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  /* ---------- Neon Button Pulse ----------- */
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /* ---------- Toast System ----------- */
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastColor = useRef("#16A34A"); // green default
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    loadWalletId();
    checkReferralStatus();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadWalletId = async () => {
    const storedWalletId = await AsyncStorage.getItem('walletId');
    if (storedWalletId) setWalletId(storedWalletId);
  };

  const checkReferralStatus = async () => {
    try {
      const status = await referralAPI.checkReferralStatus();
      setHasUsedReferral(status.hasUsedReferral);
    } catch (error) {
      console.error('Error checking referral status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  /* ---------- Updated Toast Function (SUCCESS/ERROR) ----------- */
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    toastColor.current = type === "success" ? "#16A34A" : "#A34343"; // green / red

    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 1800);
    });
  };

  /* ---------- Share ----------- */
  const handleShare = async () => {
    await Share.share({
      message: `Use my referral code: ${walletId}`,
    });
  };

  /* ---------- Submit Referral ----------- */
  const handleSubmit = async () => {
    if (!referralCode.trim()) {
      showToast("Enter a referral code", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await referralAPI.submitReferralCode(referralCode.trim());
      showToast("Referral Applied 🎉", "success");
      setReferralCode('');
      setHasUsedReferral(true);
    } catch (error: any) {
      showToast(error.response?.data?.message || "Invalid wallet ID", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------- */

  return (
    <LinearGradient colors={['#1B3C53', '#1B3C53']} style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3C53" />
      <BackgroundSVG />

      <View style={styles.containerOuter}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>🎁</Text>
            <View>
              <Text style={styles.title}>Refer & Earn</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backBtn}>
            <LinearGradient
              colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
              style={styles.backBtnGradient}
            >
              <Text style={styles.backText}>← Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          showsVerticalScrollIndicator={false}
        >
          {/* Your Code Card */}
          <View style={styles.neonCard}>
            <Text style={styles.cardTitle}>Your Referral Code</Text>

            <View style={styles.neonBorderBox}>
              <Text style={styles.codeText}>{walletId || "Loading..."}</Text>
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity activeOpacity={0.85} onPress={handleShare}>
                <LinearGradient
                  colors={['#183B4E', '#90D1CA']}
                  style={styles.neonButton}
                >
                  <Text style={styles.neonButtonText}>📤 Share Code</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Enter Referral Code */}
          {checkingStatus ? (
            <View style={styles.neonCard}>
              <ActivityIndicator color="#00eaff" size="large" />
            </View>
          ) : hasUsedReferral ? (
            <View style={styles.neonCard}>
              <Text style={styles.cardTitle}>✅ Referral Applied</Text>
              <Text style={styles.alreadyUsedText}>
                You have already used a referral code. You cannot use it again.
              </Text>
            </View>
          ) : (
            <View style={styles.neonCard}>
              <Text style={styles.cardTitle}>Enter Referral Code</Text>
              <Text style={styles.cardSubtitle}>Enter a friend's wallet ID to earn bonus tokens.</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter wallet ID"
                placeholderTextColor="#aaa"
                value={referralCode}
                onChangeText={setReferralCode}
              />

              <TouchableOpacity activeOpacity={0.85} disabled={loading} onPress={handleSubmit}>
                <LinearGradient
                  colors={['#86B0BD', '#FAF7F3']}
                  style={styles.submitButton}
                >
                  {loading ? <ActivityIndicator color="#1B3C53" /> : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <Text style={styles.infoText}>
              • Share your referral code with friends{"\n"}
              • Both users earn **200 tokens**{"\n"}
              • A user can only redeem a code **once**{"\n"}
            </Text>
          </View>

          <View style={{ height: 30 }} />
        </Animated.ScrollView>
      </View>

      {/* Toast */}
      <Animated.View style={[
        styles.toast,
        { opacity: toastOpacity, backgroundColor: toastColor.current }
      ]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </LinearGradient>
  );
};

/* ------------------------------------------------------------- */
/* -------------------------- STYLES --------------------------- */
/* ------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: { flex: 1 },

  svgBackground: { position: 'absolute', top: 0, left: 0 },

  containerOuter: {
    flex: 1,
    marginTop: 70,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { fontSize: 38 },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  backBtn: { borderRadius: 12, overflow: 'hidden' },
  backBtnGradient: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  /* Cards */
  neonCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,255,255,0.3)',
    shadowColor: '#00f6ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#c9f1ff',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#aad8ff',
    marginBottom: 12,
  },

  neonBorderBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00eaff',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#b8efff',
  },

  neonButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00eaff',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  neonButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
    marginBottom: 16,
  },

  submitButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#8a2fff',
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  submitButtonText: { fontSize: 16, fontWeight: '800', color: '#1B3C53' },

  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#b8efff', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#d4f7ff', lineHeight: 20 },

  alreadyUsedText: {
    fontSize: 15,
    color: '#aad8ff',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },

  toast: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 10,
  },
  toastText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});

export default ReferPage;
