import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import './index.css';
import { initGlobalHaptics } from './utils/haptics';

// Initialize global capture-phase haptics delegation (0ms sensory latency)
initGlobalHaptics();

// Enable iOS Safari :active pseudo-class state reliability
if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', () => {}, { passive: true });
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Flouss ErrorBoundary]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'Une erreur inattendue est survenue.';

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-white/95 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-500 dark:text-amber-400 flex items-center justify-center text-2xl shadow-sm">
              ⚡
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                Mode de Récupération Local (Flouss)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Une exception a été interceptée lors du chargement. Vos données locales restent sécurisées.
              </p>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 rounded-xl bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5 text-left text-xs font-mono text-rose-600 dark:text-rose-300 break-words max-h-32 overflow-y-auto">
              {errorMsg}
            </div>

            {/* Diagnostic .env.local guide */}
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 text-left space-y-2">
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                Configuration requise (.env.local) :
              </span>
              <pre className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-black/5 dark:bg-black/50 p-2.5 rounded-xl overflow-x-auto select-all">
{`VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=floss-6799f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=floss-6799f
VITE_FIREBASE_STORAGE_BUCKET=floss-6799f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=148161989669
VITE_FIREBASE_APP_ID=1:148161989669:web:f0cc8647b9f3416b3643cc
VITE_FIREBASE_MEASUREMENT_ID=G-2H34FEDTL1`}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('flouss_safe_mode', 'true');
                  } catch (e) {}
                  window.location.reload();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition-all cursor-pointer"
              >
                Continuer en Mode Hors-Ligne
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Réessayer la connexion
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </RootErrorBoundary>
  </React.StrictMode>
);
