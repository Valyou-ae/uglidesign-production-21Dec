# Overview

Ugli is an AI-powered creative studio platform that enables users to generate images, create product mockups, and remove backgrounds from images. The application follows a modern SaaS architecture with a full-stack TypeScript implementation, featuring a React frontend with shadcn/ui components and an Express backend with PostgreSQL database storage.

The platform includes user authentication, affiliate program management, credit-based usage tracking, and multiple creative tools organized in a dashboard-style interface. The design emphasizes a clean, minimal aesthetic with dark/light theme support and responsive layouts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and caching

**UI Component System**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS v4 with CSS variables for theming
- Custom design tokens for colors, spacing, and typography
- Framer Motion for animations and transitions
- Outfit font family as the primary typeface (UGLI brand)

**UGLI Brand Colors**
- Primary (Rust): #B94E30 - CTAs, headlines, key UI elements
- Secondary (Gold): #E3B436 - Accents, success states (sparingly)
- Text (Brown): #664D3F - Body text, subheadings
- Neutrals: #333333 (dark gray), #999999 (medium gray), #F5F5F5 (light gray)

**State Management Pattern**
- Server state managed via TanStack Query with custom hooks
- Local UI state with React useState/useReducer
- Session-based authentication state synchronized with backend
- Custom hooks pattern (use-auth, use-images, use-affiliate, use-settings) for feature-specific logic

**Design System Decisions**
- Two-panel layout: Fixed sidebar (280px) + scrollable main content
- Bento grid layout pattern for dashboard cards
- Consistent color system with semantic tokens (primary, secondary, muted, accent, destructive)
- Dark/light theme support via CSS custom properties
- Mobile-responsive with breakpoint at 768px

## Backend Architecture

**Server Framework**
- Express.js with TypeScript
- HTTP server with middleware-based request handling
- Custom logging middleware for request/response tracking
- Session-based authentication (no JWT tokens)

**Database Layer**
- PostgreSQL as primary database
- Drizzle ORM for type-safe database queries
- Schema-first approach with migrations in `/migrations`
- Connection pooling via node-postgres (pg)

**Session Management**
- express-session with connect-pg-simple for PostgreSQL session store
- 30-day session expiration
- HttpOnly cookies with SameSite=lax for CSRF protection
- Test mode bypass for development (TEST_MODE environment variable)

**Authentication Strategy**
- Username/email + password authentication
- bcrypt for password hashing (cost factor 10)
- Session-based, not token-based
- Middleware-based route protection (requireAuth)
- Referral tracking via affiliate codes

**Data Models**
- Users: Authentication, profile, affiliate code
- Generated Images: User creations with favorites, prompt history
- Affiliate Commissions: Referral tracking and earnings
- Withdrawal Requests: Payout management for affiliates

**Storage Pattern**
- Repository pattern via IStorage interface
- DatabaseStorage implementation for PostgreSQL operations
- Separation of concerns: routes.ts handles HTTP, storage.ts handles data access

## External Dependencies

**Database**
- PostgreSQL (via @neondatabase/serverless connector)
- Drizzle ORM for schema management and queries
- connect-pg-simple for session persistence

**UI Libraries**
- Radix UI for accessible component primitives (30+ components)
- Tailwind CSS v4 with @tailwindcss/vite plugin
- Lucide React for icon system
- Framer Motion for animations

**Development Tools**
- Vite for frontend build and HMR
- esbuild for server bundling in production
- TypeScript with strict mode enabled
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)

**Build & Deployment**
- Custom build script (`script/build.ts`) that:
  - Bundles server with esbuild (allowlist for critical deps)
  - Builds client with Vite
  - Outputs to `/dist` directory
- Static file serving in production mode
- Environment-based configuration (NODE_ENV)

**Asset Management**
- Static assets served from `client/public`
- Attached assets in `/attached_assets` for design specifications
- Custom Vite plugin for OpenGraph meta tag updates (vite-plugin-meta-images.ts)

