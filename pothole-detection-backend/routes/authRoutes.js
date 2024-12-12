const express = require('express');
const passport = require('passport');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Start Twitter Authentication
router.get('/twitter', passport.authenticate('twitter'));

// Handle Twitter Callback
router.get('/twitter/callback',
  (req, res, next) => {
    console.log('Twitter callback hit');
    console.log('Query Params:', req.query);
    next();
  },
  passport.authenticate('twitter', { 
    failureRedirect: '/login',
    session: true
  }),
  (req, res) => {
    if (!req.user) {
      console.log('No user object found');
      return res.status(401).json({ message: 'Authentication failed' });
    }

    console.log('User authenticated:', req.user);
    res.json({
      success: true,
      message: 'Twitter authentication successful',
      user: req.user
    });
  }
);

// Check Authentication Status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      isAuthenticated: true,
      user: req.user
    });
  } else {
    res.json({
      isAuthenticated: false
    });
  }
});

// Logout Route
router.get('/logout', protect, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
