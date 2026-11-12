# Email OTP Verification Setup Guide

This guide documents the serverless 6-digit email OTP verification system for Flouss on Vercel.

---

## 1. Required Environment Variables

Add the following environment variables in your Vercel Dashboard (`Settings > Environment Variables`) and locally in `.env.local`:

| Variable | Description | Example / Format |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin Service Account JSON credentials (or base64-encoded string). | `{"type":"service_account","project_id":"flouss-live",...}` |
| `RESEND_API_KEY` | API Key from Resend for transactional email dispatch. | `re_123456789abcdef` |
| `RESEND_FROM` | Verified sender address (optional, defaults to `Flouss <notifications@flouss.live>`). | `Flouss <notifications@flouss.live>` |

### How to generate `FIREBASE_SERVICE_ACCOUNT`:
1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Navigate to **Project Settings** > **Service accounts**.
3. Click **Generate new private key**.
4. Download the JSON file and paste its contents directly into `FIREBASE_SERVICE_ACCOUNT` in Vercel.

---

## 2. Resend DNS Records (`flouss.live`)

To send emails from `@flouss.live` with high deliverability (avoiding spam filters), add the following DNS records in your domain registrar / DNS provider (e.g. Cloudflare, Namecheap, Vercel Domains):

### 1. DKIM (DomainKeys Identified Mail)
- **Type**: `TXT`
- **Name**: `resend._domainkey` (or as provided in Resend dashboard)
- **Value**: `k=rsa; p=...`

### 2. SPF (Sender Policy Framework)
- **Type**: `TXT`
- **Name**: `@` (or `bounces.flouss.live`)
- **Value**: `v=spf1 include:amazonses.com ~all`

### 3. DMARC
- **Type**: `TXT`
- **Name**: `_dmarc`
- **Value**: `v=DMARC1; p=none; rua=mailto:dmarc-reports@flouss.live`

### 4. MX Record (for bounce handling)
- **Type**: `MX`
- **Name**: `bounces`
- **Value**: `feedback-smtp.us-east-1.amazonses.com`
- **Priority**: `10`

---

## 3. Serverless API Architecture

The system uses two endpoints located in `/api`:

### `POST /api/send-otp`
- **Auth**: Requires `Authorization: Bearer <Firebase_ID_Token>`
- **Behavior**:
  - Validates caller identity using Firebase Admin SDK.
  - Rate limiting:
    - 60-second cooldown between consecutive requests.
    - Max 5 sends per hour per user.
  - Generates a cryptographically random 6-digit code via `crypto.randomInt`.
  - Computes `sha256(salt + code)`.
  - Persists **only** the salt, hash, expiration (10 min), and attempt limit (5) in Firestore `/otp/{uid}`.
  - Dispatches an Obsidian/Zawaq styled dark-theme email via Resend.
  - **Never** exposes the plain code or hash in the HTTP response.

### `POST /api/verify-otp`
- **Auth**: Requires `Authorization: Bearer <Firebase_ID_Token>`
- **Body**: `{ "code": "123456" }`
- **Behavior**:
  - Validates caller identity.
  - Checks expiration (10 minutes).
  - Decrements `attemptsLeft` (max 5 attempts).
  - Verifies hash using constant-time comparison (`crypto.timingSafeEqual`).
  - Upon success:
    - Marks `emailVerified: true` via `admin.auth().updateUser(uid, { emailVerified: true })`.
    - Updates `users/{uid}/meta/profile` `{ emailVerified: true }`.
    - Deletes `/otp/{uid}` so it cannot be reused.
    - Returns `{ success: true }`.

---

## 4. Firestore Security Rules

Client read/write access to `/otp` is strictly blocked in `firestore.rules`:

```rules
match /otp/{document=**} {
  allow read, write: if false;
}
```

Only Vercel serverless functions using `firebase-admin` (bypassing security rules with service account privileges) can read or modify `/otp`.

---

## 5. Local Testing with Vercel CLI

Because `/api/*.ts` are Vercel Serverless Functions, use `vercel dev` rather than standalone `vite dev` to test both client and backend locally:

```bash
# 1. Install Vercel CLI globally if not already installed
npm install -g vercel

# 2. Pull environment variables from your Vercel project
vercel env pull .env.local

# 3. Start local development server (serves frontend + /api endpoints)
vercel dev
```

During local development with standalone `npm run dev`, if `/api/send-otp` returns 404, the UI automatically offers a fallback button to send standard Firebase link verification.
