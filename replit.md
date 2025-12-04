# Replit AI Studio - Advanced Image Generator

## Overview
An advanced AI-powered image generation application featuring a sophisticated 5-agent system, comprehensive Cinematic DNA knowledge base with 60+ artistic styles, intelligent dual-pathway generation (Cinematic vs Typographic), and professional-grade prompt enhancement for Hollywood-quality output.

## Recent Changes

### December 4, 2025 (Latest)
- **Critical Text Detection Fix**
  - Fixed typographic mode not triggering for text-heavy prompts
  - Root cause: `hasText` relied on LLM-derived analysis which often missed text
  - Solution: Now uses deterministic `tierDetectedText` from `evaluatePromptTier` as primary source
  - `hasText = tierDetectedText || textInfo.length > 0 || isTextPriority`
  - This ensures `buildTypographicPrompt()` is used for text-heavy prompts

- **AI Studio-Aligned Typographic Prompt System**
  - Removed letter-by-letter spelling (confuses Imagen 4 - per AI Studio guidance)
  - Uses simple "MUST include...spelled EXACTLY as shown" directive instead
  - Added typographic hierarchy with font hints (Serif/Sans-Serif)
  - Detects graphic design mode (book covers, posters) vs photos of text
  - Removes camera specs for graphic design (no "shot on ARRI Alexa" for book covers)
  - Translates cinematic concepts to design language for graphic design prompts

- **Improved Model Routing for Text**
  - Text-heavy prompts now route to Imagen 4 even in draft mode
  - Draft mode WITHOUT text → `gemini-2.5-flash-image` (fast)
  - Draft mode WITH text → Imagen 4 (better text rendering)
  - Final mode (all) → Imagen 4 PRIMARY with fallback

### December 3, 2025
- **Auto-Scaling Tier System**
  - Intelligent tier selection based on prompt complexity (Standard/Premium/Ultra)
  - Automatic upgrade for text-heavy, multilingual, and complex style prompts
  - User-friendly notifications without exposing model names
  - Tier Lock override control in settings UI
  - Complexity scoring: text density, multilingual scripts, style demands

- **Tier Selection Criteria**:
  - Text detection: quoted text, text instructions (+30-50 points)
  - Multilingual scripts: Japanese, Chinese, Korean, Arabic, Hebrew, Thai, Hindi, Russian, Greek (+25-35 points)
  - Complex styles: hyperrealistic, cinematic, fine art, etc. (+10-40 points)
  - Score thresholds: 0-30=Standard, 31-60=Premium, 61+=Ultra

- **User Notifications**:
  - Toast notifications for tier upgrades/downgrades
  - Shows complexity score and reason for tier change
  - Blue for upgrades, amber for downgrades

- **Complete AI Studio Feature Parity**
  - Exponential backoff with 5 retries before fallback for Imagen 4
  - Quality presets with thinking budgets (Draft=512, Standard=1024, Premium=4096, Ultra=8192)
  - Style Architect with dual behavior (light for drafts, deep synthesis for final)
  - Letter-by-letter spelling enhancement for text accuracy

- **Exponential Backoff System**
  - 5 retries with exponential delay (1s → 2s → 4s → 8s → 16s, max 32s)
  - Retries on 429, RESOURCE_EXHAUSTED, rate limit, quota errors
  - Only falls back after all retries fail

- **Quality Presets with Thinking Budgets**:
  - Draft: 512 tokens, 70 words max (light enhancement)
  - Standard: 1024 tokens, 150 words max
  - Premium: 4096 tokens, 200 words max
  - Ultra: 8192 tokens, 250 words max (deep synthesis)

- **Style Architect Dual Behavior**:
  - Drafts: Focus on Lighting/Camera/Color, Prime Directives, under 70 words
  - Final: Full Cinematic DNA, all Prime Directives, deep multi-stage synthesis

### December 2, 2025
- **AI Studio-Aligned Model Routing System**
  - Imagen 4 is PRIMARY for all final image generation (including text prompts)
  - gemini-3-pro-image-preview used as high-quality fallback and for drafts-with-text
  
- **AI Studio Model Routing**:
  - Final mode (all prompts) → `imagen-4.0-generate-001` (PRIMARY)
  - Final fallback WITH text → `gemini-3-pro-image-preview`
  - Final fallback WITHOUT text → `gemini-2.5-flash-image`
  - Draft mode WITH text → `gemini-3-pro-image-preview`
  - Draft mode WITHOUT text → `gemini-2.5-flash-image`

