# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Photo Restoration HD v2 - Project Context for Claude

## Project Overview
A photo restoration SaaS application built with Next.js 15 frontend and Supabase backend, featuring AI-powered image restoration, user authentication, credit system, and payment processing via Paddle/Stripe.

## Architecture & Technology Stack
- **Frontend**: Next.js 15.1.3 with React 19, TypeScript, App Router, Turbopack
- **Styling**: Tailwind CSS with 6 custom themes (blue, purple, green, orange, sass variants)
- **UI Components**: Radix UI primitives with shadcn/ui integration
- **Backend**: Supabase (PostgreSQL with RLS, Auth with 2FA, Storage, Realtime)
- **AI Processing**: Replicate API via Supabase Edge Functions
- **Analytics**: Vercel Analytics + Google Analytics

## Directory Structure
- `nextjs/` - Next.js frontend application
- `nextjs/src/app/` - App Router pages and API routes
- `nextjs/src/components/` - React components (ui/, auth/, layout/)
- `nextjs/src/lib/` - Utilities, Supabase clients, and business logic
- `nextjs/supabase/functions/` - Edge Functions for AI processing
- `supabase/migrations/` - Database schema and migrations

## Development Commands
```bash
cd nextjs/
npm run dev      # Development server with Turbopack
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint checking
```

## Core Architecture Patterns

### Authentication & Authorization
- Multi-factor authentication (TOTP) with `MFASetup`/`MFAVerification` components
- Unified `SassClient` wrapper around Supabase for consistent auth patterns
- Server-side and client-side auth patterns with middleware protection
- Row Level Security (RLS) policies for all database tables

### File Processing Pipeline
1. Upload to `files` bucket via `/app/storage` page
2. API route `/api/restore-photo` validates ownership and triggers Edge Function
3. Edge Function `/supabase/functions/restore-photo` processes via Replicate API
4. Webhook stores results in `restored-images` bucket
5. Status updates via polling mechanism when jobs are active

### Component Architecture
- **Layout Components**: `AppLayout` (dashboard), root layout (marketing)
- **Business Components**: Located in `src/components/` (not `ui/`)
- **UI Primitives**: shadcn/ui components in `src/components/ui/`
- **Theme System**: Environment-controlled via `NEXT_PUBLIC_THEME`

### Database Design
**Core Tables**: `processing_jobs`, `saved_images`, `galleries`, `user_credits`
**Payment Tables**: `credit_purchases`, `stripe_customers`, `stripe_orders`, `stripe_subscriptions`
**Storage Buckets**: `files` (uploads), `restored-images` (processed results)

## Key Configuration
- **Theme Control**: `NEXT_PUBLIC_THEME` environment variable (defaults to "theme-orange")
- **Pricing Config**: Environment variables for credit tiers and feature flags
- **React Strict Mode**: Disabled (`reactStrictMode: false`) for compatibility
- **Development**: Uses Turbopack with memory optimizations

## Important Implementation Notes
- All database operations use the unified `SassClient` pattern
- File ownership validation required before processing operations
- Credit system integration with all AI processing endpoints
- Job status updates via efficient polling when active jobs exist
- Environment-based URL configuration for multi-stage deployments

## Security Patterns
- RLS policies on all user-scoped tables
- JWT-based auth with refresh token rotation
- Server-side file ownership validation
- Separate admin client for privileged operations
- Storage bucket policies for granular access control