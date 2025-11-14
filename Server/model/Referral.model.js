const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerWallet: {
    type: String,
    required: true,
    trim: true,
  },
  referredWallet: {
    type: String,
    required: true,
    trim: true,
  },
  rewardTokens: {
    type: Number,
    default: 200,
  },
  claimedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only use a referral code once
referralSchema.index({ referredWallet: 1 }, { unique: true });

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
