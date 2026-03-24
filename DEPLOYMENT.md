# Bonds App - Pi Network Deployment Guide

## Application Overview

**Name:** Bonds  
**Domain:** bonds.pi  
**Version:** 1.0.0  
**Category:** Institutional Finance  

**Description:**  
Institutional records application to document and track bond issuance or allocation intents within governance frameworks on the Pi Network. No financial execution or asset custody. Approval via wallet signature only.

---

## Architecture

### Unified Core Engine

The application is built using a unified configuration-driven architecture:

- **Configuration File:** `/lib/bonds-config.ts`
- **Behavior:** All app behavior, bond types, validation rules, and workflow steps are defined in configuration
- **Scalability:** Easy to extend with new bond types, validation rules, or workflow changes

### One-Action App Flow

```
Open → Create Bond Intent → Wallet Signature → Status/Evidence Pack
```

Clear, linear workflow optimized for institutional use and testing.

---

## Key Features

### 1. Institutional Dashboard
- Real-time statistics (Total, Pending, Approved)
- Recent bond intents list
- Professional, neutral UI design
- Mobile-first responsive layout

### 2. Bond Creation Form
- Structured fields for bond details
- Multiple bond types (Municipal, Corporate, Treasury, Infrastructure, Green, Social)
- Validation based on configuration rules
- Wallet signature integration

### 3. Evidence Pack / Status View
Complete audit trail including:
- Reference ID (unique identifier)
- Timestamp (ISO 8601 format)
- Wallet Signature (cryptographic proof)
- Runtime Log (execution trace)
- Manifest (app version, environment, release tag)
- Bond Details (all submitted information)

---

## Technical Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Authentication:** Pi Network SDK
- **Storage:** localStorage (testing/review), ready for database integration

---

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure the following are configured in your Pi Developer Portal:

- `PI_NETWORK_CONFIG.SANDBOX` - Set to `false` for production
- Pi SDK is loaded from official CDN
- Backend URLs point to production endpoints

### 2. Manifest Configuration
The app includes `/public/manifest.json` with:
- App name, description, icons
- PWA configuration for Pi Browser
- Proper theme colors and display mode

### 3. Metadata & SEO
- HTML title set to "Made with App Studio"
- Meta description includes full app purpose
- Theme color configured for Pi Browser
- Viewport settings optimized for mobile

### 4. Testing Requirements

#### Must Test in Pi Browser:
1. **Authentication Flow**
   - Open app in Pi Browser
   - Verify Pi SDK loads correctly
   - Confirm wallet authentication works

2. **Bond Creation**
   - Fill out complete bond intent form
   - Submit and verify signature request
   - Confirm navigation to status page

3. **Evidence Pack Display**
   - Verify all sections render correctly
   - Check reference ID is copyable
   - Confirm runtime log shows all steps
   - Validate manifest shows correct version and release tag

4. **Mobile Responsiveness**
   - Test on mobile viewport
   - Verify all cards stack properly
   - Confirm buttons are touchable
   - Check text is readable at all sizes

---

## Domain Approval Process

### Step 1: Submit to Pi Developer Portal
1. Build and deploy application to hosting provider
2. Navigate to Pi Developer Portal
3. Submit app with domain request: `bonds.pi`
4. Include category: **Institutional Finance**

### Step 2: Review Checklist
Reviewers will verify:
- ✅ App loads in Pi Browser
- ✅ Authentication with Pi Network works
- ✅ Core functionality (create bond intent) works
- ✅ No financial transactions occur
- ✅ Professional UI appropriate for institutional use
- ✅ Mobile-responsive design
- ✅ Evidence pack displays complete audit trail

### Step 3: Domain Approval
- Wait for Pi Network team review
- Respond to any feedback or requested changes
- Once approved, `bonds.pi` domain will be assigned

---

## Configuration & Customization

### Adding New Bond Types
Edit `/lib/bonds-config.ts`:

```typescript
bondTypes: [
  // Add new type here
  { value: "sustainable", label: "Sustainable Bond", description: "For sustainability projects" },
]
```

### Modifying Validation Rules
Edit `/lib/bonds-config.ts`:

```typescript
validation: {
  minAmount: 1000,
  maxAmount: 1000000000,
  // Adjust as needed
}
```

### Changing Workflow Steps
Edit `/lib/bonds-config.ts`:

```typescript
workflow: {
  steps: ["Open", "Create", "Sign", "Record", "Status"],
  requiresSignature: true,
  allowsEditing: false, // Set to true to enable editing
}
```

---

## Database Integration (Future)

The app is designed for easy database integration:

1. Replace `/lib/bond-store.ts` localStorage calls with database queries
2. Update `createBondIntent()`, `getBondIntent()`, `getAllBondIntents()` functions
3. Add authentication middleware to protect API routes
4. Implement Row Level Security (RLS) if using Supabase
5. Add backend validation to complement client-side validation

Recommended databases:
- Supabase (PostgreSQL with RLS)
- Neon (Serverless PostgreSQL)
- AWS Aurora (PostgreSQL compatible)

---

## Security Considerations

### Current Implementation
- ✅ No financial execution
- ✅ No asset custody
- ✅ Signature authentication only
- ✅ Client-side validation
- ✅ Unique reference IDs
- ✅ Immutable audit trail in evidence pack

### For Production Database
- Add server-side validation
- Implement rate limiting
- Use parameterized queries to prevent SQL injection
- Add CSRF protection
- Implement proper session management
- Enable HTTPS only
- Add logging and monitoring

---

## Maintenance & Updates

### Updating Version
1. Edit `/lib/bonds-config.ts`:
   ```typescript
   identity: {
     version: "1.1.0", // Update version
   },
   release: {
     tag: "v1.1.0-production", // Update tag
   }
   ```

2. Update `/public/manifest.json`:
   ```json
   {
     "version": "1.1.0"
   }
   ```

### Release Process
1. Test changes locally and in Pi Sandbox
2. Update version numbers
3. Deploy to production
4. Test in Pi Browser production environment
5. Monitor for errors in first 24 hours

---

## Support & Resources

### Documentation
- Pi Network SDK: https://sdk.minepi.com/
- Pi Developer Portal: https://developers.minepi.com/
- App Studio: https://app-studio.pi

### Common Issues

**Issue:** Pi SDK not loading  
**Solution:** Check network connection, verify SDK URL in system-config.ts

**Issue:** Signature request fails  
**Solution:** Ensure user is authenticated, check Pi Browser version

**Issue:** Data not persisting  
**Solution:** Check localStorage is enabled, consider database integration

**Issue:** Mobile layout broken  
**Solution:** Test with mobile viewport, verify Tailwind responsive classes

---

## Success Criteria

Your app is ready for publication when:

✅ Loads successfully in Pi Browser  
✅ Authentication flow completes without errors  
✅ Bond creation form validates and submits  
✅ Wallet signature request appears and can be confirmed  
✅ Status page displays complete evidence pack  
✅ All mobile breakpoints render correctly  
✅ App identity (name, version, domain) displays in footer  
✅ No console errors in Pi Browser developer tools  
✅ Professional appearance suitable for institutional use  

---

## Contact & Next Steps

Once testing is complete:
1. Deploy to production hosting
2. Submit to Pi Developer Portal
3. Request domain: bonds.pi
4. Await review (typically 3-7 days)
5. Respond to any reviewer feedback
6. Celebrate approval! 🎉

**Good luck with your Pi Network app launch!**
