# Software Requirements Specification (SRS)
# Ugli AI Creative Studio

**Version:** 1.0  
**Last Updated:** December 2024  
**Document Type:** Technical Specification

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for Ugli, an AI-powered creative studio platform. It covers functional requirements, non-functional requirements, system architecture, API specifications, and data models.

### 1.2 Scope
Ugli is a web-based SaaS platform providing:
- AI-powered image generation
- Background removal
- Product mockup generation
- User management and authentication
- Payment processing and credit system
- Affiliate program management
- Administrative dashboards

### 1.3 Definitions and Acronyms
| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| DTG | Direct-to-Garment printing |
| AOP | All-Over Print |
| SSE | Server-Sent Events |
| ORM | Object-Relational Mapping |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React 18+ SPA (TypeScript, Vite, TanStack Query)        │   │
│  │  UI: shadcn/ui + Radix UI + Tailwind CSS v4              │   │
│  │  Routing: Wouter | Animations: Framer Motion             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express.js (TypeScript)                                  │   │
│  │  Middleware: CORS, Helmet, Session, Passport              │   │
│  │  Authentication: Replit Auth (OpenID Connect)             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐    │
│  │ Image Gen  │  │ Background │  │ Elite Mockup Generator │    │
│  │ (Gemini)   │  │ Remover    │  │ (Lock-In System)       │    │
│  └────────────┘  └────────────┘  └────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (Neon Serverless)                             │   │
│  │  ORM: Drizzle | Session Store: connect-pg-simple          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                              │
│  ┌──────────┐  ┌───────────┐  ┌────────┐  ┌───────────────┐    │
│  │ Gemini   │  │ Replicate │  │ Stripe │  │ Replit Auth   │    │
│  │ API      │  │ API       │  │        │  │ (OpenID)      │    │
│  └──────────┘  └───────────┘  └────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18+ |
| Build | Vite | Latest |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| UI Components | shadcn/ui + Radix UI | Latest |
| State Management | TanStack Query | v5 |
| Routing | Wouter | Latest |
| Backend | Express.js | 4.x |
| Database | PostgreSQL | 15+ |
| ORM | Drizzle | Latest |
| Authentication | Passport.js + OpenID | Latest |
| Payments | Stripe | Latest |

---

## 3. Functional Requirements

### 3.1 User Authentication (FR-AUTH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | System shall support OAuth login via Google, GitHub, Apple | P0 |
| FR-AUTH-02 | System shall support email/password authentication | P0 |
| FR-AUTH-03 | Sessions shall expire after 7 days of inactivity | P0 |
| FR-AUTH-04 | System shall use HttpOnly cookies for session tokens | P0 |
| FR-AUTH-05 | Password reset tokens shall be bcrypt-hashed before storage | P0 |
| FR-AUTH-06 | System shall support role-based access (user, admin, moderator, super_admin) | P0 |

### 3.2 Image Generation (FR-IMG)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-IMG-01 | System shall generate images from text prompts using Gemini API | P0 |
| FR-IMG-02 | System shall support aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4 | P0 |
| FR-IMG-03 | System shall support style presets (photorealistic, anime, oil painting, etc.) | P0 |
| FR-IMG-04 | System shall support batch generation (1-4 images per request) | P1 |
| FR-IMG-05 | System shall support reference image uploads for guided generation | P1 |
| FR-IMG-06 | System shall provide real-time progress via SSE | P1 |
| FR-IMG-07 | System shall support voice input for prompts | P2 |
| FR-IMG-08 | Users shall be able to mark images as public or private | P1 |
| FR-IMG-09 | Public images shall be shareable via unique URL with OG meta tags | P1 |

### 3.3 Background Removal (FR-BG)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BG-01 | System shall remove backgrounds from uploaded images | P0 |
| FR-BG-02 | System shall support transparent background output | P0 |
| FR-BG-03 | System shall support solid color background replacement | P1 |
| FR-BG-04 | System shall use Replicate API (bria/remove-background) | P0 |

### 3.4 Elite Mockup Generator (FR-MKP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-MKP-01 | System shall support 43+ product categories | P0 |
| FR-MKP-02 | System shall implement Lock-In Consistency System | P0 |
| FR-MKP-03 | System shall align print areas with Printify/Printful specs | P0 |
| FR-MKP-04 | System shall support brand style presets | P1 |
| FR-MKP-05 | System shall analyze uploaded designs for optimal placement | P1 |
| FR-MKP-06 | System shall support DTG and AOP print methods | P1 |
| FR-MKP-07 | System shall limit to 3 concurrent jobs per user | P1 |
| FR-MKP-08 | System shall rate limit to 10 requests/minute | P0 |

