# CoBuild Manager — SuperAdmin Portal

An independent Next.js SuperAdmin portal for CoBuild Manager, deployed on Vercel at `admin.cobuildmanager.com`.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **UI**: MUI v7 (cherry-picked from Modernize admin template)
- **Auth**: NextAuth.js v5 (JWT strategy) + Laravel backend JWT
- **2FA**: TOTP (Google Authenticator) + Email OTP fallback
- **State**: SWR for server state
- **Toasts**: Sonner
- **Deployment**: Vercel (no Docker)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Laravel backend running (default: `http://localhost:8181`)

### Installation

```bash
npm install
```

### Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local` to match your setup:

```
NEXT_PUBLIC_API_URL=http://localhost:8181/api
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
AUTH_SECRET=your-secret-here
```

### Development

```bash
npm run dev
```

The portal runs on [http://localhost:3001](http://localhost:3001).

### Build

```bash
npm run build
npm start
```

## Backend Requirements

The following backend changes are required (in the main `co_build_manager` repo):

1. **Run migrations**: `php artisan migrate` to create `two_factor_auth` and `super_admin_allowed_ips` tables
2. **Install Google2FA**: Already added via `composer require pragmarx/google2fa-laravel`

## Features (MVP)

- SuperAdmin-only login (email + password)
- Two-factor authentication (TOTP + email OTP fallback)
- IP whitelisting for SuperAdmin login
- Login notifications (email + in-app)
- Single session enforcement
- 30-minute inactivity timeout
- Dark/light mode toggle
- Placeholder dashboard with quick links

## Project Structure

```
src/
  app/
    (auth)/         # Auth pages (login, 2FA verify)
    (dashboard)/    # Dashboard layout + pages
    api/auth/       # NextAuth API routes
  components/
    layout/         # Sidebar, header (from Modernize)
    auth/           # Login form, 2FA forms
    shared/         # Reusable components
  lib/              # API client, auth config, constants
  types/            # TypeScript definitions
  utils/            # Theme config (from Modernize)
```

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://api.cobuildmanager.com/api`
   - `NEXTAUTH_URL` = `https://admin.cobuildmanager.com`
   - `NEXTAUTH_SECRET` = (generate a strong secret)
   - `AUTH_SECRET` = (same as NEXTAUTH_SECRET)
4. Deploy

## License

Private — CoBuild Manager
