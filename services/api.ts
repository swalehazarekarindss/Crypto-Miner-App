import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.80:5000/api/user'; // For Android emulator
// const API_URL = 'http://localhost:5000/api/user'; // For iOS simulator
// const API_URL = 'http://YOUR_LOCAL_IP:5000/api/user'; // For real device

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (walletId: string, /*password: string*/) => {
    try {
      console.log('Attempting registration:', {walletId, /*password: '***'*/});
      console.log('API URL:', API_URL);
      const response = await api.post('/register', {walletId, /*password*/});
      console.log('Registration response:', response.data);
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('walletId', response.data.user.walletId);
      }
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error.message);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  login: async (walletId: string, password: string) => {
    try {
      console.log('Attempting login:', {walletId, /*password: '***'*/});
      const response = await api.post('/login', {walletId});
      console.log('Login response:', response.data);
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('walletId', response.data.user.walletId);
      }
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.message);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  getUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },
  getLeaderboard: async () => {
    const response = await api.get('/leaderboard');
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('walletId');
  },
};

export const miningAPI = {
  startMining: async (selectedHour: number) => {
    const response = await api.post('/mining/start', { selectedHour });
    return response.data;
  },
  getStatus: async () => {
    const response = await api.get('/mining/status');
    return response.data;
  },
  upgradeMultiplier: async (sessionId: string) => {
    const response = await api.post(`/mining/${sessionId}/upgrade`);
    return response.data;
  },
  claimSession: async (sessionId: string) => {
    const response = await api.post(`/mining/${sessionId}/claim`);
    return response.data;
  },
};

export const referralAPI = {
  submitReferralCode: async (referralCode: string) => {
    const response = await api.post('/referral/submit', { referralCode });
    return response.data;
  },
  checkReferralStatus: async () => {
    const response = await api.get('/referral/status');
    return response.data;
  },
};

export const rewardAPI = {
  watchAd: async (walletId: string) => {
    const response = await api.post('/rewards/watch-ad', { walletId });
    return response.data;
  },
};