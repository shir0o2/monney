const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: false },
  password: { type: String, required: true },
  deviceId: { type: String, required: true } // Untuk membedakan perangkat
});

module.exports = mongoose.model('User', userSchema);