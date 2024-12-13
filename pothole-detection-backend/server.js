const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const session = require('express-session');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const potholeRoutes = require('./routes/potholeRoutes');
const authRoutes = require('./routes/authRoutes');
const MongoStore = require('connect-mongo');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Configure Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // Use your MongoDB connection string
      ttl: 14 * 24 * 60 * 60, // = 14 days. Default
    }),
})
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Configure Twitter Strategy
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: 'http://localhost:6066/api/auth/twitter/callback',
    },
    (token, tokenSecret, profile, done) => {
      try {
        console.log('Twitter Strategy invoked');
        console.log('Profile:', profile);
        
        const user = {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          token,
          tokenSecret,
        };
        return done(null, user);
      } catch (error) {
        console.error('Twitter Strategy Error:', error);
        return done(error, null);
      }
    }
  )
);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/potholes', potholeRoutes);
app.use('/api/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 6066;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
