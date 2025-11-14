/*const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // optional: last known multiplier and status snapshot (not required)
  multiplier: {
    type: Number,
    default: 1,
    min: 1,
    max: 6,
  },
  miningStatus: {
    type: String,
    enum: ['idle', 'mining', 'ready_to_claim', 'claimed'],
    default: 'idle',
  },
});

module.exports = mongoose.model('UserMinning', UserSchema);*/

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  totalToken: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalTokensEarned: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // optional: last known multiplier and status snapshot (not required)
});

module.exports = mongoose.model('UserMinning', UserSchema);
