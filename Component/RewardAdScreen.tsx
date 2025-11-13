import React, { useEffect, useState } from 'react';
import { Button } from 'react-native';
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-1084981696075055/2480721504'; // Replace with your real ad unit ID

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['gaming', 'rewards'],
});
