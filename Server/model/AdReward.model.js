const mongoose = require('mongoose');

const adRewardSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    trim: true,
  },
  rewardAmount: {
    type: Number,
    required: true,
    min: 5,
    max: 50,
  },
  watchedAt: {
    type: Date,
    default: Date.now,
  },
});

const AdReward = mongoose.model('AdReward', adRewardSchema);

module.exports = AdReward;