### 3.5 User Dashboard (FR-DASH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DASH-01 | Dashboard shall display user's recent creations in masonry layout | P0 |
| FR-DASH-02 | Dashboard shall show personalized prompt recommendations | P1 |
| FR-DASH-03 | Dashboard shall display daily inspiration feed | P1 |
| FR-DASH-04 | Dashboard shall show top creators leaderboard | P2 |
| FR-DASH-05 | Dashboard shall display user statistics (images, credits) | P0 |

### 3.6 Credit System (FR-CREDIT)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CREDIT-01 | System shall track credit balance per user | P0 |
| FR-CREDIT-02 | System shall deduct credits upon image generation | P0 |
| FR-CREDIT-03 | System shall support multiple credit packages | P0 |
| FR-CREDIT-04 | System shall process payments via Stripe | P0 |

### 3.7 Affiliate Program (FR-AFF)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AFF-01 | System shall generate unique referral links per user | P1 |
| FR-AFF-02 | System shall track referral conversions | P1 |
| FR-AFF-03 | System shall calculate and credit commissions | P1 |
| FR-AFF-04 | System shall support withdrawal requests | P1 |
| FR-AFF-05 | System shall display earnings dashboard | P1 |

### 3.8 Admin Dashboard (FR-ADMIN)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADMIN-01 | Admin shall view all users and their details | P1 |
| FR-ADMIN-02 | Admin shall be able to suspend/unsuspend users | P1 |
| FR-ADMIN-03 | Admin shall view platform analytics | P1 |
| FR-ADMIN-04 | Admin shall access CRM for contacts and deals | P2 |
| FR-ADMIN-05 | Super admin shall view executive-level metrics | P2 |

---

## 4. Non-Functional Requirements

### 4.1 Performance (NFR-PERF)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | Page load time | < 2 seconds |
| NFR-PERF-02 | API response time (simple queries) | < 200ms |
| NFR-PERF-03 | Image generation time | < 30 seconds |
| NFR-PERF-04 | Background removal time | < 15 seconds |
| NFR-PERF-05 | Concurrent users supported | 1,000+ |

### 4.2 Security (NFR-SEC)

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | All API endpoints shall require authentication except public routes |
| NFR-SEC-02 | Passwords shall be hashed using bcrypt |
| NFR-SEC-03 | Sessions shall use HttpOnly, Secure cookies |
| NFR-SEC-04 | API shall implement rate limiting |
| NFR-SEC-05 | Input shall be sanitized to prevent XSS |
| NFR-SEC-06 | SQL injection shall be prevented via parameterized queries |
| NFR-SEC-07 | CORS shall be configured for allowed origins only |
| NFR-SEC-08 | Secrets shall never be exposed to frontend |

### 4.3 Scalability (NFR-SCALE)

| ID | Requirement |
|----|-------------|
| NFR-SCALE-01 | System shall support horizontal scaling via stateless API |
| NFR-SCALE-02 | Session store shall be database-backed for multi-instance support |
| NFR-SCALE-03 | Database connections shall be pooled |

### 4.4 Reliability (NFR-REL)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-REL-01 | System uptime | 99.5% |
| NFR-REL-02 | Data backup frequency | Daily |
| NFR-REL-03 | Retry mechanism for external API failures | 3x with exponential backoff |

### 4.5 Usability (NFR-USE)

| ID | Requirement |
|----|-------------|
| NFR-USE-01 | UI shall be responsive (mobile, tablet, desktop) |
| NFR-USE-02 | UI shall support dark and light themes |
| NFR-USE-03 | UI shall provide loading states for async operations |
| NFR-USE-04 | UI shall display clear error messages |

---

## 5. Data Models

### 5.1 Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   Users     │       │ GeneratedImages  │       │   Affiliates    │
├─────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)     │──────<│ userId (FK)      │       │ userId (FK)     │
│ email       │       │ id (PK)          │       │ referralCode    │
│ username    │       │ imageUrl         │       │ totalEarnings   │
│ role        │       │ prompt           │       └─────────────────┘
│ credits     │       │ style            │              │
│ createdAt   │       │ aspectRatio      │              │
└─────────────┘       │ isPublic         │              ▼
      │               │ createdAt        │       ┌─────────────────┐
      │               └──────────────────┘       │  Commissions    │
      │                                          ├─────────────────┤
      │                                          │ affiliateId(FK) │
      ▼                                          │ amount          │
┌─────────────┐                                  │ status          │
│  Sessions   │                                  └─────────────────┘
├─────────────┤
│ sid (PK)    │       ┌──────────────────┐       ┌─────────────────┐
│ sess        │       │   CRM_Contacts   │       │   CRM_Deals     │
│ expire      │       ├──────────────────┤       ├─────────────────┤
└─────────────┘       │ id (PK)          │──────<│ contactId (FK)  │
                      │ name             │       │ stage           │
                      │ email            │       │ value           │
                      │ status           │       │ probability     │
                      └──────────────────┘       └─────────────────┘
