import crypto from 'crypto';

const NONCE_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

class NonceStore {
  constructor() {
    this.store = new Map();
    this.interval = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    this.interval.unref();
  }

  generate(address) {
    const nonce = crypto.randomBytes(16).toString('hex');
    this.store.set(address.toLowerCase(), {
      address: address.toLowerCase(),
      nonce,
      expiresAt: Date.now() + NONCE_TTL_MS,
    });
    return { nonce };
  }

  consume(address, nonce) {
    const key = address.toLowerCase();
    const record = this.store.get(key);

    if (!record) {
      throw new Error('NONCE_EXPIRED');
    }

    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      throw new Error('NONCE_EXPIRED');
    }

    if (record.nonce !== nonce) {
      throw new Error('NONCE_MISMATCH');
    }

    this.store.delete(key);
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.interval);
    this.store.clear();
  }
}

export const nonceStore = new NonceStore();
