# Test Credentials

## Admin
- Email: `admin@unishaala.com`
- Password: `Shivani@1234`
- Role: SUPER_ADMIN
- phoneVerified: true

## Existing test user (migrated to phoneVerified:true)
- Email: `user@example.com` (and `user1@example.com`)
- Password: unknown — re-create via POST /api/auth/signup or use admin to manage.

## Notes
- Phone verification is OPTIONAL site-wide (gating removed). Signup does NOT require OTP.
- Twilio account is on TRIAL — SMS to non-whitelisted numbers fails with code 21608.

## Google OAuth (native)
- Provider: Google Cloud Console (user-owned).
- Client ID configured in `/app/.env` as `GOOGLE_CLIENT_ID`.
- Redirect URI registered in Google Cloud: `https://dark-mode-theme-2.preview.emergentagent.com/api/auth/google/callback`
- Authorized JS origin: `https://dark-mode-theme-2.preview.emergentagent.com`
- Login flow: `/login` or `/signup` → button → `GET /api/auth/google/start` → Google → `GET /api/auth/google/callback` → upserts user → `auth_token` cookie set → 302 to `next` (or `/`).
- Test accounts must be added under "Test users" in OAuth consent screen while the app is in Testing mode.
- Users created via Google OAuth are stored with `authProvider:'google'`, `googleId:<sub>`, `role:'USER'`, `phoneVerified:false`.

