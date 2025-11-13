import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, Path, Defs, RadialGradient, Stop} from 'react-native-svg';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { authAPI } from '../services/api';

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

// Validation Schema
const SignupSchema = Yup.object().shape({
  walletId: Yup.string()
    .min(10, 'Wallet ID must be at least 10 characters')
    .max(50, 'Wallet ID is too long')
    .matches(/^[a-zA-Z0-9]+$/, 'Wallet ID can only contain letters and numbers')
    .required('Wallet ID is required'),
  /*password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),*/
});

interface SignupScreenProps {
  navigation: any;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSignup = async (values: { walletId: string; /*password: string*/ }) => {
    setLoading(true);
    try {
      console.log('Starting signup process...');
      const result = await authAPI.register(values.walletId, /*values.password*/);
      console.log('Signup successful:', result);
      alert('Account created successfully!');
      navigation.replace('Home');
    } catch (error: any) {
      console.error('Signup error full:', error);
      let message = 'Signup failed. Please try again.';
      
      if (error.response) {
        message = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        message = 'Cannot connect to server. Please check if the server is running.';
      } else {
        message = error.message || 'An unexpected error occurred';
      }
      
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#749BC2" />

      <LinearGradient 
        colors={['#749BC2', '#4682A9', '#91C8E4', '#98A1BC']} 
        style={styles.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <BackgroundSVG />
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={['#234C6A', '#BADFDB', '#234C6A']}
                style={styles.logoGradient}
              >
                <Text style={styles.logoIcon}>💎</Text>
              </LinearGradient>
            </Animated.View>

            <View style={styles.decorativeBar}>
              <View style={styles.decorativeDot} />
              <View style={styles.decorativeLine} />
              <View style={styles.decorativeDot} />
            </View>
          </View>

          {/* Signup Form */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Create Account</Text>
             
            </View>

            <Formik
              initialValues={{ walletId: '', password: '', confirmPassword: '' }}
              validationSchema={SignupSchema}
              onSubmit={handleSignup}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.form}>
                  {/* Wallet ID */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Wallet ID</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputIcon}>🔑</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your wallet ID"
                        placeholderTextColor="#64748B"
                        value={values.walletId}
                        onChangeText={handleChange('walletId')}
                        onBlur={handleBlur('walletId')}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    {touched.walletId && errors.walletId && (
                      <Text style={styles.errorText}>{errors.walletId}</Text>
                    )}
                  </View>

                  {/* Password */}
                {/*  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputIcon}>🔒</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Create a password"
                        placeholderTextColor="#64748B"
                        secureTextEntry={!showPassword}
                        value={values.password}
                        onChangeText={handleChange('password')}
                        onBlur={handleBlur('password')}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Text style={styles.eyeIconText}>
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {touched.password && errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                  </View>

                
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputIcon}>✅</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="enter your password"
                        placeholderTextColor="#64748B"
                        secureTextEntry={!showConfirmPassword}
                        value={values.confirmPassword}
                        onChangeText={handleChange('confirmPassword')}
                        onBlur={handleBlur('confirmPassword')}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        <Text style={styles.eyeIconText}>
                          {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
                  </View>
             */ }

                  {/* Signup Button */}
                  <TouchableOpacity onPress={handleSubmit as any} disabled={loading} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#26667F', '#154D71']}
                      style={styles.signupButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.signupButtonText}>
                        {loading ? '⏳ Creating...' : '🚀 Create Account'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Login Link */}
                  <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                      <Text style={styles.signupLink}>Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { marginBottom: 20 },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#113F67',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoIcon: { fontSize: 50 },
  decorativeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#113F67',
  },
  decorativeLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formHeader: { marginBottom: 24 },
  formTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: '#E8F4F8' },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
  },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, height: 50, fontSize: 16, color: '#FFFFFF' },
  eyeIcon: { padding: 8 },
  eyeIconText: { fontSize: 20 },
  errorText: { fontSize: 12, color: '#FFE5E5', marginTop: 4, marginLeft: 4 },
  signupButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#26667F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0,
    shadowRadius: 8,
elevation: 6,
},
signupButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
signupContainer: {
flexDirection: 'row',
justifyContent: 'center',
alignItems: 'center',
marginTop: 20,
},
signupText: { fontSize: 14, color: '#E8F4F8' },
signupLink: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },
form: {
width: '100%',
},
});
export default SignupScreen;