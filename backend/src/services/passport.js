const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: GitHubStrategy } = require('passport-github2');
const jwt = require('jsonwebtoken');
const { User, Session, ActivityLog } = require('../models');

const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const getAccessToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

const getRefreshToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
);

const oauthCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    const provider = profile.provider;
    const oauthId = profile.id;
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.username;

    let user = await User.findByOAuth(provider, oauthId);

    if (!user && email) {
      user = await User.findByEmail(email);
      if (user) {
        await User.update(user.id, { oauthProvider: provider, oauthId });
      }
    }

    if (!user) {
      user = await User.create({
        email: email || `${provider}_${oauthId}@oauth.local`,
        passwordHash: null,
        oauthProvider: provider,
        oauthId,
        name,
      });
    }

    const userAccessToken = getAccessToken(user.id);
    const userRefreshToken = getRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({ userId: user.id, refreshToken: userRefreshToken, expiresAt });

    await ActivityLog.create({ userId: user.id, action: 'oauth_login', metadata: { provider } });

    return done(null, { user, accessToken: userAccessToken, refreshToken: userRefreshToken });
  } catch (error) {
    return done(error);
  }
};

const initPassport = () => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/oauth/google/callback',
        },
        oauthCallback
      )
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: '/api/auth/oauth/github/callback',
        },
        oauthCallback
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
};

module.exports = { initPassport, passport };
