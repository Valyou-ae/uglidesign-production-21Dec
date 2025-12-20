# Product Requirements Document (PRD)
# Ugli AI Creative Studio

**Version:** 1.0  
**Last Updated:** December 2024  
**Product Owner:** Ugli Team

---

## 1. Executive Summary

### 1.1 Product Vision
Ugli is an AI-powered creative studio platform that democratizes professional-quality image creation for creators, entrepreneurs, and businesses. The platform enables users to generate stunning images, create product mockups, and remove backgrounds with zero design experience required.

### 1.2 Mission Statement
To empower anyone to create professional-quality visual content using AI, making design accessible, affordable, and effortless.

### 1.3 Value Proposition
- **For Creators:** Generate unique, high-quality images from text prompts in seconds
- **For E-commerce Sellers:** Create professional product mockups aligned with print-on-demand platforms
- **For Marketers:** Remove backgrounds and create social-ready content instantly
- **For Affiliates:** Earn commissions by referring new users to the platform

---

## 2. Target Users & Personas

### 2.1 Primary Personas

#### Persona 1: The Solo Creator (Sarah)
- **Demographics:** 25-35, freelance designer, tech-savvy
- **Goals:** Create unique content for clients quickly
- **Pain Points:** Limited time, expensive software subscriptions
- **Use Cases:** Generate hero images, social media graphics, concept art

#### Persona 2: The E-commerce Entrepreneur (Marcus)
- **Demographics:** 30-45, runs print-on-demand business
- **Goals:** Create professional product mockups without photography
- **Pain Points:** High cost of product photography, inconsistent quality
- **Use Cases:** Generate t-shirt mockups, mug designs, phone case previews

#### Persona 3: The Content Marketer (Alex)
- **Demographics:** 28-40, works for SMB or agency
- **Goals:** Produce visual content at scale
- **Pain Points:** Design bottlenecks, slow turnaround times
- **Use Cases:** Blog images, social posts, background removal for product shots

### 2.2 Secondary Personas

#### Persona 4: The Affiliate Partner
- **Demographics:** Influencer, blogger, or content creator
- **Goals:** Monetize audience through referrals
- **Use Cases:** Refer users, track commissions, request withdrawals

#### Persona 5: The Platform Admin
- **Demographics:** Ugli team member
- **Goals:** Manage users, track metrics, handle support
- **Use Cases:** User management, analytics, CRM operations

---

## 3. Product Features

### 3.1 Core Features (MVP)

#### 3.1.1 AI Image Generator
- **Description:** Generate images from natural language prompts using Google Gemini
- **Key Capabilities:**
  - Text-to-image generation with multiple style presets
  - Multiple aspect ratios (1:1, 16:9, 9:16, 4:3, 3:4)
  - Reference image support for guided generation
  - Voice input for prompts (Web Speech API)
  - Batch generation (1-4 images per request)
  - Image visibility controls (public/private)
  - Social sharing for public images
- **Priority:** P0 (Critical)

#### 3.1.2 Background Remover
- **Description:** Remove backgrounds from uploaded images
- **Key Capabilities:**
  - One-click background removal (Replicate API)
  - Multiple background options (transparent, solid colors, custom)
  - High-resolution output
- **Priority:** P0 (Critical)

#### 3.1.3 Elite Mockup Generator
- **Description:** Create professional product mockups with design consistency
- **Key Capabilities:**
  - 43+ product categories (Apparel, Accessories, Home & Living)
  - Lock-In Consistency System (persona, product, color, design, camera, lighting)
  - Printify/Printful aligned print areas
  - Brand style presets (Minimal, Urban, Premium, etc.)
  - Design analysis and placement optimization
  - DTG and AOP print method support
- **Priority:** P1 (High)

### 3.2 User Management Features

#### 3.2.1 Authentication & Accounts
- **Description:** Secure user authentication and profile management
- **Key Capabilities:**
  - Social login (Google, GitHub, Apple) via Replit Auth
  - Email/password authentication
  - Secure password reset flow
  - Profile customization (display name, avatar, bio)
  - Session management with 7-day expiration
- **Priority:** P0 (Critical)

#### 3.2.2 User Dashboard
- **Description:** Personal dashboard for managing creations
- **Key Capabilities:**
  - Recent creations gallery with masonry layout
  - For You personalized prompt recommendations
  - Daily Inspiration feed with curated prompts
  - Top Creators leaderboard
  - Usage statistics (images created, credits used)
- **Priority:** P0 (Critical)

### 3.3 Monetization Features

#### 3.3.1 Credit System
- **Description:** Usage-based credit system for generation
- **Key Capabilities:**
  - Credit-based usage tracking
  - Multiple credit packages
  - Plan tiers with different credit allocations
- **Priority:** P0 (Critical)

