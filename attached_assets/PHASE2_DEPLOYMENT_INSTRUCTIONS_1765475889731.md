# Phase 2 Bug Fixes - Deployment Instructions

## Overview
These changes add comprehensive input validation without modifying UI or core functionality.

## Changes Made

### 1. `shared/schema.ts`
Added new validation schemas:
- `uuidSchema` - Validates UUID format for :id parameters
- `promptSchema` - Validates generation prompts (1-2000 chars, trimmed)
- `guestGenerationSchema` - Validates guest ID + prompt
- `createMoodBoardSchema` - Validates mood board name (max 100 chars) + description (max 500 chars)
- `updateRoleSchema` - Validates admin role updates (user/admin/moderator)
- `generationOptionsSchema` - Validates style presets, aspect ratios, etc.
- `backgroundRemovalOptionsSchema` - Validates BG removal options

### 2. `server/routes.ts`
Applied validation to these endpoints:
- `POST /api/guest/generate-image` - Now validates guestId format + prompt length
- `POST /api/generate/analyze` - Now validates prompt (1-2000 chars)
- `POST /api/generate/draft` - Now validates prompt
- `PATCH /api/images/:id/favorite` - Now validates UUID format
- `DELETE /api/images/:id` - Now validates UUID format
- `POST /api/gallery/:imageId/like` - Now validates UUID format
- `DELETE /api/prompts/favorites/:id` - Now validates UUID format
- `POST /api/mood-boards` - Now validates name length + description
- `GET /api/mood-boards/:id` - Now validates UUID format
- `PATCH /api/mood-boards/:id` - Now validates UUID + content length
- `DELETE /api/mood-boards/:id` - Now validates UUID format
- `PATCH /api/admin/users/:id/role` - Now validates UUID + role enum

---

## Deployment Steps

### Step 1: Replace Files
Replace these files with the new versions:
- `shared/schema.ts` → Use `shared_schema.ts`
- `server/routes.ts` → Use `server_routes_phase2.ts`

**Note:** `server_routes_phase2.ts` includes ALL changes from Phase 1 + Phase 2. If you haven't deployed Phase 1 yet, this single file covers both phases.

### Step 2: Restart the App
Click "Stop" then "Run" in Replit, or in Shell:
```bash
npm run dev
```

---

## What Each Validation Does

### UUID Validation
- Prevents SQL injection via malformed IDs
- Returns 400 "Invalid ID format" for non-UUID strings
- Applies to: images, mood boards, prompt favorites, gallery likes, admin user management

### Prompt Validation  
- Max 2000 characters (prevents abuse)
- Trims whitespace
- Must be non-empty
- Returns clear error: "Prompt must be less than 2000 characters"

### Guest Generation Validation
- guestId must be 10-100 chars, alphanumeric + underscore + hyphen only
- Prevents injection attacks in guest tracking

### Mood Board Validation
- Name: 1-100 characters, required, trimmed
- Description: 0-500 characters, optional, trimmed

### Role Validation
- Only allows: "user", "admin", "moderator"
- Returns: "Invalid role. Must be one of: user, admin, moderator"

---

## Error Response Examples

**Invalid UUID:**
```json
{
  "message": "Invalid image ID format"
}
```

**Prompt too long:**
```json
{
  "message": "Prompt must be less than 2000 characters"
}
```

**Invalid guest ID:**
```json
{
  "message": "Invalid input",
  "errors": ["Invalid guest ID format"]
}
```

**Mood board name too long:**
```json
{
  "message": "Name must be less than 100 characters"
}
```

---

## Testing Checklist

After deployment, verify:

- [ ] Image generation still works
- [ ] Guest generation still works (test with valid ID)
- [ ] Mood board creation works
- [ ] Mood board update/delete works
- [ ] Image favorite toggle works
- [ ] Gallery like works
- [ ] Admin role update works

### Test Invalid Inputs

```bash
# Test invalid UUID (should return 400)
curl -X DELETE https://your-app.replit.app/api/images/not-a-uuid

# Test long prompt (should return 400)
curl -X POST https://your-app.replit.app/api/generate/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "'$(python3 -c "print('a'*3000))'"}' 
```

---

## Files Included
1. `shared_schema.ts` → Replace `shared/schema.ts`
2. `server_routes_phase2.ts` → Replace `server/routes.ts`
3. `PHASE2_DEPLOYMENT_INSTRUCTIONS.md` (this file)

## Compatibility Note
`server_routes_phase2.ts` includes Phase 1 changes. If deploying Phase 1 + Phase 2 together, you only need:
- `server/index.ts` from Phase 1
- `shared/schema.ts` from Phase 2
- `server/routes.ts` from Phase 2

And run: `npm install helmet --save`
