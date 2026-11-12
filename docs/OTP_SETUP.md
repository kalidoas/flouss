# Email OTP Verification & Deployment Guide (Coolify on Azure VM)

This guide documents the architecture, configuration, and deployment procedures for Flouss on an **Azure VM managed via Coolify (Docker)** at **https://flouss.live**.

---

## 1. System Architecture

Flouss is deployed as two decoupled Docker containers on your Azure VM via Coolify:

1. **Frontend (`flouss-frontend`)**:
   - Multi-stage Docker build: compiles React + Vite with `VITE_API_URL`.
   - Served via lightweight Nginx Alpine with SPA routing (`try_files $uri /index.html`), gzip compression, and security headers (HSTS, X-Content-Type-Options, Referrer-Policy).
   - Domain: `https://flouss.live`

2. **Backend OTP Service (`flouss-backend` in `/server`)**:
   - Standalone Node/Express microservice.
   - Verifies Firebase Auth ID tokens via `firebase-admin`.
   - Stores salted SHA-256 hashes in Firestore `/otp/{uid}` (10 min expiry, 5 attempts max, 60s cooldown, max 5 sends/hour).
   - Sends verification emails via Resend (`RESEND_API_KEY`) with an Obsidian/Zawaq dark-theme template.
   - CORS restricted to `https://flouss.live` and configured origins.
   - Health check endpoint at `GET /health`.
   - Domain: `https://api.flouss.live` (or custom subdomain in Coolify).

---

## 2. Environment Variables: Build vs Runtime

### A. Frontend Service (`/Dockerfile`) — **Build-Time Variable**
In Coolify, under your Frontend application settings > **Environment Variables**:

| Variable | Scope | Description | Value |
|---|---|---|---|
| `VITE_API_URL` | **Build-time** (Check "Build Variable") | URL where the backend OTP service is reachable. | `https://api.flouss.live` |

> [!IMPORTANT]
> Because Vite bundles variables into client JavaScript during the `npm run build` step, `VITE_API_URL` must be provided as a **Build Variable** (or `ARG VITE_API_URL`). Never put secret keys (such as `FIREBASE_SERVICE_ACCOUNT` or `RESEND_API_KEY`) here.

---

### B. Backend OTP Service (`/server/Dockerfile`) — **Runtime Variables**
In Coolify, under your Backend application settings (pointed to directory `/server`) > **Environment Variables**:

| Variable | Scope | Description | Example / Format |
|---|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Runtime | Firebase Admin Service Account credentials (raw JSON string or base64 encoded). | `{"type":"service_account","project_id":"flouss-live",...}` |
| `RESEND_API_KEY` | Runtime | Resend API key for sending emails. | `re_123456789abcdef` |
| `RESEND_FROM` | Runtime | Verified email sender address. | `Flouss <notifications@flouss.live>` |
| `ALLOWED_ORIGIN` | Runtime | Allowed CORS origin(s) (comma-separated if multiple). | `https://flouss.live` |
| `PORT` | Runtime | Internal container listen port (defaults to 3000). | `3000` |
| `NODE_ENV` | Runtime | Node environment mode. | `production` |

---

## 3. Coolify Configuration on Azure VM

### Step 1: Create Applications in Coolify
1. **Frontend App**:
   - **Repository**: Your GitHub repository
   - **Build Pack**: `Dockerfile`
   - **Base Directory**: `/`
   - **Domains**: `https://flouss.live`
   - **Port Expose**: `80`
   - **Build Variable**: `VITE_API_URL=https://api.flouss.live`

2. **Backend App**:
   - **Repository**: Same GitHub repository
   - **Build Pack**: `Dockerfile`
   - **Base Directory**: `/server`
   - **Domains**: `https://api.flouss.live`
   - **Port Expose**: `3000`
   - **Runtime Variables**: Add `FIREBASE_SERVICE_ACCOUNT`, `RESEND_API_KEY`, `ALLOWED_ORIGIN=https://flouss.live`, `PORT=3000`.

---

## 4. DNS Configuration (Domain Registrar / Cloudflare)

Point your domain to your Azure VM public IP address:

| Type | Name | Content / Target | Proxy Status | Notes |
|---|---|---|---|---|
| `A` | `@` (or `flouss.live`) | `<AZURE_VM_PUBLIC_IP>` | DNS only / Proxied | Frontend entry point |
| `A` | `api` (or `api.flouss.live`) | `<AZURE_VM_PUBLIC_IP>` | DNS only / Proxied | Backend OTP service |

### Resend Email DNS Records (for `flouss.live`)
Add in your DNS provider to authorize Resend to send emails from `@flouss.live`:

1. **DKIM**: `TXT` record `resend._domainkey` with the public key provided in the Resend dashboard.
2. **SPF**: `TXT` record with `v=spf1 include:amazonses.com ~all`.
3. **DMARC**: `TXT` record `_dmarc` with `v=DMARC1; p=none; rua=mailto:dmarc-reports@flouss.live`.
4. **MX**: `MX` record `bounces.flouss.live` pointing to `feedback-smtp.us-east-1.amazonses.com` (priority 10).

---

## 5. Firebase Authentication — Authorized Domains

Google OAuth and Firebase Auth reject sign-in and token requests from unauthorized hosts.

1. Open the [Firebase Console](https://console.firebase.google.com).
2. Go to **Authentication** > **Settings** > **Authorized domains**.
3. Add:
   - `flouss.live`
   - `api.flouss.live` (if applicable)
   - Any staging domains or IP test hosts you use.

---

## 6. Firestore Security Rules

Client access to `/otp` collection is strictly locked down:

```rules
match /otp/{document=**} {
  allow read, write: if false;
}
```

Only the standalone Node backend using `firebase-admin` service account privileges can create, read, and delete documents in `/otp`.

---

## 7. Local Testing

To run both services locally on your development machine:

```bash
# 1. Start backend server (port 3000)
cd server
npm run dev

# 2. In another terminal, start frontend with VITE_API_URL pointed to local backend
VITE_API_URL=http://localhost:3000 npm run dev
```

Test health check:
```bash
curl http://localhost:3000/health
# Response: {"status":"ok","uptime":...,"timestamp":"..."}
```
