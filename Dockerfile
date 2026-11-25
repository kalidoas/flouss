# Stage 1: Build Frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Build arguments for Vite
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG SOURCE_COMMIT
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
RUN test -n "$VITE_API_URL" \
    && test -n "$VITE_FIREBASE_API_KEY" \
    && test -n "$VITE_FIREBASE_AUTH_DOMAIN" \
    && test -n "$VITE_FIREBASE_PROJECT_ID" \
    && test -n "$VITE_FIREBASE_STORAGE_BUCKET" \
    && test -n "$VITE_FIREBASE_MESSAGING_SENDER_ID" \
    && test -n "$VITE_FIREBASE_APP_ID" \
    || (echo 'VITE_API_URL and all required VITE_FIREBASE_* build variables must be set.' >&2; exit 1)

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Clean default static assets
RUN rm -rf ./*

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
