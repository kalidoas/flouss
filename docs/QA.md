# Flouss QA & Security Verification Plan

This document details the manual and automated verification procedures for Flouss (`flouss.live`), covering auth state machine gates, profile metadata separation, data isolation, session security, and account lifecycle.

---

## 1. New Account Workspace Isolation
**Requirement:** Brand-new user signups must start with an entirely empty workspace (0 transactions, 0 tasks, 0 debts, 0 subscriptions, 0 notes, balance 0). No demo data or previous user state may leak.

### Test Procedure:
1. Navigate to `/` in an incognito window or clear all storage.
2. Sign up with a new email address (e.g., `test-fresh-user@example.com`) or new Google account.
3. Complete email verification (if email/password) and set a 4-digit PIN (e.g. `1234`).
4. Enter initial balance `0` or skip.
5. **Verify:**
   - Balance displays `0.00 MAD`.
   - Transaction list is empty (no demo 13 entries or `-352.90 MAD`).
   - Tasks, Debts, Subscriptions, and Notes tabs have 0 entries.
   - Inspect `localStorage`: Only `flouss_user_<new_uid>` exists. The legacy `flouss_user_default` and `flouss-store` are absent.
   - Inspect Firestore: `users/<new_uid>` has `transactions: []` and empty sub-collections.

---

## 2. Per-User PIN Setup vs. Unlock Flow
**Requirement:** PIN security is strictly per-user and stored in `users/{uid}/meta/profile`. New users must never see a PIN unlock pad before creating one.

### Test Procedure:
1. Create a fresh account.
2. Observe transition from email verification to PIN setup:
   - UI prompts "Configurez votre code PIN (4 chiffres)".
   - Enter `2580` and confirm `2580`.
3. App unlocks and transitions to Welcome modal.
4. Refresh the page:
   - Screen prompts for PIN entry (`2580`).
   - Entering `2580` unlocks the session immediately.
5. In Firestore Console, verify `users/{uid}/meta/profile` contains:
   - `hasPin: true`
   - `pinHash`: PBKDF2 hash (base64url)
   - `pinSalt`: 32-byte cryptographically random salt (base64url)
   - `pinIterations: 100000`
   - `pinFailCount: 0`
   - `lockedUntil: 0`
6. Verify `localStorage`: The PIN hash is NEVER present in `flouss_user_<uid>`.

---

## 3. Forgot PIN & Secure Re-Authentication
**Requirement:** In-browser recovery codes and EmailJS dependencies are completely removed. Forgot PIN triggers native Firebase re-authentication.

### Test Procedure:
1. On the PIN Unlock screen, click **"Code PIN oublié ?"**
2. **For Google Users:**
   - A Google account popup prompts re-authentication.
   - Upon successful Google authentication, user is routed directly to choose a new 4-digit PIN.
3. **For Email/Password Users:**
   - Modal prompts: "Saisissez le mot de passe de votre compte pour réinitialiser votre code PIN".
   - Enter account password.
   - Upon verification, user is routed directly to set a new 4-digit PIN.
4. **Security Check:**
   - Open Network tab and DevTools console.
   - Verify NO raw OTP codes, secrets, or PINs are emitted in logs, console, or responses.

---

## 4. Platform Biometrics (Face ID / Touch ID)
**Requirement:** WebAuthn platform authenticator constraint (`authenticatorAttachment: "platform"`, `userVerification: "required"`). Never show the hybrid QR code / security key passkey prompt.

### Test Procedure:
1. On an iOS device with Face ID / Touch ID or Mac with Touch ID:
   - Set up PIN in Flouss.
   - At prompt "Activer Face ID / Touch ID ?", click **Activer**.
   - Authenticate with Face ID.
2. Lock the app (Settings → "Verrouiller l'application" or refresh).
3. The Face ID button is visible on the PIN lock screen.
4. Click the Face ID button:
   - Native OS biometric prompt appears directly without foreign device options.
   - Upon successful biometric scan, app unlocks instantly.
5. If cancelled, app remains on PIN pad without errors.
6. On unsupported devices (e.g. standard Linux desktop without WebAuthn authenticator):
   - Face ID button is automatically hidden.

---

## 5. Login With Wrong Password
**Requirement:** Invalid credentials must immediately show a friendly error without advancing or exposing session state.

### Test Procedure:
1. On login screen, enter an existing email with an incorrect password.
2. Click "Se connecter".
3. **Verify:**
   - Form remains on login screen.
   - Error message: "Email ou mot de passe incorrect." is displayed.
   - No auth state changes occur.

---

## 6. Email Verification Flow
**Requirement:** Email/password signups must verify their email address before accessing the app. Google users skip verification automatically.

### Test Procedure:
1. Sign up with email/password.
2. User is redirected to `EmailVerificationScreen`:
   - Displays animated mail icon and user's email.
   - Displays "Vérifier à nouveau" (Reload) button.
   - Displays "Renvoyer l'email" with 60-second cooldown timer.
3. Open confirmation link in email in another tab.
4. Return to Flouss and click "Vérifier à nouveau":
   - Firebase reloads user profile.
   - App automatically detects `emailVerified: true` and transitions to PIN setup.
5. Click "Se déconnecter":
   - Logs out and returns to clean login screen.

---

## 7. Session Model: Lock App vs. Sign Out
**Requirement:**
- "Lock app" clears the in-memory PIN session (`sessionStorage`) but preserves the Firebase Auth session (`browserLocalPersistence`). User only needs to enter their PIN.
- "Sign out" terminates the Firebase Auth session completely, requiring full login.

### Test Procedure:
1. Log in and unlock app.
2. Go to Settings → Security → Click **"Verrouiller l'application"**.
3. **Verify:**
   - PIN unlock pad is displayed.
   - User does NOT have to re-enter email or password.
   - Entering 4-digit PIN restores the session immediately.
4. Open User Profile Modal → Click **"Se déconnecter"** (Sign Out):
   - App signs out completely.
   - Navigates to Login / Sign In screen.

---

## 8. Security & Scale Hardening
**Requirement:**
- PBKDF2 random 32-byte salt with 100,000 iterations per user.
- Firestore security rules strictly scoped to `request.auth.uid == userId`.
- "Supprimer mon compte" (Delete Account) in Settings.
- Global Error Boundary to catch any unhandled exceptions.

### Test Procedure:
1. Go to Settings → Danger Zone.
2. Notice two distinct actions:
   - "Réinitialiser les données locales"
   - "Supprimer mon compte"
3. Click "Supprimer mon compte":
   - Prompts for password (if password account) and typing "SUPPRIMER".
   - Confirming permanently deletes:
     - `users/{uid}/meta/profile`
     - `users/{uid}`
     - Firebase Auth User
     - All local storage and cookies
   - User is redirected to login as a clean slate.

---

## 9. Backward Compatibility & Zero Regressions
**Requirement:** Existing accounts (e.g. `Khalid`) must keep all existing transactions, categories, balance, and PIN without forced onboarding.

### Test Procedure:
1. Sign in with the existing account.
2. **Verify:**
   - App detects existing cloud data and creates/migrates `users/{uid}/meta/profile` with `hasSeenWelcome: true`.
   - Existing transactions, debts, recurring rules, and balance remain 100% intact.
   - No data lost or overwritten.
