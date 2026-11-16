# Flouss staging deployment checklist

Use the staging Coolify project/environment only. Do not copy production Firebase settings or production secrets into staging. Coolify must be reachable over HTTPS before entering any secret.

## 1. Domains and TLS

- Create DNS A records for `staging` and `api-staging` pointing to the Coolify server IP.
- In the staging frontend application, set the domain to `https://staging.flouss.live`.
- In the staging backend application, set the domain to `https://api-staging.flouss.live` and the container target port to `3000`.
- Wait until Coolify reports valid HTTPS certificates for both domains.

## 2. Backend settings

- Build strategy: the repository `server/Dockerfile`; base directory `/server`.
- Container port: `3000`. Expose it to Coolify's reverse proxy; do not add a public host/port mapping.
- Run one replica. OTP attempt state is stored in Firestore; the current request rate limit uses the in-memory store and resets on restart.
- Healthcheck: path `/health`, port `3000`.
- Configure these **runtime** environment variable names in the staging backend:
  - `PORT`
  - `ALLOWED_ORIGIN`
  - `TRUST_PROXY_HOPS`
  - `OTP_SECRET`
  - `FIREBASE_SERVICE_ACCOUNT`
  - `RESEND_API_KEY`
  - `RESEND_FROM`
- `ALLOWED_ORIGIN` must exactly match the frontend staging origin listed above.
- Set `TRUST_PROXY_HOPS` to the actual trusted proxy count between the client and Express. For a single Coolify/Traefik proxy hop use `1`; reassess if another proxy (for example Cloudflare) is in front. Never trust arbitrary forwarded headers.
- Use the Firebase service account for the separate staging Firebase project only. Keep it as a runtime secret; do not add it as a build variable.

## 3. Resend DNS

- In Resend, add/verify the sending domain and publish the exact DNS records it provides: SPF, DKIM, and DMARC.
- Check that SPF and DKIM show verified in Resend, and publish a DMARC TXT record for the domain. Use the exact host/value supplied by the chosen DNS provider and Resend; do not guess DKIM hostnames.

## 4. Frontend build settings

- Build strategy: repository root `Dockerfile`; base directory `/`.
- Set these as **build-time** variables in the staging frontend application, then rebuild without cache:
  - `VITE_API_URL`
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- The Firebase web configuration must belong to the staging Firebase project. `VITE_API_URL` must point to the staging API domain listed above.

## 5. Staging smoke checks

Run these only against staging. They contain variable names/placeholders, not credentials; provide any real token in a local shell and never paste it into logs or this file.

```sh
curl -i https://api-staging.flouss.live/health
```

Expect HTTP 200 and JSON with `status` set to `ok`.

```sh
curl -i -X POST https://api-staging.flouss.live/api/send-otp \
  -H 'Content-Type: application/json' -d '{}'
```

Expect HTTP 401 without an Authorization bearer token.

```sh
curl -i -X OPTIONS https://api-staging.flouss.live/api/send-otp \
  -H 'Origin: https://staging.flouss.live' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type'

curl -i -X OPTIONS https://api-staging.flouss.live/api/send-otp \
  -H 'Origin: https://not-allowed.example' \
  -H 'Access-Control-Request-Method: POST'
```

The staging origin must receive the matching CORS allow-origin header. The untrusted origin must be rejected (HTTP 403).

For lockout, obtain a Firebase ID token for a disposable staging account and export it locally as `FIREBASE_ID_TOKEN`. Send five wrong six-digit codes (the example below uses a deliberately wrong placeholder) and confirm the fifth response says the code is invalidated; a subsequent correct code must also be rejected until a new code is issued.

```sh
for attempt in 1 2 3 4 5; do
  curl -sS -o /dev/null -w '%{http_code}\n' \
    -X POST https://api-staging.flouss.live/api/verify-otp \
    -H "Authorization: Bearer ${FIREBASE_ID_TOKEN}" \
    -H 'Content-Type: application/json' \
    -d '{"code":"000000"}'
done
```

Also complete a real staging signup: receive the OTP, verify it, sign out, and confirm another account cannot read the first account's data. Check deployment and runtime logs for startup or mail errors without revealing environment values.

## 6. Rollback

- Keep the previous successful staging frontend and backend deployments available in Coolify.
- If a smoke check fails, roll back the affected staging application to its last known-good deployment; keep frontend and backend versions compatible.
- If a rollback follows an environment change, restore the previous staging environment configuration as well. Do not copy staging settings into production or change production as part of this rollback.
- Re-run `/health`, the unauthenticated 401 check, CORS checks, and signup/OTP flow before resuming staging work.
