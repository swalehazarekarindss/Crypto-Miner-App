module.exports = {
  presets: [
    '@react-native/babel-preset',
    ['@babel/preset-typescript', {
      allowDeclareFields: true,
    }],
  ],
  plugins: [
    'react-native-reanimated/plugin',
  ],
};