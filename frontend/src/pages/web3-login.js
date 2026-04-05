import { auth } from '../utils/auth.js';
import { detectMetaMask, requestAccount, buildSiweMessage, signMessage, getChainId, getNonce, loginWithWallet } from '../lib/web3.js';

export function web3LoginPage(props = {}) {
  return `
    <div class="min-h-screen flex flex-col bg-[#f7f9ff]">
      <header class="fixed top-0 left-0 right-0 z-40 bg-white/60 backdrop-blur-xl shadow-sm px-6 py-3 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-emerald-600 text-2xl" style="font-variation-settings: 'FILL' 1;">shield</span>
          <span class="text-xl font-black text-black tracking-tighter">keyPear</span>
        </div>
        <div class="flex items-center gap-4">
          <a class="text-sm font-medium text-emerald-700 hover:opacity-80 transition-all" href="#">Support</a>
          <div class="h-4 w-[1px] bg-slate-200"></div>
          <span class="material-symbols-outlined text-slate-500 text-xl">language</span>
        </div>
      </header>

      <main class="flex-grow flex items-center justify-center px-4 pt-20 pb-12">
        <div id="auth-layout" class="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div class="hidden lg:flex lg:col-span-7 flex-col gap-8">
            <div class="space-y-4">
              <h1 class="text-[32px] font-extrabold tracking-tighter text-slate-900 leading-tight">
                Securing your <br/>
                <span class="text-emerald-600">digital fortress.</span>
              </h1>
              <p class="text-lg text-slate-500 max-w-md leading-relaxed">
                Connect your wallet and sign a message to enter. No passwords, no emails — just your cryptographic identity.
              </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-6 rounded-xl bg-slate-100 border border-slate-200">
                <span class="material-symbols-outlined text-emerald-600 text-2xl mb-3 block" style="font-variation-settings: 'FILL' 1;">account_balance_wallet</span>
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Wallet Identity</h3>
                <p class="text-xs text-slate-500">Your wallet address is your identity.</p>
              </div>
              <div class="p-6 rounded-xl bg-slate-100 border border-slate-200">
                <span class="material-symbols-outlined text-emerald-600 text-2xl mb-3 block" style="font-variation-settings: 'FILL' 1;">security</span>
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Cryptographic Proof</h3>
                <p class="text-xs text-slate-500">SIWE signatures replace passwords.</p>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5">
            <div class="bg-white p-8 lg:p-10 rounded-xl shadow-[0_20px_40px_rgba(23,28,34,0.06)] border border-slate-200">
              <div class="mb-8">
                <h2 class="text-3xl font-extrabold tracking-tighter text-slate-900 mb-2">Connect Wallet</h2>
                <p class="text-slate-500 text-sm">Sign in with your MetaMask wallet to continue.</p>
              </div>

              <div id="web3-error" class="hidden mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"></div>
              <div id="web3-success" class="hidden mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"></div>

              <div id="web3-status" class="hidden mb-6 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                <span class="material-symbols-outlined text-emerald-600 animate-spin">sync</span>
                <div class="space-y-1">
                  <p class="text-xs font-bold text-emerald-900" id="status-text">Connecting...</p>
                  <p class="text-[11px] text-slate-500 leading-relaxed" id="status-detail">Please wait</p>
                </div>
              </div>

              <div id="display-name-section" class="hidden mb-6">
                <label for="display-name" class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Display Name (Optional)</label>
                <div class="relative group mt-2">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-emerald-600 transition-colors">person</span>
                  <input
                    class="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-emerald-600/20 text-sm placeholder:text-slate-400 outline-none transition-all"
                    placeholder="Enter display name"
                    type="text"
                    id="display-name"
                    name="display-name"
                    maxlength="100"
                  >
                </div>
              </div>

              <div class="pt-4 flex flex-col gap-4">
                <button id="connect-wallet-btn" class="w-full bg-[#006b22] text-white font-bold py-4 rounded-lg shadow-md hover:opacity-90 active:scale-[0.99] transition-all flex justify-center items-center gap-2" type="button">
                  <span class="material-symbols-outlined text-lg">account_balance_wallet</span>
                  Connect MetaMask
                </button>
              </div>
            </div>

            <div id="metamask-fallback" class="hidden mt-8 bg-white p-6 rounded-xl shadow-[0_20px_40px_rgba(23,28,34,0.06)] border border-slate-200">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-amber-500 text-2xl" style="font-variation-settings: 'FILL' 1;">warning</span>
                <div>
                  <p class="text-sm font-bold text-slate-900 mb-1">MetaMask Not Detected</p>
                  <p class="text-xs text-slate-500 mb-3">You need MetaMask installed to sign in.</p>
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener" class="text-sm font-bold text-emerald-700 hover:underline">Install MetaMask →</a>
                </div>
              </div>
            </div>

            <div class="mt-8 flex justify-center gap-6">
              <div class="flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                <span class="material-symbols-outlined text-sm">gpp_good</span>
                <span class="text-[10px] font-bold uppercase tracking-tighter">SIWE</span>
              </div>
              <div class="flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                <span class="material-symbols-outlined text-sm">encrypted</span>
                <span class="text-[10px] font-bold uppercase tracking-tighter">EIP-4361</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer class="mt-auto py-6 border-t border-slate-100">
        <div class="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-[11px] text-slate-500 font-medium">© 2026 keyPear. All rights reserved.</p>
          <nav class="flex gap-6">
            <a class="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-widest" href="#">Privacy</a>
            <a class="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-widest" href="#">Status</a>
            <a class="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-widest" href="#">Legal</a>
          </nav>
        </div>
      </footer>

      <div class="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      <div class="fixed bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-emerald-800/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
    </div>
  `;
}

