const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

async function fetchWithTimeout(url, options, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export function detectMetaMask() {
  return typeof window !== 'undefined' && !!window.ethereum;
}

export async function requestAccount() {
  if (!window.ethereum) {
    throw new Error('MetaMask not detected');
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

export function buildSiweMessage({ address, nonce, domain, uri, chainId, issuedAt }) {
  return `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to keyPear

URI: ${uri}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

export async function signMessage(message, address) {
  if (!window.ethereum) {
    throw new Error('MetaMask not detected');
  }
  return window.ethereum.request({
    method: 'personal_sign',
    params: [message, address]
  });
}

export async function getChainId() {
  if (!window.ethereum) {
    throw new Error('MetaMask not detected');
  }
  const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainIdHex, 16);
}

export async function loginWithWallet(address, signature, message, name) {
  const response = await fetchWithTimeout(`${API_URL}/api/auth/web3/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, message, name })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Authentication failed');
  }

  return response.json();
}

export async function getNonce(address) {
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/auth/web3/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get nonce');
    }

    return response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out. Cannot reach backend at ${API_URL}.`);
    }
    throw err;
  }
}
