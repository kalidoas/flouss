import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { PrivacyPage, TermsPage } from './LegalPages';
import './index.css';
import { initGlobalHaptics } from './utils/haptics';

// Initialize global capture-phase haptics delegation (0ms sensory latency)
initGlobalHaptics();

// Enable iOS Safari :active pseudo-class state reliability
if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', () => {}, { passive: true });
}

function getPublicLegalPage(pathname: string): React.ReactElement | null {
  const cleanPath = pathname.replace(/\/+$/, '').toLowerCase();
  if (cleanPath === '/privacy') {
    return <PrivacyPage />;
  }
  if (cleanPath === '/terms') {
    return <TermsPage />;
  }
  return null;
}

const RootEntry: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const legalPage = getPublicLegalPage(currentPath);
  if (legalPage) {
    return legalPage;
  }

  return <App />;
};

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
    // Strip emails and tokens to ensure zero PII leakage in logs
    const sanitizedMsg = (error.message || '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      .replace(/[A-Za-z0-9+/=]{20,}/g, '[REDACTED_TOKEN]');
    console.error('[Flouss ErrorBoundary]:', sanitizedMsg, error.name);
  }

  public render() {
    if (this.state.hasError) {
      const rawMsg = this.state.error?.message || 'Une erreur inattendue est survenue.';
      const sanitizedMsg = rawMsg
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
        .replace(/[A-Za-z0-9+/=]{20,}/g, '[REDACTED_TOKEN]');

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-[#0D0E14]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center text-2xl shadow-sm">
              ⚡
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Mode de Récupération Local (Flouss)
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Une exception a été interceptée lors du chargement. Vos données locales restent sécurisées.
              </p>
            </div>

            {/* Sanitized Error Message Box */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-left text-xs font-mono text-rose-300 break-words max-h-32 overflow-y-auto">
              {sanitizedMsg}
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
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition-all cursor-pointer"
              >
                Mode Hors-Ligne
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Recharger l'application
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
        <RootEntry />
      </MotionConfig>
    </RootErrorBoundary>
  </React.StrictMode>
);