**Third-Party Services**
- Google Gemini API for AI image generation
- Stripe for payment processing (imports present in dependencies)
- Email service via nodemailer (listed in dependencies)

## Elite Mockup Generator (Lock-In System)

**Architecture**
- Location: `server/services/eliteMockupGenerator.ts`
- Knowledge Base: `server/services/knowledge/` (13 modules)
- Types: `shared/mockupTypes.ts`

**Lock-In Consistency System**
The Elite Mockup Generator uses a multi-lock approach to ensure consistent, high-quality mockups:

1. **Persona Lock** - For wearable products, generates a passport-style headshot first as a visual anchor. All subsequent mockups must feature this EXACT same person. Includes:
   - Unified persona library (48 personas across 3 age groups)
   - Somatic profiles (body type by age/sex/ethnicity/size)
   - Ethnic feature integration (hair/eye colors, styles)

2. **Product Lock** - Enforces product specifications:
   - Product ID, name, category, type
   - Print method (DTG or AOP)
   - Material condition (Brand New, Lived In, Vintage)

3. **Color Lock** - Exact color matching:
   - Product base color (hex code)
   - Design color preservation
   - AOP accent colors

4. **Design Lock** - Design application rules:
   - DTG: Direct-to-garment print following contours
   - AOP: Seamless edge-to-edge sublimation

5. **Camera/Pose Lock** - Consistent camera settings:
   - Lens type, focal length, aperture
   - 5 angle presets (front, three-quarter, side, closeup, size-chart)

6. **Lighting Lock** - Consistent lighting across shots:
   - 11 lighting presets (6 studio, 5 natural)
   - Color temperature, light ratios

7. **AOP Physics Locks** (for All-Over Print):
   - Construction Lock: Seamless panel alignment
   - Scale Lock: Physical units (not percentage)
   - Physics Lock: Fabric drape and contour conformity

**Knowledge Base Modules**
- `brandStyles.ts` - 5 brand style presets
- `productAngleDetails.ts` - Camera specs for 5 angles
- `negativePrompts.ts` - AI artifact prevention
- `contourDistortion.ts` - Body contour mapping
- `lightingSetups.ts` - Studio/natural lighting
- `materialRealism.ts` - Fabric physics, print methods
- `somaticProfiles.ts` - Body type generator
- `productBlueprints.ts` - Product specs for 43 products (8 Apparel, 12 Accessories, 23 Home & Living)
- `humanRealism.ts` - Photorealism checklist
- `ethnicFeatures.ts` - Cultural appearance traits
- `names.ts` - Name library by ethnicity/sex
- `unifiedPersonas.ts` - 48 character personas

**Product Categories (POD-Industry Standard)**
- **Apparel (8)**: T-shirts (DTG), hoodies, sweatshirts, leggings (AOP), joggers (AOP)
- **Accessories (12)**: Tote bags, backpacks, phone cases, laptop sleeves, mouse pads, socks, flip flops, face masks
- **Home & Living (23)**: Mugs, tumblers, water bottles, posters (5 sizes), framed posters (5 sizes), canvas, blankets, pillows, notebooks, postcards, stickers, magnets, coasters

All products include:
- Print area dimensions aligned with Printify/Printful standards
- Pixel dimensions at 300 DPI (150 DPI for large home decor)
- Construction blueprints (materials, print methods, special considerations)
- Available colors per product type

**Queue System**
- 3 concurrent jobs maximum
- 10 requests per minute rate limit
- 3x auto-retry with exponential backoff
- SSE streaming for progress updates

**API Endpoints**
- `GET /api/elite-mockup/products` - List all products (DTG, AOP, Accessories, Home & Living)
- `GET /api/elite-mockup/brand-styles` - List brand styles
- `POST /api/elite-mockup/analyze` - Analyze design image
- `POST /api/elite-mockup/generate` - Generate mockup batch (SSE)
- `POST /api/elite-mockup/refine` - Refine existing mockup

