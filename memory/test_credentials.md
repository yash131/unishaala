# Test Credentials

## Admin (Email + Password — special path)
- URL: `/admin-login` (linked from regular `/login` page footer)
- Email: `admin@unishaala.com`
- Password: `Shivani@1234`
- Role: SUPER_ADMIN
- Auto-redirected to `/admin` on success
- Note: `/api/auth/login` (password endpoint) now ONLY works for users with role ADMIN/SUPER_ADMIN. Non-admin users calling it get 403 "Password login is disabled."

## Regular Users (Phone + OTP only)
- URL: `/login` and `/signup`
- **Signup:** Name + Email + Phone (NO password). After form submit → OTP step (auto-sent to phone) → verify → auto-login.
- **Login:** Phone only → OTP sent → verify → login.
- API endpoints:
  - `POST /api/auth/login-otp/send` — body `{ phone: "+91xxxxxxxxxx" }` → 200 with `{userId, maskedPhone}` OR 404 with `code:"ACCOUNT_NOT_FOUND"`
  - `POST /api/auth/login-otp/verify` — body `{ phone, code, forceLogout? }` →
    - 200 `{ token, user }` on success
    - 409 `{ code: "ALREADY_LOGGED_IN", canForce: true }` if user has an active session on another device. Resend with `forceLogout: true` to take over.
    - 400 on invalid OTP
  - `POST /api/auth/signup` — body `{ name, email, phone }` (password optional, ignored). Returns user with `phoneVerified: false` + auth_token cookie.
  - `POST /api/auth/verify-my-phone` — same as before, also bumps tokenVersion and sets activeSessionId.
  - `POST /api/auth/logout` — clears cookie AND clears activeSessionId in DB (so user can log in elsewhere).
- `/api/auth/forgot-password/*` endpoints still exist but irrelevant in OTP-only mode (no password to forget).

## Single-Device Session Restriction
- Each user has DB fields: `activeSessionId`, `lastLoginAt`, `tokenVersion`.
- A new login is BLOCKED with HTTP 409 if `lastLoginAt < 7 days ago` AND `activeSessionId` is set.
- User must click "Continue here" to force-logout the other device (passes `forceLogout: true`), which:
  - Bumps tokenVersion (kicks the old JWT — old device sees 401 on next /auth/me call)
  - Sets new activeSessionId
- Admins (ADMIN/SUPER_ADMIN role) are exempt from single-device restriction.
- On manual logout, `activeSessionId` is cleared so user can immediately log in elsewhere.

## Twilio
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID — all in `/app/.env`.
- Verify Service handles all OTP send/check operations (no SMS quota beyond Twilio Verify pricing).

## JWT Secret
- `JWT_SECRET=unishaala-secret-key-2025` pinned in `/app/.env` for deterministic password hashing across pods.
