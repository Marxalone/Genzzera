const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Passport Google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName || 'Google User',
        email,
        avatar: profile.photos && profile.photos[0] && profile.photos[0].value
      });
    } else if (!user.googleId) {
      user.googleId = profile.id;
      if (!user.avatar && profile.photos && profile.photos[0]) {
        user.avatar = profile.photos[0].value;
      }
      await user.save();
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' });
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already used' });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });
    const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login (local)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ message: 'Wrong credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Wrong credentials' });
    const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to validate token and get user
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: FRONTEND_URL + '/?err=oauth' }),
  (req, res) => {
    // On success, generate JWT and redirect back to frontend with token (in query or cookie)
    const token = jwt.sign({ sub: req.user._id }, process.env.JWT_SECRET, { expiresIn:'7d' });
    // For safety, we redirect to the frontend and attach token as URL fragment
    res.redirect(`${FRONTEND_URL}/?token=${token}`);
  });

module.exports = router;