#### 3.3.2 Stripe Integration
- **Description:** Payment processing for credit purchases
- **Key Capabilities:**
  - Secure payment via Stripe
  - One-time purchases and subscriptions
  - Invoice and receipt generation
- **Priority:** P0 (Critical)

#### 3.3.3 Affiliate Program
- **Description:** Referral program for user acquisition
- **Key Capabilities:**
  - Unique referral links
  - Commission tracking and reporting
  - Withdrawal request system
  - Real-time earnings dashboard
- **Priority:** P1 (High)

### 3.4 Admin Features

#### 3.4.1 Admin Dashboard
- **Description:** Platform administration interface
- **Key Capabilities:**
  - User management (view, edit, suspend)
  - Analytics overview (users, generations, revenue)
  - Role-based access control
- **Priority:** P1 (High)

#### 3.4.2 CRM System
- **Description:** Customer relationship management for sales
- **Key Capabilities:**
  - Contact management (leads, customers)
  - Deal pipeline (stages, values, probability)
  - Activity tracking (calls, emails, tasks)
- **Priority:** P2 (Medium)

#### 3.4.3 Super Admin Dashboard
- **Description:** High-level platform metrics for executives
- **Key Capabilities:**
  - Platform-wide metrics overview
  - User growth trends (30-day charts)
  - Generation activity analytics
  - Top creators leaderboard
  - User role distribution
- **Priority:** P2 (Medium)

---

## 4. User Journeys

### 4.1 New User Onboarding
1. User lands on marketing page
2. Signs up via social login or email
3. 3-step Welcome Modal introduces features
4. User receives initial credits
5. Guided to Image Generator for first creation

### 4.2 Image Generation Flow
1. User enters prompt (text or voice)
2. Optionally adjusts settings (style, aspect ratio, quality)
3. Optionally uploads reference image
4. Clicks Generate
5. Real-time progress with AI agents status
6. Images appear in gallery as completed
7. User can download, share, remix, or save to library

### 4.3 Mockup Creation Flow
1. User uploads product design
2. Selects product category and specific product
3. Chooses brand style and customizations
4. System analyzes design and generates mockup
5. User can refine or request variations
6. Downloads final mockups

### 4.4 Affiliate Earning Flow
1. User accesses affiliate dashboard
2. Copies unique referral link
3. Shares link with audience
4. Referred users sign up and purchase
5. Commissions credited to affiliate account
6. Affiliate requests withdrawal when threshold met

---

## 5. Success Metrics

### 5.1 Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly Active Users (MAU) | 10,000+ | Unique logins per month |
| Images Generated/Day | 5,000+ | Total daily generations |
| Conversion Rate | 5%+ | Free to paid conversion |
| User Retention (D7) | 40%+ | Users returning after 7 days |
| NPS Score | 50+ | Quarterly surveys |
| Credit Usage Rate | 80%+ | Credits used vs purchased |

### 5.2 Feature-Specific Metrics

| Feature | Success Metric |
|---------|----------------|
| Image Generator | Avg. generations per user per session > 3 |
| Background Remover | 90%+ completion rate |
| Mockup Generator | <30s average generation time |
| Affiliate Program | 20%+ of new users from referrals |

---

## 6. Release Roadmap

### Phase 1: Foundation (Current)
- ✅ AI Image Generation with Gemini
- ✅ Background Removal
- ✅ User Authentication
- ✅ Credit System with Stripe
- ✅ Basic Dashboard

### Phase 2: Growth
- ✅ Elite Mockup Generator
- ✅ Affiliate Program
- ✅ Admin Dashboard
- ✅ Social Sharing

### Phase 3: Scale
- 🔄 Mobile App (React Native)
- 🔄 API Access for developers
- 🔄 Team/Enterprise accounts
- 🔄 Advanced analytics

### Phase 4: Expansion
- 📋 Video generation
- 📋 3D product visualization
- 📋 White-label solutions
- 📋 Marketplace for prompts/styles

---

## 7. Constraints & Dependencies

### 7.1 Technical Constraints
- Gemini API rate limits
- Replicate API costs per generation
- Database connection limits
- CDN bandwidth for image delivery

### 7.2 Business Constraints
- Credit system must be profitable per generation
- Affiliate commissions capped at sustainable rates
- Support capacity for user inquiries

### 7.3 External Dependencies
- Google Gemini API availability
- Replicate API for background removal
- Stripe payment processing
- Replit Auth for authentication

---

## 8. Appendix

### 8.1 Glossary
- **DTG:** Direct-to-Garment printing
- **AOP:** All-Over Print
- **Lock-In System:** Consistency system ensuring uniform mockup generation
- **SSE:** Server-Sent Events for real-time progress updates

### 8.2 Related Documents
- SRS (Software Requirements Specification)
- replit.md (Technical Architecture)
- Brand Guidelines
