import express from 'express';
import jwt from 'jsonwebtoken';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import { nonceStore } from '../../services/nonceStore.js';
import { User, Session, ActivityLog } from '../../models/index.js';

const router = express.Router();

const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const getAccessToken = (userId) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not configured');
  return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN });
};

const getRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign({ userId }, secret, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

const validateAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'MISSING_ADDRESS' };
  }
  if (!ADDRESS_REGEX.test(address)) {
    return { valid: false, error: 'INVALID_ADDRESS' };
  }
  return { valid: true };
};

router.post('/nonce', async (req, res) => {
  try {
    const { address } = req.body;
    const validation = validateAddress(address);
    if (!validation.valid) {
      const msg = validation.error === 'MISSING_ADDRESS'
        ? 'Address is required'
        : 'Invalid Ethereum address';
      return res.status(400).json({ error: msg, code: validation.error });
    }

    const { nonce } = nonceStore.generate(address);
    res.json({ nonce });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({ error: 'Failed to generate nonce', code: 'SERVER_ERROR' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { address, signature, message, name } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({ error: 'Address, signature, and message are required', code: 'MISSING_ADDRESS' });
    }

    const validation = validateAddress(address);
    if (!validation.valid) {
      const msg = validation.error === 'MISSING_ADDRESS'
        ? 'Address is required'
        : 'Invalid Ethereum address';
      return res.status(400).json({ error: msg, code: validation.error });
    }

    const lowerAddress = address.toLowerCase();
    const checksumAddress = ethers.getAddress(lowerAddress);

    // Consume nonce (validates existence, expiry, and match)
    try {
      nonceStore.consume(lowerAddress, message.match(/Nonce:\s*(\S+)/)?.[1] || '');
    } catch (err) {
      if (err.message === 'NONCE_EXPIRED') {
        return res.status(401).json({ error: 'Nonce has expired. Please try again.', code: 'NONCE_EXPIRED' });
      }
      if (err.message === 'NONCE_MISMATCH') {
        return res.status(401).json({ error: 'Nonce does not match', code: 'NONCE_MISMATCH' });
      }
      throw err;
    }

    // Fix address casing in message for SIWE parsing (EIP-55 requirement)
    const normalizedMessage = message.replace(
      new RegExp(`0x[a-fA-F0-9]{40}`),
      checksumAddress
    );

    // Parse and validate SIWE message
    let siweMessage;
    try {
      siweMessage = new SiweMessage(normalizedMessage);
    } catch (err) {
      console.error('SIWE parse error:', err.message);
      console.error('Received message:', JSON.stringify(message));
      console.error('Normalized message:', JSON.stringify(normalizedMessage));
      return res.status(400).json({ error: 'Invalid SIWE message: ' + err.message, code: 'INVALID_MESSAGE' });
    }

    // Validate domain
    const frontendUrl = new URL(process.env.FRONTEND_URL);
    const expectedDomain = frontendUrl.host;
    if (siweMessage.domain !== expectedDomain) {
      return res.status(401).json({ error: 'Domain does not match', code: 'DOMAIN_MISMATCH' });
    }

    // Validate chain ID
    const expectedChainId = parseInt(process.env.SIWE_CHAIN_ID || '1', 10);
    if (siweMessage.chainId !== expectedChainId) {
      return res.status(401).json({ error: 'Chain ID does not match', code: 'CHAIN_MISMATCH' });
    }

    // Verify signature recovers to claimed address
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== lowerAddress) {
        return res.status(400).json({ error: 'Signature verification failed', code: 'INVALID_SIGNATURE' });
      }
    } catch (err) {
      return res.status(400).json({ error: 'Signature verification failed', code: 'INVALID_SIGNATURE' });
    }

    // Find or create user
    let user = await User.findByWallet(lowerAddress);
    if (!user) {
      user = await User.createWallet({ walletAddress: lowerAddress, name: name || null });
    }

    // Single session policy - delete existing sessions
    await Session.deleteByUserId(user.id);

    // Create new session
    const accessToken = getAccessToken(user.id);
    const refreshToken = getRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({ userId: user.id, refreshToken, expiresAt });
    await ActivityLog.create({ userId: user.id, action: 'login', metadata: { walletAddress: lowerAddress } });

    res.json({
      user: { id: user.id, name: user.name, walletAddress: user.wallet_address },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Web3 verify error:', error);
    res.status(500).json({ error: 'Authentication failed', code: 'SERVER_ERROR' });
  }
});

export default router;
