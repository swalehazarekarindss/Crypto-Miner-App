/*const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUser, startMining, getMiningStatus, upgradeMultiplier, claimSession } = require('../controller/userController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected route (JWT verified inside controller)
router.get('/me', getUser);

// Mining routes
router.post('/mining/start', startMining);
router.get('/mining/status', getMiningStatus);
router.post('/mining/:sessionId/upgrade', upgradeMultiplier);
router.post('/mining/:sessionId/claim', claimSession);

module.exports = router;*/











const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUser, startMining, getMiningStatusWithComputed, upgradeMultiplier, claimSessionWithCommission, getLeaderboard, submitReferralCode, checkReferralStatus, watchAdReward } = require('../controller/userController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected route (JWT verified inside controller)
router.get('/me', getUser);

// Mining routes
router.post('/mining/start', startMining);
router.get('/mining/status', getMiningStatusWithComputed);
router.post('/mining/:sessionId/upgrade', upgradeMultiplier);
router.post('/mining/:sessionId/claim', claimSessionWithCommission);

// Leaderboard
router.get('/leaderboard', getLeaderboard);

// Referral
router.post('/referral/submit', submitReferralCode);
router.get('/referral/status', checkReferralStatus);

// Watch Ad Reward
router.post('/rewards/watch-ad', watchAdReward);

module.exports = router;

