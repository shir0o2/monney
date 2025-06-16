const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, deviceId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ username, password: hashedPassword, deviceId });
    await user.save();
    
    res.status(201).json({ message: "User created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, deviceId } = req.body;
    const user = await User.findOne({ username, deviceId });
    
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    
    res.json({ 
      message: "Login successful",
      user: { username: user.username }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;