export function initWeb3LoginPage() {
  const connectBtn = document.getElementById('connect-wallet-btn');
  const errorDiv = document.getElementById('web3-error');
  const successDiv = document.getElementById('web3-success');
  const statusDiv = document.getElementById('web3-status');
  const statusText = document.getElementById('status-text');
  const statusDetail = document.getElementById('status-detail');
  const displayNameSection = document.getElementById('display-name-section');
  const metamaskFallback = document.getElementById('metamask-fallback');

  if (!connectBtn) return;

  if (!detectMetaMask()) {
    metamaskFallback.classList.remove('hidden');
  }

  const showError = (msg) => {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
    successDiv.classList.add('hidden');
  };

  const showStatus = (text, detail) => {
    statusText.textContent = text;
    statusDetail.textContent = detail;
    statusDiv.classList.remove('hidden');
    const spinner = statusDiv.querySelector('.material-symbols-outlined');
    spinner.classList.add('animate-spin');
  };

  const hideStatus = () => {
    statusDiv.classList.add('hidden');
  };

  const showSuccess = (msg) => {
    successDiv.textContent = msg;
    successDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
  };

  connectBtn.addEventListener('click', async () => {
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Connecting...';
    errorDiv.classList.add('hidden');

    try {
      showStatus('Connecting to MetaMask', 'Requesting account access...');
      const address = await requestAccount();

      showStatus('Getting challenge', 'Requesting nonce from server...');
      const { nonce } = await getNonce(address);

      showStatus('Signing message', 'Please approve the signature in MetaMask...');
      const chainId = await getChainId();
      const message = buildSiweMessage({
        address,
        nonce,
        domain: window.location.host,
        uri: window.location.origin,
        chainId,
        issuedAt: new Date().toISOString()
      });

      const signature = await signMessage(message, address);

      showStatus('Authenticating', 'Verifying signature...');
      const displayName = document.getElementById('display-name')?.value?.trim() || null;
      const { user, accessToken, refreshToken } = await loginWithWallet(address, signature, message, displayName);

      localStorage.setItem('keypear_token', accessToken);
      localStorage.setItem('keypear_refresh_token', refreshToken);
      localStorage.setItem('keypear_user', JSON.stringify(user));

      hideStatus();
      showSuccess('Connected! Redirecting...');

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err) {
      hideStatus();
      connectBtn.disabled = false;
      connectBtn.innerHTML = '<span class="material-symbols-outlined text-lg">account_balance_wallet</span> Connect MetaMask';

      if (err.code === 4001) {
        showError('Signature request rejected. Please try again.');
      } else {
        showError(err.message || 'Failed to connect wallet');
      }
    }
  });
}
