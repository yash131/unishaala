# Test Credentials

## Admin
- Email: `admin@unishaala.com`
- Password: `Shivani@1234`
- Role: SUPER_ADMIN
- phoneVerified: true (admins bypass phone gating)

## Phone Verification (NEW — Mandatory)
- Twilio Verify Service is now ENFORCED for ALL non-admin users.
- After login/signup, non-admin users with `phoneVerified !== true` are redirected to `/verify-otp`.
- All routes except `/`, `/login`, `/signup`, `/verify-otp`, `/verify-phone`, legal pages, `/admin/*`, `/api/*`, `/notifications/*`, static assets are gated by middleware.
- API endpoints:
  - `POST /api/auth/send-otp` — body: `{ phone: "+919999999999" }`
  - `POST /api/auth/verify-phone-otp` — body: `{ phone, code }` (stateless verification only)
  - `POST /api/auth/verify-my-phone` — body: `{ phone, code }` — verifies AND persists `phoneVerified:true` on the logged-in user, re-issues JWT.
- Twilio creds live in `/app/.env` (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID).
- Existing users were migrated: all non-admin users had `phoneVerified` reset to `false` (one-time migration tracked via `site_settings.id='phone_verify_gating_v2'`).

## Test user (must verify on next login)
- Email: `user@example.com` (and `user1@example.com`) — phoneVerified now `false` after migration.
- Password: unknown — create a new user via POST /api/auth/signup if needed.

## Google OAuth (native)
- Provider: Google Cloud Console (user-owned).
- Client ID configured in `/app/.env` as `GOOGLE_CLIENT_ID`.
- Redirect URI: `https://dark-mode-theme-2.preview.emergentagent.com/api/auth/google/callback`
- Authorized JS origin: `https://dark-mode-theme-2.preview.emergentagent.com`
- Google login users with `phoneVerified:false` → redirected to `/verify-otp` after callback.