**Notable Architectural Decisions**
- Monorepo structure with shared schema (`/shared/schema.ts`)
- Path aliases for clean imports (@/, @shared/, @assets/)
- Separation of client and server code with shared types
- Production builds use single CJS bundle for server (reduced cold start)
- Session store in database (not in-memory) for horizontal scaling

## SaaS Features

**Onboarding**
- WelcomeModal component: 3-step tour shown only on home/dashboard page
- localStorage flag `ugli_onboarding_complete` tracks completion
- Non-blocking: navigating directly to modules skips onboarding

**Pricing & Billing**
- `/pricing` route: Plan tiers (Free/Pro/Business) with credit packages
- `/billing` route: Current plan, credit usage, payment method, invoices
- Credit display in TopBar header with link to billing

**Empty States**
- Reusable EmptyState component for creations, mockups, backgrounds
- Brand-styled with appropriate icons and CTAs

**Marketing Landing Page**
- `/landing` route: Hero, features, pricing preview, testimonials, FAQ
- Responsive header with mobile menu
- UGLI brand styling throughout

**Background Remover**
- Replicate API integration (bria/remove-background)
- Supports transparent, white, solid color, blur, and custom background options
- Base64 image processing pipeline

# Recent Changes

## December 7, 2024 - Database Integration Audit

**Fixed Issues**
- Fixed broken href="#" links in login, forgot-password, and landing pages (now point to /help)
- Connected TopBar to display real username from auth context (dynamic time-of-day greeting)
- Connected BentoGrid stats to real database counts via /api/user/stats endpoint
- Updated Billing page to use real usage stats with demo mode for payment/subscription data
- Removed all MOCK_ITEMS from My Creations - now exclusively displays database images

**Schema Updates**
- Added `generationType` field to generated_images table to distinguish between "image", "mockup", and "bg-removed" types
- Default value ensures backward compatibility with existing records

**New API Endpoints**
- `GET /api/user/stats` - Returns imageCount, mockupCount, bgRemovedCount for authenticated user

**Storage Interface Updates**
- Added `getUserStats(userId)` method to IStorage interface
- Implemented in DatabaseStorage with efficient COUNT queries by generationType

**Next Steps**
- Ensure all image creation flows populate generationType field for accurate tracking
- Add /help page or redirect
- Create Stripe products/prices in Stripe Dashboard for subscriptions and credit packages

## December 7, 2024 - Stripe Payment Integration

**Stripe Integration Files**
- `server/stripeClient.ts` - Credential fetching via Replit connectors, Stripe client initialization, StripeSync setup
- `server/webhookHandlers.ts` - Webhook payload processing using stripe-replit-sync
- `server/stripeService.ts` - Business logic for customer creation, checkout sessions, portal sessions, data queries from stripe schema tables

**Server Updates**
- `server/index.ts` - Stripe initialization with schema migration, managed webhook setup, sync backfill
- Webhook route registered before express.json() middleware to preserve raw body for signature verification

**New Stripe API Endpoints**
- `GET /api/stripe/config` - Returns publishable key for frontend
- `GET /api/stripe/products` - Lists products with prices from synced Stripe data
- `POST /api/stripe/create-checkout-session` - Creates Stripe checkout session with customer creation/retrieval
- `POST /api/stripe/create-portal-session` - Opens Stripe customer portal for subscription management
- `GET /api/stripe/subscription-status` - Queries active subscriptions directly from Stripe API

**Schema Updates**
- Added `stripeCustomerId` and `stripeSubscriptionId` fields to users table

**Storage Updates**
- Added `updateStripeCustomerId(userId, stripeCustomerId)` method
- Added `updateStripeSubscriptionId(userId, stripeSubscriptionId)` method

**Frontend (billing.tsx)**
- Connected to real Stripe API endpoints for products, checkout, portal, and subscription status
- Displays actual subscription data when available
- Handles checkout success/canceled URL parameters
- Loading states and error handling with toast notifications

**Security Measures**
- Price ID validation (must start with 'price_')
- Mode validation (only 'subscription' or 'payment' allowed)
- Customer created lazily on first checkout
- Subscription status queries Stripe directly to ensure accuracy