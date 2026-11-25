#!/bin/bash
cd /home/khalid/Flouss_gemini
npm run build > /tmp/build.log 2>&1
nohup npx vite preview --port 5174 --host > /tmp/preview.log 2>&1 &
PREVIEW_PID=$!
sleep 6
npx playwright test --config qa/playwright.config.ts --webServer command='npm run preview' url='http://localhost:5174' reuseExistingServer=false timeout=180000 2>&1 | tee /tmp/qa-results.log
kill $PREVIEW_PID 2>/dev/null
