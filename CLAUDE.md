# Photo Restoration HD v2 - Project Context for Claude

## Project Overview
A photo restoration application built with Next.js frontend and Supabase backend, featuring user authentication, file storage, and payment processing via Paddle.

## Directory Structure
- `nextjs/` - Next.js frontend application
- `supabase/` - Database migrations and configuration

## Key Technologies
- **Frontend**: Next.js 15.1.3, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payment**: Paddle integration
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS with custom animations

## Development Commands
```bash
cd nextjs/
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Key Features
- User authentication with 2FA support
- File upload and storage management
- Payment processing and subscription management
- Legal document management (privacy, terms, refunds)
- Responsive UI with modern components

## Important Files
- `nextjs/src/app/` - Main application pages and API routes
- `nextjs/src/components/` - Reusable React components
- `nextjs/src/lib/` - Utility functions and Supabase clients
- `supabase/migrations/` - Database schema and updates

## Notes
- Uses App Router (Next.js 13+ pattern)
- Supabase handles authentication, database, and file storage
- Payment processing through Paddle SDK
- TypeScript throughout the codebase