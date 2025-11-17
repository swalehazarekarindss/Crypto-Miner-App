/*const User = require('../model/User.model');
const MiningSession = require('../model/MiningSession.model');
const jwt = require('jsonwebtoken');

// Helper: Generate JWT
const generateToken = (walletId) => {
  return jwt.sign({ walletId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Helper: Verify JWT (used inside controller)
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// 📝 REGISTER (SIGNUP)
exports.registerUser = async (req, res) => {
  try {
    const { walletId } = req.body;

    if (!walletId) {
      return res.status(400).json({ message: 'Wallet ID is required.' });
    }

    const existingUser = await User.findOne({ walletId });
    if (existingUser) {
      return res.status(400).json({ message: 'Wallet already registered. Please login.' });
    }

    const user = new User({ walletId });
    await user.save();

    const token = generateToken(user.walletId);

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        walletId: user.walletId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error registering user:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// 🔑 LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { walletId } = req.body;

    if (!walletId) {
      return res.status(400).json({ message: 'Wallet ID is required.' });
    }

    const user = await User.findOne({ walletId });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register.' });
    }

    // passwordless login using walletId

    const token = generateToken(user.walletId);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        walletId: user.walletId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// 👤 GET USER DETAILS (Protected)
exports.getUser = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized or invalid token.' });
    }

    const user = await User.findOne({ walletId: decoded.walletId });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Include basic balance and miningStatus snapshot
    res.status(200).json({
      walletId: user.walletId,
      createdAt: user.createdAt,
      totalToken: user.totalToken || 0,
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Mining endpoints ---
// Start a mining session
exports.startMining = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const { selectedHour } = req.body;
    const user = await User.findOne({ walletId: decoded.walletId });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // If there's an active mining session, prevent overlapping
    const active = await MiningSession.findOne({ walletId: user.walletId, status: 'mining' });
    if (active) {
      return res.status(400).json({ message: 'An active mining session already exists.' });
    }

    const session = new MiningSession({
      walletId: user.walletId,
      multiplier: 1,
      status: 'mining',
      miningStartTime: new Date(),
      currentMultiplierStartTime: new Date(),
      selectedHour: selectedHour || 1,
    });

    await session.save();

    // update user snapshot
    user.miningStatus = 'mining';
    user.multiplier = 1;
    await user.save();

    res.status(201).json({ message: 'Mining started.', session });
  } catch (err) {
    console.error('❌ startMining error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get mining status for current user (latest session or active)
exports.getMiningStatus = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const session = await MiningSession.findOne({ walletId: decoded.walletId }).sort({ createdDate: -1 });
    if (!session) return res.status(200).json({ message: 'No session', session: null });
    res.status(200).json({ session });
  } catch (err) {
    console.error('❌ getMiningStatus error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Upgrade multiplier stepwise (1->2->3... upto 6)
exports.upgradeMultiplier = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const { sessionId } = req.params;
    const session = await MiningSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.status !== 'mining') return res.status(400).json({ message: 'Can only upgrade during mining.' });

    if (session.multiplier >= 6) return res.status(400).json({ message: 'Already at max multiplier.' });

    // stepwise increment
    session.multiplier = session.multiplier + 1;
    session.currentMultiplierStartTime = new Date();
    session.lastUpdated = new Date();
    await session.save();

    // update user snapshot
    const user = await User.findOne({ walletId: session.walletId });
    if (user) {
      user.multiplier = session.multiplier;
      await user.save();
    }

    res.status(200).json({ message: 'Multiplier upgraded.', session });
  } catch (err) {
    console.error('❌ upgradeMultiplier error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Claim session: calculate final earned tokens and mark claimed
exports.claimSession = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const { sessionId } = req.params;
    const session = await MiningSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    // compute earned tokens based on elapsed time, base rate and multiplier
    const BASE_RATE = 0.01; // tokens per second
    const now = new Date();
    const start = session.miningStartTime || session.createdDate;
    const elapsedSec = Math.max(0, Math.floor((now - start) / 1000));
    const totalSecondsPlanned = (session.selectedHour || 1) * 3600;
    const effectiveSeconds = Math.min(elapsedSec, totalSecondsPlanned);

    const earned = effectiveSeconds * BASE_RATE * (session.multiplier || 1);

    session.totalEarned = earned;
    session.lastUpdated = new Date();
    await session.save();

    // credit user balance
    const user = await User.findOne({ walletId: session.walletId });
    if (user) {
      user.totalToken = (user.totalToken || 0) + earned;
      await user.save();
    }

    session.status = 'claimed';
    await session.save();

    res.status(200).json({ message: 'Claimed', earned, session });
  } catch (err) {
    console.error('❌ claimSession error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Leaderboard: users sorted by totalToken descending
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({}).sort({ totalToken: -1 }).select({ walletId: 1, totalToken: 1, _id: 0 });
    res.status(200).json({ leaderboard: users });
  } catch (err) {
    console.error('❌ getLeaderboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};


*/





