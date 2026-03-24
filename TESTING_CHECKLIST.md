# Bonds App - Testing Checklist

Use this checklist to verify the app is ready for Pi Network publication and domain approval.

---

## Pre-Testing Setup

- [ ] App is deployed to a publicly accessible URL
- [ ] Pi Browser is installed on testing device
- [ ] Test account has Pi authentication enabled
- [ ] Network connection is stable

---

## 1. Initial Load & Authentication

### App Launch
- [ ] Open app URL in Pi Browser
- [ ] App loads without errors
- [ ] Loading screen displays "Initializing Pi Network..."
- [ ] No JavaScript console errors

### Pi Authentication
- [ ] Pi SDK loads successfully
- [ ] Authentication prompt appears automatically
- [ ] User can approve authentication request
- [ ] Dashboard loads after authentication
- [ ] User's Pi username displays correctly (if available)

**Expected:** Clean authentication flow with no errors

---

## 2. Dashboard Testing

### Visual Verification
- [ ] Header displays "Bonds" with shield icon
- [ ] "Institutional Records System" subtitle visible
- [ ] "Bond Intent Documentation" title is centered
- [ ] Primary CTA button "Create New Bond Intent" is prominent
- [ ] Statistics cards show real numbers
- [ ] Recent intents list displays (or shows empty state)

### Functionality
- [ ] Tap "Create New Bond Intent" button
- [ ] Navigation to `/create` page works
- [ ] Back navigation from create page works
- [ ] Tap on recent intent navigates to status page
- [ ] Statistics update after creating new intent

### Mobile Responsiveness
- [ ] All elements visible on mobile viewport
- [ ] No horizontal scrolling
- [ ] Touch targets are adequate size (min 44x44px)
- [ ] Text is readable without zooming
- [ ] Cards stack vertically on mobile

**Expected:** Professional, clean dashboard with working navigation

---

## 3. Bond Creation Flow

### Form Display
- [ ] All form fields render correctly
- [ ] Bond Type dropdown shows all options
- [ ] Date picker works for Maturity Date
- [ ] All input fields accept text
- [ ] Info box at bottom explains signature process

### Form Validation
- [ ] Try submitting empty form - validation prevents submission
- [ ] Fill only some fields - validation catches missing required fields
- [ ] Enter valid data in all fields
- [ ] Form accepts valid input without errors

### Bond Types Available
Test each bond type appears in dropdown:
- [ ] Municipal Bond
- [ ] Corporate Bond
- [ ] Treasury Bond
- [ ] Infrastructure Bond
- [ ] Green Bond
- [ ] Social Bond

### Sample Test Data
```
Bond Type: Municipal Bond
Issuing Entity: City Infrastructure Authority
Bond Amount: 5,000,000
Maturity Date: 2029-12-31
Coupon Rate: 4.75
Additional Notes: Test bond for city development project
```

### Submission Process
- [ ] Fill form completely with test data
- [ ] Tap "Sign & Submit" button
- [ ] Button shows loading state ("Processing...")
- [ ] Wallet signature simulation occurs (1-2 second delay)
- [ ] Automatic navigation to status page
- [ ] No errors during submission

**Expected:** Smooth form submission with simulated signature request

---

## 4. Evidence Pack / Status Page

### Page Load
- [ ] Status page loads immediately after submission
- [ ] Unique Reference ID is displayed
- [ ] Status banner shows "Intent Recorded" with green checkmark
- [ ] All sections of evidence pack are visible

### Reference Information Section
- [ ] Reference ID format: `BOND-[timestamp]-[random]`
- [ ] Reference ID is unique for each submission
- [ ] Copy button works (copies to clipboard)
- [ ] Timestamp shows current date/time in readable format
- [ ] Submitted By shows username or "Pi User"

### Bond Details Section
- [ ] Bond Type displays correctly (with label, not code)
- [ ] Issuing Entity matches input
- [ ] Amount displays with " Pi" suffix
- [ ] Coupon Rate displays with "%" symbol
- [ ] Maturity Date is formatted readably
- [ ] Additional Notes section appears if notes were entered

### Wallet Signature Section
- [ ] Wallet Signature hex string displays
- [ ] Signature is in format `0x[64 characters]`
- [ ] Section labeled "Cryptographic proof of authorization"

### Runtime Log Section
- [ ] All log entries display in chronological order
- [ ] Timestamps in ISO 8601 format
- [ ] Clock icon appears next to each entry
- [ ] Log shows complete workflow:
  - Bond intent initialized
  - Form validation passed
  - Reference ID generated
  - Wallet signature requested
  - Wallet signature confirmed
  - Intent recorded to blockchain

### Manifest Section
- [ ] Application name: "Bonds"
- [ ] Version displays correctly (e.g., "1.0.0")
- [ ] Environment shows "Pi Network Mainnet" (or Testnet)
- [ ] Release Tag shows in code block (e.g., "v1.0.0-production")

### Navigation
- [ ] "Return to Dashboard" button visible
- [ ] Tap button returns to dashboard
- [ ] New intent appears in recent list on dashboard

