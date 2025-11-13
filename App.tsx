import React, {useState} from 'react';
import {StatusBar} from 'react-native';
import SplashScreen from './Component/SplashScreen';
import AuthNavigator from './Component/AuthNavigator';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <AuthNavigator />
    </>
  );
}

export default App;
