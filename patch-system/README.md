# P.A.T.C.H. System Expo App

This folder contains the React Native + Expo version of P.A.T.C.H. SYSTEM.

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. If you want live/shared session testing, copy the env template and fill in your Supabase values:
   ```bash
   cp .env.example .env.local
   ```
3. Start Expo:
   ```bash
   npm run web
   ```
   or:
   ```bash
   npm start
   ```

## Live / Shared Session Setup

Expo reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` at build time. Without them, the app stays in local-only mode.

If you want remote session sync to work, set those variables in `.env.local` before starting Expo.

## GM Access

The built-in GM override code is `PATCH-GM`.