**Expected:** Complete evidence pack with all audit trail information

---

## 5. Multiple Intent Testing

### Create Additional Intents
Create 3-5 more bond intents with different data:

**Test Intent 2:**
- Bond Type: Corporate Bond
- Issuer: Tech Innovation Corp
- Amount: 2,000,000

**Test Intent 3:**
- Bond Type: Green Bond
- Issuer: Renewable Energy Foundation
- Amount: 8,500,000

**Verification:**
- [ ] Each intent gets unique Reference ID
- [ ] Statistics on dashboard update correctly
- [ ] Recent intents list shows most recent first
- [ ] Can navigate to each intent's status page
- [ ] Each intent maintains its own data (no mixing)

**Expected:** Multiple intents coexist without data corruption

---

## 6. Edge Cases & Error Handling

### Form Validation Edge Cases
- [ ] Try negative amount - should be prevented
- [ ] Try extremely large amount (> 1 billion) - should be prevented
- [ ] Try past date for maturity - should work (historical bonds)
- [ ] Try coupon rate > 20% - should be prevented
- [ ] Try special characters in issuer name - should work
- [ ] Leave notes empty - should work (optional field)

### Navigation Edge Cases
- [ ] Visit `/status/invalid-id` - shows "Not Found" message
- [ ] Use browser back button - navigation works
- [ ] Refresh status page - data persists
- [ ] Refresh dashboard - data persists

### Storage Testing
- [ ] Close Pi Browser completely
- [ ] Reopen app
- [ ] Previously created intents still visible
- [ ] Data persists across browser sessions

**Expected:** Graceful handling of edge cases, no crashes

---

## 7. App Identity & Footer

### Footer Elements
- [ ] Footer visible at bottom of dashboard
- [ ] Shield icon displays
- [ ] App name "Bonds" shown
- [ ] Domain "bonds.pi" displayed
- [ ] Description text readable
- [ ] Version number correct
- [ ] Release tag correct
- [ ] "Pi Network" mentioned
- [ ] Disclaimer text: "No financial execution • No asset custody • Signature authentication only"

**Expected:** Clear app identity displayed consistently

---

## 8. Performance & UX

### Load Times
- [ ] Initial app load < 3 seconds
- [ ] Page transitions feel instant
- [ ] Form submission < 2 seconds
- [ ] No noticeable lag when typing

### Visual Polish
- [ ] Consistent color scheme (blue/teal institutional theme)
- [ ] Smooth transitions and animations
- [ ] Icons render clearly
- [ ] Text hierarchy is clear
- [ ] Adequate spacing between elements
- [ ] No layout shifts during load

### Accessibility
- [ ] All buttons have sufficient touch targets
- [ ] Color contrast is adequate for readability
- [ ] Form labels are clear and descriptive
- [ ] Error messages are helpful

**Expected:** Fast, polished, professional user experience

---

## 9. Cross-Device Testing

### Mobile Phones (Recommended)
Test on actual Pi Browser on mobile:
- [ ] iOS device (if available)
- [ ] Android device (if available)

### Different Screen Sizes
- [ ] Small phone (320px width)
- [ ] Standard phone (375px width)
- [ ] Large phone (414px width)
- [ ] Tablet (768px width)

### Orientation
- [ ] Portrait mode (primary)
- [ ] Landscape mode (should still work)

**Expected:** Consistent experience across devices

---

## 10. Final Verification

### Critical Path (End-to-End)
Complete this path without any errors:
1. [ ] Open app in Pi Browser
2. [ ] Authenticate with Pi Network
3. [ ] View dashboard
4. [ ] Create new bond intent with complete data
5. [ ] Review evidence pack on status page
6. [ ] Return to dashboard
7. [ ] Verify new intent appears in list
8. [ ] Open existing intent from list
9. [ ] Verify data matches what was entered

### Browser Console
- [ ] Open Pi Browser developer tools
- [ ] Check console for any errors
- [ ] Verify no failed network requests
- [ ] Confirm no JavaScript warnings

### Pre-Submission Requirements
- [ ] Title in HTML is "Made with App Studio"
- [ ] Manifest.json exists at `/public/manifest.json`
- [ ] App icons exist (192px and 512px)
- [ ] All environment variables configured
- [ ] No hardcoded test data in production code
- [ ] Console.log statements are appropriate (only [v0] prefix for debugging)

**Expected:** Zero errors, production-ready application

---

## Sign-Off

### Testing Complete
- [ ] All checklist items passed
- [ ] No critical issues found
- [ ] App is ready for Pi Developer Portal submission
- [ ] Domain request can be made for: bonds.pi

### Tester Information
- **Date Tested:** _______________
- **Tester Name:** _______________
- **Device Used:** _______________
- **Pi Browser Version:** _______________

### Notes / Issues Found
```
[Add any notes or minor issues that don't block publication]
```

---

**Status:** [ ] READY FOR SUBMISSION  [ ] NEEDS FIXES

If any items failed, document issues and retest after fixes are applied.
