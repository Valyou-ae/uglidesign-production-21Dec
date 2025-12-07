# UGLI App - Testing Checklist

Use this checklist to verify all features are working correctly.

---

## Quick Health Check (5 min)

- [ ] App loads at the home page
- [ ] Sidebar navigation works
- [ ] User is logged in (shows username in top bar)
- [ ] Dashboard stats display real numbers

---

## Authentication

### Login Page (`/login`)
- [ ] Page loads without errors
- [ ] Can enter username and password
- [ ] Login button works
- [ ] Error message shows for wrong credentials
- [ ] Redirects to home after successful login

### Signup Page (`/signup`)
- [ ] Page loads without errors
- [ ] All form fields work (name, email, password)
- [ ] Password visibility toggle works
- [ ] Submit creates new account
- [ ] Referral code field accepts affiliate codes

### Forgot Password (`/forgot-password`)
- [ ] Page loads without errors
- [ ] Email input works
- [ ] Submit shows confirmation message

---

## Main Features

### Image Generator (`/image-gen`)
- [ ] Page loads without errors
- [ ] Prompt input shows placeholder text (disappears when typing)
- [ ] Style presets are clickable
- [ ] Quality and aspect ratio options work
- [ ] Generate button initiates image creation
- [ ] Generated images display in gallery
- [ ] Download button works on images
- [ ] Like/favorite button works

### Mockup Generator (`/mockup`)
- [ ] Page loads without errors
- [ ] Step wizard displays correctly
- [ ] DTG and AOP product tabs work
- [ ] Product categories show unique icons (not all t-shirts)
- [ ] Product selection works
- [ ] Color selection works
- [ ] Design upload works
- [ ] Brand style selection works
- [ ] Angle selection works
- [ ] Generate button works
- [ ] Download mockups button works

### Background Remover (`/bg-remover`)
- [ ] Page loads without errors
- [ ] Image upload works
- [ ] Quality level selection works
- [ ] Output type selection works (transparent, white, color, blur)
- [ ] Process button initiates removal
- [ ] Before/after comparison slider works
- [ ] Download button works
- [ ] Batch mode toggle works

---

## Dashboard & Content

### Home / Dashboard (`/`)
- [ ] Page loads without errors
- [ ] Stats cards show real counts (images, mockups, bg removed)
- [ ] Quick action buttons work
- [ ] Recent creations display (if any exist)

### My Creations (`/my-creations`)
- [ ] Page loads without errors
- [ ] Filter tabs work (All, Images, Mockups, Backgrounds)
- [ ] Search input works
- [ ] View mode toggle (grid/list) works
- [ ] Sort dropdown works
- [ ] Bulk selection works
- [ ] Individual image actions work (download, delete, favorite)
- [ ] Empty state shows when no creations exist

### Discover (`/discover`)
- [ ] Page loads without errors
- [ ] Gallery displays correctly
- [ ] Categories are filterable

---

## Account & Settings

### Profile (`/profile`)
- [ ] Page loads without errors
- [ ] User info displays
- [ ] Edit profile button works
- [ ] Tabs switch correctly (Projects, Collections, About)

### Settings (`/settings`)
- [ ] Page loads without errors
- [ ] Profile settings tab works
- [ ] Form fields are editable
- [ ] Save changes button works
- [ ] Security settings tab works
- [ ] Theme toggle works
- [ ] Notification settings work

### Billing (`/billing`)
- [ ] Page loads without errors
- [ ] Current plan displays
- [ ] Credit usage bar shows accurate counts
- [ ] Change plan button opens modal
- [ ] Buy credits button opens modal

### Pricing (`/pricing`)
- [ ] Page loads without errors
- [ ] Plan comparison table displays
- [ ] Get Started buttons work
- [ ] Credit packages display
- [ ] FAQ section works

---

## Affiliate Program

### Affiliate Dashboard (`/affiliate`)
- [ ] Page loads without errors
- [ ] Affiliate code displays
- [ ] Copy code button works
- [ ] Share buttons work (email, Twitter, LinkedIn)
- [ ] Stats display (earnings, referrals)
- [ ] Withdraw button works (opens modal)

---

## Help & Support

### Help Center (`/help`)
- [ ] Page loads without errors
- [ ] Search works
- [ ] Category cards are clickable
- [ ] Articles open and display correctly
- [ ] Back navigation works

---

## Navigation & Layout

### Sidebar
- [ ] All navigation links work
- [ ] Active page is highlighted
- [ ] Collapse/expand works (if applicable)
- [ ] Logo link goes to home

### Top Bar
- [ ] Username displays correctly
- [ ] Time-based greeting shows (Good morning/afternoon/evening)
- [ ] Credit count shows
- [ ] Credits link goes to billing

### Mobile Responsiveness
- [ ] App works on mobile viewport (375px)
- [ ] Sidebar collapses on mobile
- [ ] Mobile menu works
- [ ] Touch targets are large enough

---

## API Endpoints

Test these in browser console or curl:

```bash
# Auth
curl http://localhost:5000/api/auth/me

# User stats
curl http://localhost:5000/api/user/stats

# Images list
curl http://localhost:5000/api/images

# Affiliate stats
curl http://localhost:5000/api/affiliate/stats

# Elite mockup products
curl http://localhost:5000/api/elite-mockup/products

# Elite mockup brand styles
curl http://localhost:5000/api/elite-mockup/brand-styles

# Background removal presets
curl http://localhost:5000/api/background-removal/presets
```

---

## Known Issues (To Be Addressed)

### High Priority
1. **Profile page** - Uses hardcoded mock data instead of real user data
2. **Forgot password** - No real email sending (simulated)
3. **Billing/Payments** - No real Stripe integration yet (demo mode)

### Medium Priority
1. Missing `data-testid` attributes on many interactive elements
2. Some accessibility improvements needed (aria-labels on icon buttons)
3. Password visibility toggle missing aria-label

### Low Priority
1. Voice input in image generator is simulated
2. Some hardcoded sample data in various places
3. Theme preference doesn't persist across sessions

---

## Database Health

Check that these queries return data:

```sql
-- Users exist
SELECT COUNT(*) FROM users;

-- Generated images tracked
SELECT generation_type, COUNT(*) FROM generated_images GROUP BY generation_type;

-- Affiliate commissions
SELECT COUNT(*) FROM affiliate_commissions;
```

---

## Quick Test Script

Run this in browser console to verify basic functionality:

```javascript
// Test authentication
fetch('/api/auth/me')
  .then(r => r.json())
  .then(d => console.log('Auth:', d.user ? 'Logged in as ' + d.user.username : 'Not logged in'));

// Test user stats
fetch('/api/user/stats')
  .then(r => r.json())
  .then(d => console.log('Stats:', d));

// Test elite mockup products
fetch('/api/elite-mockup/products')
  .then(r => r.json())
  .then(d => console.log('Products count:', d.products?.length));
```

---

Last Updated: December 7, 2024
