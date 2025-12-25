# UGLI App Security Analysis

## Date: December 25, 2025

---

## 1. Image Authorization Vulnerability Analysis

### Location: `/api/images/:id/image` (server/routes/images.ts, lines 116-169)

### Current Implementation:
```typescript
app.get("/api/images/:id/image", async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest & { session?: { guestId?: string } };
  const userId = authReq.user?.claims?.sub || authReq.session?.guestId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const image = await storage.getImageById(req.params.id, userId);
  // ...
});
```

### Storage Layer (server/storage.ts, lines 333-339):
```typescript
async getImageById(imageId: string, userId: string): Promise<GeneratedImage | undefined> {
  const [image] = await db
    .select()
    .from(generatedImages)
    .where(and(eq(generatedImages.id, imageId), eq(generatedImages.userId, userId)));
  return image;
}
```

### Assessment:
✅ **PARTIALLY SECURE** - The storage layer correctly validates ownership by checking `userId` matches the image owner.

### Issues Found:
1. **Guest Session Access**: The route accepts `guestId` from session, which could allow guests to access images if they somehow obtain/guess the correct `guestId` that was used to create an image.

2. **No Public Image Fallback**: If a user tries to access a public image they don't own, they get 404 instead of being served the public image.

### Recommended Fix:
Add logic to also check if the image is public when ownership check fails.

---

## 2. Static Asset Path Exposure Analysis

### Location: server/static.ts

### Current Implementation:
- Static files are served from `public` directory
- No private assets are stored in the static path
- Images are stored as base64 in the database, not as files

### Assessment:
✅ **SECURE** - Private images are stored in the database as base64 data URLs, not as static files. The static.ts only serves the built frontend assets.

---

## 3. Guest Generation Race Condition Analysis

### Location: `/api/guest/generate-image` (server/routes/generation.ts, lines 34-72)

### Current Implementation:
```typescript
// Check if guest has already generated
const existingResult = await pool.query(
  'SELECT id FROM guest_generations WHERE guest_id = $1 LIMIT 1',
  [guestId]
);

if (existingResult.rows.length > 0) {
  return res.status(403).json({ message: "Free generation already used. Please login for more." });
}

// ... generate image ...

// Insert guest generation record using pool
await pool.query(
  'INSERT INTO guest_generations (guest_id) VALUES ($1) ON CONFLICT (guest_id) DO NOTHING',
  [guestId]
);
```

### Schema (shared/schema.ts, lines 200-204):
```typescript
export const guestGenerations = pgTable("guest_generations", {
  id: serial("id").primaryKey(),
  guestId: text("guest_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Assessment:
⚠️ **RACE CONDITION EXISTS** - There's a time gap between checking if guest exists and inserting the record. Concurrent requests could bypass the quota.

### The Issue:
1. Request A: Checks guest_id → Not found
2. Request B: Checks guest_id → Not found (before A inserts)
3. Request A: Generates image, inserts record
4. Request B: Generates image, tries to insert → ON CONFLICT DO NOTHING (but image already generated!)

### Recommended Fix:
Use database-level locking or INSERT first with immediate check:

```typescript
// Option 1: Use INSERT with RETURNING to atomically check and insert
const insertResult = await pool.query(
  `INSERT INTO guest_generations (guest_id) 
   VALUES ($1) 
   ON CONFLICT (guest_id) DO NOTHING 
   RETURNING id`,
  [guestId]
);

if (insertResult.rows.length === 0) {
  // Already exists - guest already generated
  return res.status(403).json({ message: "Free generation already used. Please login for more." });
}

// Now safe to generate - we have the lock
const result = await generateGeminiImage(prompt, [], "quality", "1:1", "draft", false);
```

---

## Summary of Fixes Required

| Issue | Severity | Status | Fix Required |
|-------|----------|--------|--------------|
| Image Authorization | HIGH | Partial | Add public image fallback |
| Static Asset Exposure | HIGH | Secure | No fix needed |
| Guest Race Condition | MEDIUM | Vulnerable | Atomic INSERT check |

---

## Files to Modify

1. `server/routes/images.ts` - Add public image fallback in `/api/images/:id/image`
2. `server/routes/generation.ts` - Fix race condition with atomic INSERT
