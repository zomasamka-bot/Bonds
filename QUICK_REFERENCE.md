# Bonds Application - Quick Reference Card

**Domain:** bonds.pi  
**Version:** 1.0.0  
**Framework:** Next.js 15 + TypeScript + Tailwind CSS v4

---

## Project Structure

```
/app
  page.tsx                 → Dashboard
  /create/page.tsx         → Create bond intent
  /status/[id]/page.tsx    → View evidence pack

/lib
  bonds-config.ts          → Single source of truth (MODIFY HERE)
  bond-store.ts            → State management + sync
  types.ts                 → TypeScript types

/components
  app-header.tsx           → Header with app identity
  app-footer.tsx           → Footer with domain
  loading-state.tsx        → Loading screens
  error-state.tsx          → Error displays
  empty-state.tsx          → Empty data states
```

---

## Key Files to Modify

### 1. Add/Change Bond Types

**File:** `/lib/bonds-config.ts`

```typescript
bondTypes: [
  { value: "municipal", label: "Municipal Bond", description: "..." },
  { value: "corporate", label: "Corporate Bond", description: "..." },
  // ADD MORE HERE
],
```

### 2. Change Validation Rules

**File:** `/lib/bonds-config.ts`

```typescript
validation: {
  minAmount: 1000,          // Minimum bond amount
  maxAmount: 1000000000,    // Maximum bond amount
  minCouponRate: 0,         // Minimum interest rate
  maxCouponRate: 20,        // Maximum interest rate
  requiredFields: ["bondType", "issuer", "amount", "maturityDate", "couponRate"],
},
```

### 3. Change App Identity

**File:** `/lib/bonds-config.ts`

```typescript
identity: {
  name: "Bonds",                    // App name
  domain: "bonds.pi",               // Domain
  version: "1.0.0",                 // Version number
  tagline: "Institutional Records System",
  description: "...",
},
```

---

## Common Tasks

### Start Development Server

```bash
npm run dev
```
Visit: http://localhost:3000

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
vercel --prod
```

### Test Cross-Tab Sync

1. Open http://localhost:3000 in Tab A
2. Open http://localhost:3000 in Tab B
3. Create intent in Tab A
4. Watch Tab B update automatically

---

## State Management Functions

### Create Bond Intent

```typescript
import { createBondIntent } from "@/lib/bond-store";

const intent: BondIntent = {
  id: "BOND-123...",
  referenceId: "BOND-123...",
  bondType: "municipal",
  issuer: "City Authority",
  amount: "1,000,000",
  maturityDate: "2030-12-31",
  couponRate: "4.5",
  notes: "Optional notes",
  status: "recorded",
  timestamp: new Date().toISOString(),
  walletSignature: "0x...",
  username: "User",
  manifestData: { /* ... */ },
  runtimeLog: [],
};

createBondIntent(intent);
```

### Get Bond Intent

```typescript
import { getBondIntent } from "@/lib/bond-store";

const intent = getBondIntent("BOND-123...");
```

### Get All Intents

```typescript
import { getAllBondIntents } from "@/lib/bond-store";

const intents = getAllBondIntents();
```

### Get Statistics

```typescript
import { getStatistics } from "@/lib/bond-store";

const stats = getStatistics();
// Returns: { total, pending, approved, recorded }
```

### Subscribe to Changes

```typescript
import { subscribeToStorageChanges, initializeStorageSync } from "@/lib/bond-store";

useEffect(() => {
  initializeStorageSync();  // Initialize cross-tab sync
  
  const refreshData = () => {
    // Your refresh logic
  };
  
  const unsubscribe = subscribeToStorageChanges(refreshData);
  
  return () => unsubscribe();  // Cleanup
}, []);
```

---

## Debugging

### View Debug Logs

Open browser console and filter by `[v0]`:

- `[v0] Bond intent created: BOND-123...`
- `[v0] Cross-tab storage change detected`
- `[v0] Dashboard data refreshed`
- `[v0] Storage listener subscribed`

### Check localStorage

1. Open DevTools → Application → Local Storage
2. Look for key: `bonds_intents_v1`
3. Value is JSON array of all intents

### Test Storage Events

```javascript
// In browser console
window.addEventListener('storage', (e) => {
  console.log('Storage event:', e.key, e.newValue);
});
```

---

## Configuration Reference

### Bond Types (6 Default)

- `municipal` - Municipal Bond
- `corporate` - Corporate Bond
- `treasury` - Treasury Bond
- `infrastructure` - Infrastructure Bond
- `green` - Green Bond
- `social` - Social Bond

### Status Types (4 Default)

- `pending` - Awaiting review (secondary badge)
- `approved` - Intent approved (default badge)
- `rejected` - Intent rejected (destructive badge)
- `recorded` - Successfully recorded (default badge)

### Validation Defaults

- Min Amount: 1,000 Pi
- Max Amount: 1,000,000,000 Pi
- Min Coupon Rate: 0%
- Max Coupon Rate: 20%

---

## URLs & Routes

### Development

- Dashboard: http://localhost:3000
- Create: http://localhost:3000/create
- Status: http://localhost:3000/status/BOND-123...

### Production (after deployment)

- Dashboard: https://bonds.pi
- Create: https://bonds.pi/create
- Status: https://bonds.pi/status/BOND-123...

---

## Component Props

### AppHeader

```typescript
<AppHeader 
  title="Page Title"           // Optional, defaults to "Bonds"
  subtitle="Page Subtitle"      // Optional, defaults to tagline
  showBack={false}              // Optional, show back button
  onMenuClick={() => {}}        // Optional, menu button handler
