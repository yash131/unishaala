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