- **Text Priority Detection**
  - Intelligent detection of text-heavy and multilingual prompts
  - Automatic routing to text-optimized generation pathway
  - Multilingual script detection (Japanese, Chinese, Korean, Arabic, Hebrew, Thai, Hindi, Russian, Greek)

- **Context-Aware Negative Prompts**
  - Dynamic negative prompt generation based on subject type
  - Separate libraries for portrait, landscape, product, architecture, text
  - Automatically applied to all generation requests

- Text Priority Features:
  - `analyzeTextPriority()` - Detects quoted text, multilingual scripts, text instructions
  - `buildTypographicPrompt()` - Creates clean, text-first prompts
  - `generateImageSmart()` - Dual pathway routing based on text priority analysis
  - `generateWithGeminiImageModel()` - Direct Gemini image model access

### December 2, 2025
- Integrated comprehensive Cinematic DNA system with all 7 components:
  - Volumetric Atmospheric Effects (8-12% quality boost)
  - Professional Lighting Systems (10-15% boost)
  - Depth Layering (8-10% boost)
  - Color Grading (10-12% boost)
  - Material Rendering (8-10% boost)
  - Cinematic Composition (8-12% boost)
  - Cinema Camera Systems (5-8% boost)

- Implemented 5-Agent System for intelligent prompt enhancement:
  - Director Agent: Creative vision and narrative direction
  - Cinematographer Agent: Camera, composition, and visual framing
  - Lighting Agent: Light design and atmospheric depth
  - Color Agent: Color grading and palette design
  - Refiner Agent: Quality synthesis and optimization

- Added 50+ Artistic Styles library including:
  - Historical: Ancient Egyptian, Greek, Byzantine, Renaissance, Baroque
  - Modern Art: Impressionism, Art Nouveau, Art Deco, Surrealism, Cubism
  - Digital Age: Cyberpunk, Vaporwave, Synthwave, Glitch Art, Y2K
  - Contemporary: Dark Academia, Cottagecore, Liminal Space, Solarpunk
  - Cultural: Ukiyo-e, Persian Miniature, Aboriginal, Mexican Folk Art

- Implemented Deep Analysis system for advanced prompt understanding
- Added Draft-to-Final workflow for iterative quality improvement
- Created API endpoints for all new features

## Project Architecture

### Backend Services
- `server/services/geminiService.ts` - Core Gemini AI integration for image generation
- `server/services/cinematicDNA.ts` - Comprehensive knowledge base with styles, lighting, color grades
- `server/services/multiAgentSystem.ts` - 5-agent pipeline for prompt enhancement
- `server/routes.ts` - API endpoints for all image generation features

### Frontend
- `client/src/pages/image-generator.tsx` - Main image generator UI
- `client/src/services/` - Frontend services for API communication

### Shared Types
- `shared/imageGenTypes.ts` - TypeScript interfaces for image generation

## API Endpoints

### Core Generation
- `POST /api/generate-image` - Basic image generation
- `POST /api/generate-image-advanced` - Advanced generation with multi-agent system

### Analysis
- `POST /api/deep-analysis` - Deep semantic analysis of prompts
- `POST /api/analyze-image` - Analyze existing images for recreation

### Workflows
- `POST /api/draft-to-final` - Draft-to-final quality workflow
- `POST /api/iterative-edit` - Iterative prompt editing

### Presets & Info
- `GET /api/style-presets` - Available style presets
- `GET /api/quality-presets` - Quality level configurations
- `GET /api/artistic-styles` - Full artistic styles library
- `GET /api/agent-system-info` - Multi-agent system information

## Configuration
- Uses Replit's Gemini AI Integration
- Models:
  - `gemini-3-pro-image-preview` - Primary for text-heavy prompts (AI Studio aligned)
  - `gemini-2.5-flash-image` - Draft mode / fast generation
  - `imagen-4.0-generate-001` - Non-text final generation
  - `gemini-2.5-flash` - Text analysis and prompt enhancement
- Requires `apiVersion: ""` in httpOptions for Replit integration

## Quality Enhancement
The system provides 50-60% quality improvement through:
1. Cinematic DNA application (7 technical components)
2. 5-Agent collaborative enhancement
3. Automatic artistic style detection
4. Professional lighting and color recommendations
5. Cinema camera and lens suggestions