/>
```

### LoadingState

```typescript
<LoadingState 
  message="Loading data..."     // Loading message
/>
```

### ErrorState

```typescript
<ErrorState 
  title="Error Title"           // Error heading
  message="Error details"       // Error description
  onBack={() => router.push('/')} // Back handler
/>
```

### EmptyState

```typescript
<EmptyState />  // No props, shows standard empty message
```

---

## Environment Variables

### Required for Production

None required - app works standalone with localStorage.

### Optional for Enhanced Features

- `PI_API_KEY` - Pi Network API key (future use)
- `DATABASE_URL` - Database connection (when migrating)
- `NEXTAUTH_SECRET` - Auth secret (if adding NextAuth)

---

## Testing Checklist

### Quick Test (5 minutes)

- [ ] Dashboard loads
- [ ] Create button works
- [ ] Form submits successfully
- [ ] Status page displays
- [ ] Back buttons work

### Full Test (15 minutes)

- [ ] All bond types selectable
- [ ] Form validation works
- [ ] Required fields enforced
- [ ] Amount validation correct
- [ ] Copy to clipboard works
- [ ] Export JSON works
- [ ] Cross-tab sync works
- [ ] Mobile responsive

### Cross-Tab Test (5 minutes)

- [ ] Open 2 tabs
- [ ] Create in Tab A
- [ ] Tab B updates automatically
- [ ] Statistics sync across tabs
- [ ] No duplicate data

---

## Deployment Checklist

### Pre-Deploy

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All tests pass
- [ ] Documentation updated

### Deploy

- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Test production URL
- [ ] Verify all pages load
- [ ] Check mobile responsiveness

### Post-Deploy

- [ ] Submit to Pi Developer Portal
- [ ] Request bonds.pi domain
- [ ] Provide testing instructions
- [ ] Monitor for issues

---

## Common Issues & Solutions

### Issue: Tab B doesn't update when Tab A creates intent

**Solution:**
1. Check if `initializeStorageSync()` is called
2. Verify localStorage is enabled
3. Check console for errors
4. Confirm same origin

### Issue: Form validation not working

**Solution:**
1. Check `BONDS_APP_CONFIG.validation` rules
2. Verify required fields array
3. Check browser console for errors
4. Ensure form fields have correct names

### Issue: Status page shows 404

**Solution:**
1. Verify reference ID is correct
2. Check localStorage has the intent
3. Confirm URL format: `/status/BOND-123...`
4. Check console for loading errors

### Issue: Icons not showing

**Solution:**
1. Check `/public/icon-192.png` exists
2. Check `/public/icon-512.png` exists
3. Verify `manifest.json` paths
4. Clear browser cache

---

## Performance Tips

### Optimize for Many Intents

If you have 1000+ intents:

```typescript
// In bond-store.ts, add pagination
export function getAllBondIntents(page = 1, limit = 20) {
  const all = /* ... get from storage ... */;
  const start = (page - 1) * limit;
  return all.slice(start, start + limit);
}
```

### Throttle Storage Events

For high-frequency updates:

```typescript
// In bond-store.ts
let syncTimeout: NodeJS.Timeout | null = null;

function triggerStorageEvent() {
  if (syncTimeout) return;
  
  syncTimeout = setTimeout(() => {
    // ... trigger event
    syncTimeout = null;
  }, 100);
}
```

---

## File Sizes

- Total Code: ~3,500 lines
- Documentation: ~3,000 lines
- localStorage per intent: ~500 bytes
- 100 intents: ~50KB storage
- Build size: ~500KB

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 88+ | ✅ Full |
| Firefox | 85+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 88+ | ✅ Full |
| Pi Browser | Latest | ✅ Full |

---

## Key Contacts

- **Pi Developer Portal:** https://develop.pi/
- **Pi Documentation:** https://developers.minepi.com/
- **Vercel Support:** https://vercel.com/support
- **Next.js Docs:** https://nextjs.org/docs

---

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Deploy to Vercel
vercel --prod

# Check TypeScript
npx tsc --noEmit

# Check linting
npm run lint
```

---

## Version History

**v1.0.0** (January 2025)
- Initial production release
- One-Action Flow implemented
- Cross-tab synchronization
- Complete evidence pack
- Pi Browser optimized
- Documentation complete

---

**For detailed information, see:**
- `README.md` - Complete overview
- `DEPLOYMENT.md` - Deployment guide
- `TESTING_CHECKLIST.md` - Testing procedures
- `CROSS_TAB_SYNCHRONIZATION.md` - Sync details
- `COMPLETION_SUMMARY.md` - Full summary

---

**Quick Reference v1.0.0** - Last updated: January 2025
