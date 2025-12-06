# AI Creative Studio

## Overview

AI Creative Studio (branded as "Ugli") is a comprehensive SaaS platform for AI-powered creative tools. The platform enables users to generate images using AI, create product mockups for print-on-demand businesses, remove backgrounds from images, and manage their creative projects. The application features a modern, premium interface with dark/light theme support, inspired by Linear and Raycast design principles.

The platform includes user authentication, session management, affiliate program functionality, and a credit-based billing system. It's built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and caching
- Framer Motion for animations and transitions

**UI Framework:**
- shadcn/ui components (Radix UI primitives with Tailwind styling)
- Tailwind CSS v4 with custom design tokens
- Inter font as the primary typeface
- Custom animations via `tw-animate-css`

**State Management Pattern:**
- Server state managed via React Query with custom hooks (`useAuth`, `useImages`, `useAffiliate`)
- Local UI state managed with React hooks
- Session-based authentication state synchronized with backend

**Component Organization:**
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/`
- Custom hooks in `client/src/hooks/`
- Shared types and schemas in `shared/schema.ts`

**Design System:**
- Bento grid layout pattern for dashboard
- Fixed sidebar navigation (280px width)
- Responsive design with mobile breakpoint at 768px
- Consistent color tokens using CSS custom properties
- Dark/light theme toggle functionality

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- HTTP server with WebSocket support capability (createServer from 'http')
- Session-based authentication using express-session
- PostgreSQL session store (connect-pg-simple)

**Authentication & Authorization:**
- Bcrypt for password hashing
- Session-based auth with httpOnly cookies
- Auth middleware (`requireAuth`) for protected routes
- 30-day session expiration

**Database Layer:**
- Drizzle ORM for type-safe database queries
- PostgreSQL as the primary database (via @neondatabase/serverless)
- Database connection pooling with node-postgres
- Schema-first approach with Zod validation integration

**API Design:**
- RESTful API structure under `/api` prefix
- Request logging middleware with duration tracking
- JSON request/response format
- CORS and express-rate-limit ready (dependencies available)

**Image Generation:**
- Google Gemini AI integration (`@google/genai`)
- Gemini 2.0 Flash with image generation capabilities
- Prompt enhancement functionality
- Base64 image encoding for frontend delivery

**Storage Pattern:**
- Repository pattern implementation in `server/storage.ts`
- Interface-based storage abstraction (IStorage)
- Supports user management, image CRUD, affiliate operations, and withdrawal requests

### Build & Deployment

**Build Process:**
- Custom build script using esbuild for server bundling
- Vite for client-side bundling
- Dependency bundling strategy (allowlist for specific packages to reduce syscalls)
- Production build outputs to `dist/` directory
- Client assets served as static files from `dist/public`

**Development Environment:**
- Vite dev server with HMR on port 5000
- Middleware mode for Vite integration with Express
- Custom Replit plugins for development (cartographer, dev-banner, runtime-error-modal)
- Custom meta images plugin for OpenGraph image handling

**Environment Configuration:**
- `DATABASE_URL` for PostgreSQL connection
- `GEMINI_API_KEY` for AI image generation
- `SESSION_SECRET` for session encryption
- `NODE_ENV` for environment detection

### Database Schema

**Core Tables:**

1. **users** - User accounts with profile information
   - Authentication fields (username, email, password hash)
   - Profile data (displayName, firstName, lastName, bio)
   - Affiliate tracking (affiliateCode, referredBy)
   - Social links stored as JSONB

2. **generatedImages** - AI-generated and uploaded images
   - User association via foreign key
   - Image metadata (prompt, style, aspectRatio)
   - Favorite flag for user collections
   - Generation type classification

3. **affiliateCommissions** - Referral tracking and earnings
   - Links affiliate users to referred users
   - Commission amounts in cents
   - Status tracking (pending, paid)

4. **withdrawalRequests** - Payout management
   - Bank account information
   - Amount and status tracking
   - User association

5. **session** - Express session storage (managed by connect-pg-simple)

**Schema Management:**
- Drizzle Kit for migrations (output to `migrations/`)
- `db:push` script for schema synchronization
- Zod schemas generated from Drizzle tables for validation

## External Dependencies

**AI & Machine Learning:**
- Google Generative AI API (Gemini 2.0 Flash) - Image generation with text+image multimodal output

**Database:**
- Neon Serverless PostgreSQL - Serverless PostgreSQL hosting
- Drizzle ORM - Type-safe database queries and migrations

**Authentication:**
- bcrypt - Password hashing and verification
- express-session with connect-pg-simple - Session management with PostgreSQL backing

**UI Components:**
- Radix UI primitives - Accessible headless components (@radix-ui/react-*)
- Lucide React - Icon library
- Framer Motion - Animation library

**Development Tools:**
- Replit-specific plugins:
  - @replit/vite-plugin-cartographer - Code mapping
  - @replit/vite-plugin-dev-banner - Development indicators
  - @replit/vite-plugin-runtime-error-modal - Error overlay

**Additional Services (Available but Integration Status Unknown):**
- Stripe - Payment processing (dependency present)
- Nodemailer - Email functionality (dependency present)
- OpenAI - Alternative AI provider (dependency present)
- Multer - File upload handling (dependency present)

**Build Dependencies:**
- esbuild - Fast JavaScript bundler for server code
- Vite - Frontend build tool and dev server
- TypeScript - Type checking and compilation
- Tailwind CSS - Utility-first CSS framework
- PostCSS with Autoprefixer - CSS processing