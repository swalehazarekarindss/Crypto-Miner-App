/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    sourceExts: ['tsx', 'ts', 'js', 'jsx', 'json'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
