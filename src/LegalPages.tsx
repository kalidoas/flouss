import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Lock, Mail, CheckCircle2 } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen w-full bg-bg text-content font-sans selection:bg-accent selection:text-content relative overflow-x-hidden">
      {/* Ambient Cosmic & Nebula Background Glows */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 15%, rgba(124, 58, 237, 0.18), transparent 55%), radial-gradient(circle at 85% 85%, rgba(99, 102, 241, 0.12), transparent 50%)',
        }}
      />

      {/* Main Container */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {/* Navigation & Header */}
        <header className="mb-8 sm:mb-10">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-text-subtle hover:text-content bg-surface-3 hover:bg-surface-2 border border-border transition-all active:scale-95 duration-150 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Flouss</span>
          </a>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-content">
            {title}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-text-subtle leading-relaxed">
            {subtitle}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-text-subtle font-mono">
            <span>Last updated: November 11, 2026</span>
            <span>•</span>
            <span className="text-accent">flouss.live</span>
          </div>
        </header>

        {/* Glassmorphic Obsidian Card */}
        <article className="rounded-3xl bg-surface backdrop-blur-xl border border-border p-6 sm:p-8 lg:p-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_50px_-12px_rgba(0,0,0,0.8)] space-y-8">
          {children}
        </article>

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-subtle">
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-muted transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="/terms" className="hover:text-muted transition-colors">
              Terms of Service
            </a>
          </div>
          <p>© {new Date().getFullYear()} Flouss. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Flouss collects, stores, protects, and uses your personal and financial data."
    >
      {/* Overview Pill */}
      <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 text-accent text-xs sm:text-sm leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-content block mb-0.5">Privacy First Guarantee</strong>
          Flouss is designed as an ultra-private personal finance tracker. We do not sell, rent, monetize, or share your financial data with third-party advertisers or data brokers.
        </div>
      </div>

      {/* Section 1 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            1
          </span>
          Information We Collect
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Flouss collects only the minimum necessary information required to operate your personal account and deliver financial management features:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-text-subtle pl-1">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
            <span>
              <strong className="text-muted">Account Credentials:</strong> When you sign in via Google OAuth or email, we receive your name, email address, and profile avatar URL to identify your workspace.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
            <span>
              <strong className="text-muted">Financial Records Entered by You:</strong> Transactions (expenses, income, balance adjustments), category choices, debt trackers, recurring bills and subscriptions, notes, and productivity tasks/habits.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
            <span>
              <strong className="text-muted">Security Preferences:</strong> Your salted and hashed 4-digit secret PIN (if enabled) and local biometric unlock preference.
            </span>
          </li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            2
          </span>
          How We Use Your Information
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Your information is used strictly to provide, maintain, and secure the Flouss application:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-text-subtle">
          <li>Authenticating your identity and preventing unauthorized access to your records.</li>
          <li>Synchronizing your financial data in real time across your devices (phone, tablet, computer).</li>
          <li>Calculating your net balance, monthly summaries, category allocations, and habit tracking matrices.</li>
          <li>Dispatching transactional security emails (such as 6-digit login or PIN recovery verification codes).</li>
        </ul>
        <p className="text-xs sm:text-sm text-muted leading-relaxed font-semibold">
          We never sell your data, we do not run third-party advertising, and we do not track you across other websites.
        </p>
      </section>

      {/* Section 3 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            3
          </span>
          Where and How Data Is Stored
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Flouss utilizes enterprise-grade Google Cloud infrastructure via Google Firebase:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-text-subtle pl-1">
          <li className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-muted">Firebase Authentication & Cloud Firestore:</strong> All cloud storage is governed by strict Firestore security rules that isolate every user's documents exclusively to their authenticated Firebase UID (<code className="text-[11px] text-accent bg-surface-3 px-1 py-0.5 rounded">request.auth.uid == userId</code>).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-muted">Encryption:</strong> All data is encrypted in transit using industry-standard TLS/HTTPS protocols and encrypted at rest by Google Cloud.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-muted">PIN Protection:</strong> Optional 4-digit PINs are hashed using cryptographic one-way hashing with per-user salting before storage.
            </span>
          </li>
        </ul>
      </section>

      {/* Section 4 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            4
          </span>
          Google User Data
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Flouss uses Google OAuth solely for user sign-in and authentication:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-text-subtle">
          <li>We only request standard, non-sensitive identity scopes: <code className="text-[11px] text-accent bg-surface-3 px-1 py-0.5 rounded">openid</code>, <code className="text-[11px] text-accent bg-surface-3 px-1 py-0.5 rounded">email</code>, and <code className="text-[11px] text-accent bg-surface-3 px-1 py-0.5 rounded">profile</code>.</li>
          <li>We do <strong>NOT</strong> request or access sensitive Google scopes, such as your Gmail inbox, Google Drive files, Google Contacts, or private Google account settings.</li>
          <li>We do not transfer or disclose Google user data to third parties, other than to Google Cloud to host the backend of the service.</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            5
          </span>
          Your Rights & Data Deletion
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          You retain full ownership and control over your personal information:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-text-subtle">
          <li><strong>Access & Export:</strong> You can export your financial records (e.g. to Excel/JSON) at any time directly through the app settings.</li>
          <li><strong>Modification:</strong> You can edit or delete any transaction, category, or note at will.</li>
          <li><strong>Complete Account Deletion:</strong> You have the right to request permanent deletion of your account and all related Firestore data at any time by sending an email to our contact address below.</li>
        </ul>
      </section>

      {/* Section 6 */}
      <section className="space-y-3 pt-2 border-t border-border-strong">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <Mail className="w-4 h-4 text-accent" />
          Contact Us
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact the developer directly:
        </p>
        <div className="p-3.5 rounded-2xl bg-surface-3 border border-border flex items-center justify-between">
          <span className="text-xs font-mono text-accent">kouchatre@gmail.com</span>
          <a
            href="mailto:kouchatre@gmail.com"
            className="text-xs font-semibold text-content bg-accent hover:bg-accent px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Send Email
          </a>
        </div>
      </section>
    </LegalLayout>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Terms and conditions governing your access to and use of Flouss."
    >
      {/* Section 1 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            1
          </span>
          Acceptance of Terms
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          By accessing, registering for, or using the Flouss application at{' '}
          <a href="https://flouss.live" className="text-accent underline underline-offset-2">
            flouss.live
          </a>
          , you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not access or use the application.
        </p>
      </section>

      {/* Section 2 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            2
          </span>
          The Service
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Flouss is a personal finance bookkeeping and routine tracking tool designed to help individuals record income, track expenses, manage budgets, and maintain productivity habits. The service is provided on an <strong className="text-content">"as is"</strong> and <strong className="text-content">"as available"</strong> basis without warranties of any kind, whether express or implied.
        </p>
      </section>

      {/* Section 3 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            3
          </span>
          No Financial, Tax, or Legal Advice
        </h2>
        <div className="p-4 rounded-2xl bg-warning/10 border border-warning/20 text-warning text-xs sm:text-sm leading-relaxed">
          <strong className="text-content block mb-1">Important Disclaimer:</strong>
          Flouss is strictly an informational and self-service bookkeeping utility. Nothing contained within the app, including balance calculations, financial summaries, statistics, or automated insights, constitutes financial, investment, accounting, tax, or legal advice. You are solely responsible for your financial decisions and verifying the accuracy of your entries.
        </div>
      </section>

      {/* Section 4 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            4
          </span>
          Your Account and Responsibilities
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-text-subtle">
          <li>You are responsible for safeguarding your login credentials (Google account, email, and password).</li>
          <li>If you choose to enable a 4-digit security PIN, you are responsible for remembering it and maintaining its confidentiality.</li>
          <li>You agree not to use Flouss for any unlawful purpose, fraud, or to disrupt the security or integrity of the service or its underlying infrastructure.</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            5
          </span>
          Availability and Changes to the Service
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          While we strive to ensure 24/7 uptime and dependable data synchronization, we do not warrant that the service will be uninterrupted, error-free, or completely secure from external attacks. We reserve the right to modify, improve, or temporarily suspend features as needed to maintain or upgrade the platform.
        </p>
      </section>

      {/* Section 6 */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-3 border border-border text-accent text-xs font-mono font-bold flex items-center justify-center">
            6
          </span>
          Termination and Account Closure
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          You may stop using Flouss at any time. You may request the permanent deletion of your account and all associated Firestore records by contacting us at the email below. We also reserve the right to suspend or terminate accounts that breach these terms or abuse the platform.
        </p>
      </section>

      {/* Section 7 */}
      <section className="space-y-3 pt-2 border-t border-border-strong">
        <h2 className="text-base sm:text-lg font-bold text-content flex items-center gap-2">
          <Mail className="w-4 h-4 text-accent" />
          Contact Us
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          For any inquiries or notices concerning these Terms of Service, please reach out to:
        </p>
        <div className="p-3.5 rounded-2xl bg-surface-3 border border-border flex items-center justify-between">
          <span className="text-xs font-mono text-accent">kouchatre@gmail.com</span>
          <a
            href="mailto:kouchatre@gmail.com"
            className="text-xs font-semibold text-content bg-accent hover:bg-accent px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Send Email
          </a>
        </div>
      </section>
    </LegalLayout>
  );
};
