import React, {useEffect, useState, useRef} from 'react';
import {StyleSheet, Dimensions, Animated, Text, View} from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, Path, Defs, RadialGradient, Stop} from 'react-native-svg';

const {width, height} = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

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

const SplashScreen: React.FC<SplashScreenProps> = ({onFinish}) => {
  const [showText, setShowText] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const handleAnimationFinish = () => {
    setShowText(true);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer effect loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      onFinish();
    }, 2500);
  };

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!showText) {
        handleAnimationFinish();
      }
    }, 10000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [showText]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <LinearGradient
      colors={['#1B3C53', '#1B3C53', '#1B3C53', '#1B3C53']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <BackgroundSVG />
      
      {!showText ? (
        <LottieView
          source={require('./assets/abstraction.json')}
          autoPlay
          loop={false}
          style={styles.lottie}
          onAnimationFinish={handleAnimationFinish}
        />
      ) : (
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <View style={styles.textWrapper}>
            <Text style={styles.cryptoText}>CRYPTO</Text>
            <Animated.View style={{opacity: shimmerOpacity}}>
              <Text style={styles.minerText}>MINER</Text>
            </Animated.View>
            <Text style={styles.appText}>APP</Text>
          </View>
          
          <View style={styles.decorativeLine} />
          
          <Text style={styles.tagline}>⛏️ Mine Your Future ⛏️</Text>
        </Animated.View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  lottie: {
    width: width,
    height: height,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  textWrapper: {
    alignItems: 'center',
  },
  cryptoText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#456882',
    letterSpacing: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(124, 58, 237, 0.3)',
    textShadowOffset: {width: 0, height: 4},
    textShadowRadius: 12,
  },
  minerText: {
    fontSize: 68,
    fontWeight: '900',
    color: '#8DBCC7',
    letterSpacing: 12,
    textAlign: 'center',
    marginVertical: 4,
    textShadowColor: 'rgba(167, 139, 250, 0.5)',
    textShadowOffset: {width: 0, height: 6},
    textShadowRadius: 16,
  },
  appText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#648DB3',
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(129, 140, 248, 0.3)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 10,
  },
  decorativeLine: {
    width: 180,
    height: 4,
    backgroundColor: '#213448',
    borderRadius: 2,
    marginVertical: 20,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4E6688',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(99, 102, 241, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 6,
  },
});

export default SplashScreen;