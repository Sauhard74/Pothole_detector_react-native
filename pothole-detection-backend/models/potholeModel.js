const mongoose = require('mongoose');

const potholeSchema = new mongoose.Schema({
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  image: { type: String, required: true }, // Store image URL or path
  status: { type: String, default: 'reported' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tweeted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pothole', potholeSchema);
