import { useEffect, useRef, useState, type FormEvent } from 'react'
import Layout from './components/Layout'
import type { LangCode } from './types'
import i18nData from './i18n'

const languageKey = "iptables_lang";
const storedLang = localStorage.getItem(languageKey);
const browserLang: LangCode = (() => {
  const l = ((navigator.languages && navigator.languages[0]) || navigator.language || "en").toLowerCase();
  if (l.startsWith("zh")) return "zh";
  if (l.startsWith("ja")) return "ja";
  return "en";
})();
const langOrder: LangCode[] = ['zh', 'en', 'ja'];
const currentLang: LangCode = langOrder.includes(storedLang as LangCode) ? storedLang as LangCode : browserLang;

Object.assign(window, {
  currentLang,
  i18n: i18nData,
  langOrder,
  langNames: { zh: '中文', en: 'English', ja: '日本語' },
  currentProtocol: 'ipv4',
  currentPlatform: 'linux',
});

const SCRIPTS = [
  '/sneat/assets/vendor/libs/jquery/jquery.js',
  '/sneat/assets/vendor/libs/popper/popper.js',
  '/sneat/assets/vendor/js/bootstrap.js',
  '/sneat/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.js',
  '/sneat/assets/vendor/js/helpers.js',
  '/sneat/assets/js/config.js',
  '/sneat/assets/vendor/js/menu.js',
  '/sneat/libs/xterm/xterm.min.js',
  '/sneat/libs/xterm-addon-fit/xterm-addon-fit.min.js',
  '/app.js',
];

const GLOBAL_SCRIPTS = new Set([
  '/sneat/assets/vendor/libs/jquery/jquery.js',
  '/sneat/assets/vendor/libs/popper/popper.js',
  '/sneat/assets/vendor/js/bootstrap.js',
  '/sneat/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.js',
  '/sneat/assets/vendor/js/helpers.js',
  '/sneat/assets/js/config.js',
  '/sneat/assets/vendor/js/menu.js',
  '/sneat/libs/xterm/xterm.min.js',
  '/sneat/libs/xterm-addon-fit/xterm-addon-fit.min.js',
]);

const TAB_STORAGE_KEY = 'fwm_tabs'
const FORCE_DEFAULT_TAB_KEY = 'kyklos_force_default_tab'

type AuthProfile = {
  username: string
  display_name?: string | null
  role_codes?: string[]
  source?: string
}

function LoginView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = new URLSearchParams()
      body.set('username', username)
      body.set('password', password)
      const res = await fetch('/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      if (!res.ok) {
        let msg = '帳號或密碼錯誤'
        try {
          const data = await res.json()
          msg = data?.msg || msg
        } catch { /* ignore */ }
        setError(msg)
        return
      }
      localStorage.removeItem(TAB_STORAGE_KEY)
      sessionStorage.setItem(FORCE_DEFAULT_TAB_KEY, '1')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary px-3">
      <div className="card shadow-sm" style={{ width: 'min(420px, 100%)' }}>
        <div className="card-body p-4">
          <div className="mb-4">
            <h4 className="mb-1 fw-bold">Kyklos 登入</h4>
            <p className="text-muted mb-0">請輸入使用者帳號與密碼。</p>
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">使用者名稱</label>
              <input className="form-control" value={username} onChange={(event) => setUsername(event.target.value)} autoFocus />
            </div>
            <div className="mb-4">
              <label className="form-label">密碼</label>
              <input className="form-control" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading || !username || !password}>
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function isWhitelistOnlyUser(authProfile?: AuthProfile | null): boolean {
  const roles = authProfile?.role_codes || []
  return roles.includes('security_whitelist') && !roles.includes('admin')
}

function loadScripts(urls: string[]): Promise<void> {
  return urls.reduce((p, src) => p.then(() => new Promise<void>((resolve) => {
    if (document.querySelector(`script[src="${src}"]`) || document.querySelector(`script[data-src="${src}"]`)) { resolve(); return; }
    if (GLOBAL_SCRIPTS.has(src)) {
      fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.text();
        })
        .then((code) => {
          const marker = document.createElement('script');
          marker.type = 'application/x-kyklos-loaded';
          marker.dataset.src = src;
          document.body.appendChild(marker);
          Function('define', `${code}\n//# sourceURL=${src}`)(undefined);
          console.log('[boot] loaded:', src.split('/').pop());
          resolve();
        })
        .catch((err) => {
          console.warn('[boot] fail (non-fatal):', src, err);
          resolve();
        });
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { console.log('[boot] loaded:', src.split('/').pop()); resolve(); };
    s.onerror = () => { console.warn('[boot] fail (non-fatal):', src); resolve(); };
    document.body.appendChild(s);
  })), Promise.resolve());
}

