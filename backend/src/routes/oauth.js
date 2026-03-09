const express = require('express');
const passport = require('passport');
const { initPassport, passport: passportInstance } = require('../services/passport');

const router = express.Router();

initPassport();

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ error: 'Google OAuth not configured' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }), (req, res) => {
  const { accessToken, refreshToken } = req.user;
  res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
});

router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(501).json({ error: 'GitHub OAuth not configured' });
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login?error=oauth_failed' }), (req, res) => {
  const { accessToken, refreshToken } = req.user;
  res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
});

module.exports = router;