```

### 5.2 Core Tables

#### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  display_name VARCHAR(255),
  profile_image_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Generated Images
```sql
CREATE TABLE generated_images (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  image_url TEXT NOT NULL,
  prompt TEXT,
  style VARCHAR(50),
  aspect_ratio VARCHAR(10),
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Affiliate Commissions
```sql
CREATE TABLE affiliate_commissions (
  id SERIAL PRIMARY KEY,
  affiliate_user_id INTEGER REFERENCES users(id),
  referred_user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. API Specifications

### 6.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/login` | Initiate OAuth login flow |
| GET | `/api/callback` | OAuth callback handler |
| POST | `/api/logout` | End user session |
| GET | `/api/auth/user` | Get current authenticated user |

### 6.2 Image Generation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Generate images from prompt |
| GET | `/api/gallery` | Get public gallery images |
| GET | `/api/images` | Get user's images |
| GET | `/api/images/:id` | Get single image details |
| PATCH | `/api/images/:id` | Update image (visibility, favorite) |
| DELETE | `/api/images/:id` | Delete image |
| POST | `/api/images/:id/like` | Toggle like on image |

### 6.3 Background Removal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/remove-background` | Remove background from image |

### 6.4 Mockup Generator Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mockup/products` | List available products |
| GET | `/api/mockup/brand-styles` | List brand style presets |
| POST | `/api/mockup/analyze-design` | Analyze uploaded design |
| POST | `/api/mockup/generate` | Generate product mockup |
| POST | `/api/mockup/refine` | Refine existing mockup |

### 6.5 Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/users` | List all users | Admin |
| PATCH | `/api/admin/users/:id` | Update user | Admin |
| GET | `/api/admin/analytics` | Platform analytics | Admin |
| GET | `/api/admin/crm/contacts` | List CRM contacts | Admin |
| GET | `/api/super-admin/overview` | Executive metrics | Super Admin |

---

## 7. Interface Requirements

### 7.1 User Interface Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Landing Page | `/` | Marketing page for guests |
| Image Generator | `/image-generator` | Main generation interface |
| My Creations | `/my-creations` | User's image library |
| Profile | `/profile` | User settings and stats |
| Pricing | `/pricing` | Credit packages and plans |
| Affiliate Dashboard | `/affiliate` | Earnings and referrals |
| Admin Dashboard | `/admin` | Platform management |
| Super Admin | `/super-admin` | Executive analytics |

### 7.2 Third-Party Integrations

| Service | Purpose | Integration Type |
|---------|---------|------------------|
| Google Gemini | Image generation | REST API |
| Replicate | Background removal | REST API |
| Stripe | Payment processing | SDK + Webhooks |
| Replit Auth | Authentication | OpenID Connect |
| Nodemailer | Email sending | SMTP |

---

## 8. Quality Assurance

### 8.1 Testing Requirements

| Type | Coverage Target | Tools |
|------|-----------------|-------|
| Unit Tests | 80% | Vitest |
| Integration Tests | Core APIs | Supertest |
| E2E Tests | Critical flows | Playwright |

### 8.2 Code Quality

| Metric | Requirement |
|--------|-------------|
| TypeScript strict mode | Enabled |
| ESLint | No errors |
| No console.log in production | Enforced |

---

## 9. Deployment Requirements

### 9.1 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| GEMINI_API_KEY | Google Gemini API key | Yes |
| STRIPE_SECRET_KEY | Stripe secret key | Yes |
| STRIPE_PUBLISHABLE_KEY | Stripe public key | Yes |
| SESSION_SECRET | Express session secret | Yes |

### 9.2 Deployment Platform
- **Host:** Replit
- **Database:** Neon Serverless PostgreSQL
- **Static Assets:** Served via Express
- **Build:** Vite for client, esbuild for server

---

## 10. Appendix

### 10.1 Lock-In Consistency System (Elite Mockups)

The Lock-In System ensures mockup consistency through multiple constraint layers:

1. **Persona Lock:** Maintains consistent human models across shots
2. **Product Lock:** Enforces product specifications and proportions
3. **Color Lock:** Ensures exact color matching per product
4. **Design Lock:** Controls design placement rules (DTG vs AOP)
5. **Camera Lock:** Maintains consistent camera angles and settings
6. **Lighting Lock:** Enforces consistent lighting across variations
7. **AOP Physics Lock:** Handles fabric physics for all-over prints

### 10.2 Related Documents
- PRD (Product Requirements Document)
- replit.md (Project Documentation)
- API Documentation (OpenAPI/Swagger)