function bootMenu() {
  const H = window.Helpers;
  const MC = window.Menu;
  if (!H || !MC) { console.warn('[boot] Helpers/Menu missing'); return; }

  document.querySelectorAll('#layout-menu').forEach((el) => {
    try {
      const m = new MC(el, { orientation: 'vertical', closeChildren: false });
      H.mainMenu = m;
      H.scrollToActive(false);
      el.querySelectorAll('.menu-toggle').forEach((toggle) => {
        if ((toggle as HTMLElement).dataset.fwmToggleBound === '1') return;
        (toggle as HTMLElement).dataset.fwmToggleBound = '1';
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          m.toggle(toggle);
        });
      });
    } catch (e) { console.warn('[boot] Menu ctor:', e); }
  });

  document.querySelectorAll('.layout-menu-toggle').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); H.toggleCollapsed(); });
  });

  const menuEl = document.getElementById('layout-menu');
  if (menuEl) {
    let t: ReturnType<typeof setTimeout> | null = null;
    menuEl.onmouseenter = () => {
      t = setTimeout(() => document.querySelector('.layout-menu-toggle')?.classList.add('d-block'),
        H.isSmallScreen() ? 0 : 300);
    };
    menuEl.onmouseleave = () => {
      document.querySelector('.layout-menu-toggle')?.classList.remove('d-block');
      if (t) clearTimeout(t);
    };
  }

  const PerfectScrollbar = window.PerfectScrollbar;
  if (PerfectScrollbar) {
    document.querySelectorAll('.menu-inner').forEach((el) => {
      try { new PerfectScrollbar(el); } catch { /* */ }
    });
  }

  H.setAutoUpdate(true);

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    try {
      if (window.bootstrap) new window.bootstrap.Tooltip(el);
    } catch { /* */ }
  });
}

function App() {
  const inited = useRef(false);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    (async () => {
      const base = window.FWM_API_SCHEME
        ? `${window.FWM_API_SCHEME}://${window.FWM_API_HOST}:${window.FWM_API_PORT}`
        : '';
      const useProxy = !base || base.includes('localhost:10002') || base.includes('127.0.0.1:10002');
      let whitelistOnly = false;

      try {
        const authUrl = useProxy ? '/auth/me' : `${base}/auth/me`;
        const authRes = await fetch(authUrl, { cache: 'no-store', credentials: 'same-origin' });
        if (!authRes.ok) {
          setAuthChecked(true);
          return;
        }
        const authData = await authRes.json();
        const user = authData?.data?.user || null;
        const sessionNonce = authData?.data?.session_nonce;
        if (!user) {
          setAuthChecked(true);
          return;
        }
        setAuthProfile(user);
        setAuthChecked(true);
        window.kyklosCurrentUser = user;
        whitelistOnly = isWhitelistOnlyUser(user);
        window.kyklosDefaultView = whitelistOnly ? 'securityWhitelist' : 'dashboard';
        window.kyklosForceDefaultTab = sessionStorage.getItem(FORCE_DEFAULT_TAB_KEY) === '1';
        if (window.kyklosForceDefaultTab) {
          localStorage.removeItem(TAB_STORAGE_KEY);
        }
        if (typeof sessionNonce === 'string' && sessionNonce) {
          localStorage.setItem('kyklos_boot_session', sessionNonce);
        }
      } catch {
        setAuthChecked(true);
        return;
      }

      try {
        const url = useProxy ? '/platform' : `${base}/platform`;
        const res = await fetch(url);
        const d = await res.json();
        window.currentPlatform = typeof d.data === 'string' ? d.data : (d.data?.platform || 'linux');
      } catch { /* */ }

      console.log('[boot] loading Sneat deps...', SCRIPTS.map(s=>s.split('/').pop()));
      await loadScripts(SCRIPTS);
      console.log('[boot] all Sneat deps loaded, Helpers=', typeof window.Helpers, 'Menu=', typeof window.Menu);

      console.log('[boot] initializing menu...');
      bootMenu();

      if (typeof window.setLanguage === 'function') {
        window.setLanguage(window.currentLang || 'en', false);
      }
      if (whitelistOnly && typeof window.fwmSwitchView === 'function') {
        setTimeout(() => {
          window.fwmSwitchView && window.fwmSwitchView('securityWhitelist');
          window.fwmSetSecuritySubView && window.fwmSetSecuritySubView('whitelist');
        }, 200);
      } else if (typeof window.loadIptables === 'function') {
        setTimeout(() => window.loadIptables && window.loadIptables(), 200);
      }
    })();
  }, []);

  if (!authChecked) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary">
        <div className="text-muted">載入登入狀態...</div>
      </div>
    )
  }

  if (!authProfile) return <LoginView />

  return <Layout authProfile={authProfile} />;
}

export default App
