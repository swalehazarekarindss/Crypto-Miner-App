/*import React, {useEffect, useState} from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import HomeScreen from './HomeScreen';
import MiningScreen from './MiningScreen';
import { authAPI } from '../services/api';



const Stack = createNativeStackNavigator();





const AuthNavigator: React.FC = () => {
	const [initialRoute, setInitialRoute] = useState<'Login'|'Home'|'Signup'>('Login');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const token = await AsyncStorage.getItem('token');
				if (token) {
					// validate token by calling /me
					const resp = await authAPI.getUser();
					if (resp && (resp.user || resp)) {
						setInitialRoute('Home');
					} else {
						setInitialRoute('Login');
					}
				} else {
					setInitialRoute('Login');
				}
			} catch (err) {
				console.warn('Auth check failed', err);
				setInitialRoute('Login');
			} finally {
				setLoading(false);
			}
		};
		checkAuth();
	}, []);

	if (loading) {
		return (
			<View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0F172A'}}>
				<ActivityIndicator size="large" color="#2bd37b" />
			</View>
		);
	}

	return (
		<NavigationContainer>
			<StatusBar barStyle="light-content" backgroundColor="#0F172A" />
			<Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Login" component={LoginScreen} />
				<Stack.Screen name="Signup" component={SignupScreen} />
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen name="Mining" component={MiningScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default AuthNavigator;






























import React, {useEffect, useState} from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import HomeScreen from './HomeScreen';
import MiningScreen from './MiningScreen';
import { authAPI } from '../services/api';

const Stack = createNativeStackNavigator();

// ✅ Add Props interface to accept navigationRef
interface Props {
  navigationRef: React.RefObject<any>;
}

// ✅ Update component to accept navigationRef prop
const AuthNavigator: React.FC<Props> = ({navigationRef}) => {
	const [initialRoute, setInitialRoute] = useState<'Login'|'Home'|'Signup'>('Login');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const token = await AsyncStorage.getItem('token');
				if (token) {
					// validate token by calling /me
					const resp = await authAPI.getUser();
					if (resp && (resp.user || resp)) {
						setInitialRoute('Home');
					} else {
						setInitialRoute('Login');
					}
				} else {
					setInitialRoute('Login');
				}
			} catch (err) {
				console.warn('Auth check failed', err);
				setInitialRoute('Login');
			} finally {
				setLoading(false);
			}
		};
		checkAuth();
	}, []);

	if (loading) {
		return (
			<View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0F172A'}}>
				<ActivityIndicator size="large" color="#2bd37b" />
			</View>
		);
	}

	return (
		<NavigationContainer ref={navigationRef}>
			<StatusBar barStyle="light-content" backgroundColor="#0F172A" />
			<Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Login" component={LoginScreen} />
				<Stack.Screen name="Signup" component={SignupScreen} />
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen name="Mining" component={MiningScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default AuthNavigator;




import React, {useEffect, useState} from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import HomeScreen from './HomeScreen';
import MiningScreen from './MiningScreen';
import LeaderboardScreen from './LeaderboardScreen';
import { authAPI } from '../services/api';

const Stack = createNativeStackNavigator();

const AuthNavigator: React.FC = () => {
	const [initialRoute, setInitialRoute] = useState<'Login'|'Home'|'Signup'>('Login');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const token = await AsyncStorage.getItem('token');
				if (token) {
					// validate token by calling /me
					const resp = await authAPI.getUser();
					if (resp && (resp.user || resp)) {
						setInitialRoute('Home');
					} else {
						setInitialRoute('Login');
					}
				} else {
					setInitialRoute('Login');
				}
			} catch (err) {
				console.warn('Auth check failed', err);
				setInitialRoute('Login');
			} finally {
				setLoading(false);
			}
		};
		checkAuth();
	}, []);

	if (loading) {
		return (
			<View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0F172A'}}>
				<ActivityIndicator size="large" color="#2bd37b" />
			</View>
		);
	}

	return (
		<NavigationContainer>
			<StatusBar barStyle="light-content" backgroundColor="#0F172A" />
			<Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Login" component={LoginScreen} />
				<Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Mining" component={MiningScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default AuthNavigator;
*/






import React, {useEffect, useState, forwardRef} from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import HomeScreen from './HomeScreen';
import MiningScreen from './MiningScreen';
import LeaderboardScreen from './LeaderboardScreen';
import ReferPage from './ReferPage';
import { authAPI } from '../services/api';

const Stack = createNativeStackNavigator();

// Define the navigation param list type
type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: { refresh?: boolean } | undefined;
  Mining: { sessionId: string };
  Leaderboard: undefined;
  Refer: undefined;
};

const AuthNavigator = forwardRef<NavigationContainerRef<RootStackParamList>, {}>((props, ref) => {
  const [initialRoute, setInitialRoute] = useState<'Login'|'Home'|'Signup'>('Login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // validate token by calling /me
          const resp = await authAPI.getUser();
          if (resp && (resp.user || resp)) {
            setInitialRoute('Home');
          } else {
            setInitialRoute('Login');
          }
        } else {
          setInitialRoute('Login');
        }
      } catch (err) {
        console.warn('Auth check failed', err);
        setInitialRoute('Login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0F172A'}}>
        <ActivityIndicator size="large" color="#2bd37b" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={ref}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Mining" component={MiningScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Refer" component={ReferPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default AuthNavigator;