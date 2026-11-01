import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

export const AppleShimmerSkeleton: React.FC = () => {
  const language = useAppStore((s) => s.language);

  const text =
    language === 'ar'
      ? 'جاري التحقق والمزامنة مع السحابة...'
      : language === 'en'
      ? 'Authenticating & syncing with Cloud Firestore...'
      : 'Authentification et synchronisation Firestore...';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121212] p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Background ambient radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Simulated Top Dynamic Island */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-36 h-7 rounded-full bg-black/90 dark:bg-black/95 border border-white/10 flex items-center justify-between px-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-mono text-zinc-400">Flouss Sync</span>
      </div>

      <div className="w-full max-w-4xl space-y-6 relative z-10 animate-pulse">
        {/* Top Header Mockup */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
            <div className="h-8 w-8 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
          </div>
        </div>

        {/* Hero Bento Grid Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2/3 Priority Hub skeleton */}
          <div className="lg:col-span-2 h-72 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-black/[0.05] dark:border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-44 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80" />
              <div className="h-5 w-16 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50" />
              <div className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50" />
            </div>
            <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50" />
          </div>

          {/* Compact 1/3 Apple Wallet Card skeleton */}
          <div className="h-72 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-black/[0.05] dark:border-white/[0.08] p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-4 w-28 rounded bg-zinc-200/80 dark:bg-zinc-800/80" />
              <div className="h-10 w-48 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-8 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
                <div className="h-8 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
                <div className="h-8 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Status text with subtle pulsing indicator */}
        <div className="flex items-center justify-center gap-2 pt-6 text-xs text-zinc-500 dark:text-zinc-400">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full"
          />
          <span className="font-medium tracking-tight">{text}</span>
        </div>
      </div>
    </div>
  );
};