const User = require('../model/User.model');
const MiningSession = require('../model/MiningSession.model');
const jwt = require('jsonwebtoken');

// Helper: Generate JWT
const generateToken = (walletId) => {
  return jwt.sign({ walletId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Helper: Verify JWT (used inside controller)
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// 📝 REGISTER (SIGNUP)
exports.registerUser = async (req, res) => {
  try {
    const { walletId } = req.body;

    if (!walletId) {
      return res.status(400).json({ message: 'Wallet ID is required.' });
    }

    const existingUser = await User.findOne({ walletId });
    if (existingUser) {
      return res.status(400).json({ message: 'Wallet already registered. Please login.' });
    }

    const user = new User({ walletId });
    await user.save();

    const token = generateToken(user.walletId);

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        walletId: user.walletId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error registering user:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// 🔑 LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { walletId } = req.body;

    if (!walletId) {
      return res.status(400).json({ message: 'Wallet ID is required.' });
    }

    const user = await User.findOne({ walletId });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register.' });
    }

    // passwordless login using walletId

    const token = generateToken(user.walletId);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        walletId: user.walletId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// 👤 GET USER DETAILS (Protected)
exports.getUser = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized or invalid token.' });
    }

    const user = await User.findOne({ walletId: decoded.walletId });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Include basic balance and miningStatus snapshot
    res.status(200).json({
      walletId: user.walletId,
      createdAt: user.createdAt,
      totalToken: user.totalToken || 0,
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Mining endpoints ---
// Start a mining session
exports.startMining = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const { selectedHour } = req.body;
    const user = await User.findOne({ walletId: decoded.walletId });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // If there's an active mining session, prevent overlapping
    const active = await MiningSession.findOne({ walletId: user.walletId, status: 'mining' });
    if (active) {
      return res.status(400).json({ message: 'An active mining session already exists.' });
    }

    const session = new MiningSession({
      walletId: user.walletId,
      multiplier: 1,
      status: 'mining',
      miningStartTime: new Date(),
      currentMultiplierStartTime: new Date(),
      selectedHour: selectedHour || 1,
    });

    await session.save();

    // update user snapshot
    user.miningStatus = 'mining';
    user.multiplier = 1;
    await user.save();

    res.status(201).json({ message: 'Mining started.', session });
  } catch (err) {
    console.error('❌ startMining error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get mining status for current user (latest session or active)
exports.getMiningStatus = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const session = await MiningSession.findOne({ walletId: decoded.walletId }).sort({ createdDate: -1 });
    if (!session) return res.status(200).json({ message: 'No session', session: null });
    res.status(200).json({ session });
  } catch (err) {
    console.error('❌ getMiningStatus error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Upgrade multiplier stepwise (1->2->3... upto 6)
exports.upgradeMultiplier = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const { sessionId } = req.params;
    const session = await MiningSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.status !== 'mining') return res.status(400).json({ message: 'Can only upgrade during mining.' });

    if (session.multiplier >= 6) return res.status(400).json({ message: 'Already at max multiplier.' });

    // stepwise increment
    session.multiplier = session.multiplier + 1;
    session.currentMultiplierStartTime = new Date();
    session.lastUpdated = new Date();
    await session.save();

    // update user snapshot
    const user = await User.findOne({ walletId: session.walletId });
    if (user) {
      user.multiplier = session.multiplier;
      await user.save();
    }

    res.status(200).json({ message: 'Multiplier upgraded.', session });
  } catch (err) {
    console.error('❌ upgradeMultiplier error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Claim session: calculate final earned tokens and mark claimed
exports.claimSession = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const { sessionId } = req.params;
    const session = await MiningSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    // compute earned tokens based on elapsed time, base rate and multiplier
    const BASE_RATE = 0.01; // tokens per second
    const now = new Date();
    const start = session.miningStartTime || session.createdDate;
    const elapsedSec = Math.max(0, Math.floor((now - start) / 1000));
    const totalSecondsPlanned = (session.selectedHour || 1) * 3600;
    const effectiveSeconds = Math.min(elapsedSec, totalSecondsPlanned);

    const earned = effectiveSeconds * BASE_RATE * (session.multiplier || 1);

    session.totalEarned = earned;
    session.lastUpdated = new Date();
    await session.save();

    // credit user balance
    const user = await User.findOne({ walletId: session.walletId });
    if (user) {
      user.totalToken = (user.totalToken || 0) + earned;
      await user.save();
    }

    session.status = 'claimed';
    await session.save();

    res.status(200).json({ message: 'Claimed', earned, session });
  } catch (err) {
    console.error('❌ claimSession error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Leaderboard: users sorted by totalToken descending
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({}).sort({ totalToken: -1 }).select({ walletId: 1, totalToken: 1, _id: 0 });
    res.status(200).json({ leaderboard: users });
  } catch (err) {
    console.error('❌ getLeaderboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Referral endpoints ---
const Referral = require('../model/Referral.model');

// Check if user has used a referral code
exports.checkReferralStatus = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const existingReferral = await Referral.findOne({ referredWallet: decoded.walletId });
    
    res.status(200).json({ 
      hasUsedReferral: !!existingReferral,
    });
  } catch (err) {
    console.error('❌ checkReferralStatus error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Submit referral code
exports.submitReferralCode = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const { referralCode } = req.body;
    
    if (!referralCode) {
      return res.status(400).json({ message: 'Referral code is required.' });
    }

    // Get current user
    const currentUser = await User.findOne({ walletId: decoded.walletId });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user already used a referral code
    const existingReferral = await Referral.findOne({ referredWallet: currentUser.walletId });
    if (existingReferral) {
      return res.status(400).json({ message: 'You have already used a referral code.' });
    }

    // Check if referral code (walletId) exists
    const referrer = await User.findOne({ walletId: referralCode });
    if (!referrer) {
      return res.status(400).json({ message: 'Invalid wallet ID.' });
    }

    // Prevent self-referral
    if (referrer.walletId === currentUser.walletId) {
      return res.status(400).json({ message: 'You cannot use your own referral code.' });
    }

    // Create referral record
    const referral = new Referral({
      referrerWallet: referrer.walletId,
      referredWallet: currentUser.walletId,
      rewardTokens: 200,
    });
    await referral.save();

    // Give 200 tokens to referrer
    referrer.totalToken = (referrer.totalToken || 0) + 200;
    referrer.totalTokensEarned = (referrer.totalTokensEarned || 0) + 200;
    await referrer.save();

    res.status(200).json({ 
      message: 'Referral code applied successfully!',
      referrer: {
        walletId: referrer.walletId,
        tokensEarned: 200,
      }
    });
  } catch (err) {
    console.error('❌ submitReferralCode error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already used a referral code.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};


// UPDATED Claim session with 10% referral commission
exports.claimSessionWithCommission = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const { sessionId } = req.params;
    const session = await MiningSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    // compute earned tokens based on elapsed time, base rate and multiplier
    const BASE_RATE = 0.01; // tokens per second
    const now = new Date();
    const start = session.miningStartTime || session.createdDate;
    const elapsedSec = Math.max(0, Math.floor((now - start) / 1000));
    const totalSecondsPlanned = (session.selectedHour || 1) * 3600;
    const effectiveSeconds = Math.min(elapsedSec, totalSecondsPlanned);

    const earned = effectiveSeconds * BASE_RATE * (session.multiplier || 1);

    session.totalEarned = earned;
    session.lastUpdated = new Date();
    await session.save();

    // Check if this user was referred and calculate commission
    const referralRecord = await Referral.findOne({ referredWallet: session.walletId });
    let commission = 0;
    let userEarned = earned;

    if (referralRecord) {
      commission = earned * 0.10; // 10% commission
      userEarned = earned - commission; // Deduct 10% from user's earnings
      
      // Give commission to referrer
      const referrer = await User.findOne({ walletId: referralRecord.referrerWallet });
      if (referrer) {
        referrer.totalToken = (referrer.totalToken || 0) + commission;
        referrer.totalTokensEarned = (referrer.totalTokensEarned || 0) + commission;
        await referrer.save();
        console.log(`✅ Referral commission: ${commission} tokens deducted from ${session.walletId} and given to ${referrer.walletId}`);
      }
    }

    // Credit user balance (with commission deducted if applicable)
    const user = await User.findOne({ walletId: session.walletId });
    if (user) {
      user.totalToken = (user.totalToken || 0) + userEarned;
      user.totalTokensEarned = (user.totalTokensEarned || 0) + userEarned;
      await user.save();
    }

    session.status = 'claimed';
    await session.save();

    res.status(200).json({ 
      message: 'Claimed', 
      earned: userEarned, 
      totalEarned: earned,
      commission: commission,
      session, 
      user 
    });
  } catch (err) {
    console.error('❌ claimSession error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};


// --- Watch Ad Reward ---
const AdReward = require('../model/AdReward.model');

exports.watchAdReward = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized.' });

    const { walletId } = req.body;

    // Validate wallet ID matches logged in user
    if (walletId !== decoded.walletId) {
      return res.status(403).json({ message: 'Wallet ID mismatch.' });
    }

    // Generate random reward between 5 and 50
    const randomRewardEarned = Math.floor(Math.random() * (50 - 5 + 1)) + 5;

    // Save ad reward record
    const adReward = new AdReward({
      walletId: walletId,
      rewardAmount: randomRewardEarned,
    });
    await adReward.save();

    // Update user's total tokens
    const user = await User.findOne({ walletId: walletId });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.totalToken = (user.totalToken || 0) + randomRewardEarned;
    user.totalTokensEarned = (user.totalTokensEarned || 0) + randomRewardEarned;
    await user.save();

    res.status(200).json({
      message: 'Ad reward claimed successfully!',
      randomRewardEarned: randomRewardEarned,
      newTotalToken: user.totalToken,
    });
  } catch (err) {
    console.error('❌ watchAdReward error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
