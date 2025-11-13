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
    const { walletId, /*password*/ } = req.body;

    if (!walletId) {
      return res.status(400).json({ message: 'Wallet ID and password are required.' });
    }

    const existingUser = await User.findOne({ walletId });
    if (existingUser) {
      return res.status(400).json({ message: 'Wallet already registered. Please login.' });
    }

    const user = new User({ walletId, /*password*/ });
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
    const { walletId, /*password*/ } = req.body;

    if (!walletId) {
      return res.status(400).json({ message: 'Wallet ID and password are required.' });
    }

    const user = await User.findOne({ walletId });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register.' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

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
      balance: user.balance || 0,
      multiplier: user.multiplier || 1,
      miningStatus: user.miningStatus || 'idle',
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
    console.log(`✅ New mining session created: ID=${session._id}, Duration=${selectedHour}hrs`);

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

    // compute earned tokens based on full planned duration
    // When user claims, they should get rewards for the full duration they selected
    const BASE_RATE = 0.01; // tokens per second
    const totalSecondsPlanned = (session.selectedHour || 1) * 3600;
    
    // Calculate earned for the full planned duration
    const earned = totalSecondsPlanned * BASE_RATE * (session.multiplier || 1);
    
    console.log(`✅ Claiming session: ${session.selectedHour}hrs, multiplier: ${session.multiplier}x, earned: ${earned.toFixed(2)} CMT`);

    // Create a NEW document for the claimed session
    const claimedSession = new MiningSession({
      walletId: session.walletId,
      multiplier: session.multiplier,
      status: 'claimed',
      miningStartTime: session.miningStartTime,
      currentMultiplierStartTime: session.currentMultiplierStartTime,
      selectedHour: session.selectedHour,
      totalEarned: earned,
      lastUpdated: new Date(),
    });
    
    await claimedSession.save();
    console.log(`✅ New claimed session created: ID=${claimedSession._id}, Earned=${earned.toFixed(2)} CMT`);
    console.log(`📝 Mining document kept: ID=${sessionId} (status: mining, totalEarned: 0)`);

    // credit user balance and reset mining status to idle
    const user = await User.findOne({ walletId: session.walletId });
    if (user) {
      user.balance = (user.balance || 0) + earned;
      user.miningStatus = 'idle'; // Reset to idle so user can start new session
      user.multiplier = 1; // Reset multiplier for next session
      await user.save();
    }

    res.status(200).json({ 
      message: 'Claimed', 
      earned, 
      session: claimedSession, // Return the new claimed session
      user: {
        balance: user ? user.balance : 0,
        walletId: user ? user.walletId : session.walletId
      }
    });
  } catch (err) {
    console.error('❌ claimSession error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
