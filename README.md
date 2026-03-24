# Bonds - Institutional Bond Intent Tracking System

> **Domain:** bonds.pi (ready for approval)  
> **Version:** 1.0.0  
> **Category:** Institutional Finance  
> **Platform:** Pi Network

An institutional application for documenting and tracking bond issuance or allocation intents within governance frameworks on the Pi Network.

---

## 🎯 Overview

**Bonds** is a specialized institutional records system designed to document bond-related intents and decisions within governance and oversight frameworks. The application provides a transparent, auditable system for recording bond allocation decisions **without executing financial transactions or holding asset custody**.

### ✨ Key Features

- **📊 Institutional Dashboard**: Real-time overview with statistics and recent intents
- **📝 Structured Bond Creation**: Formal intent submission with 6 bond types
- **🔐 Wallet Signature Authentication**: Cryptographic proof without financial execution
- **📦 Complete Evidence Pack**: Reference ID, timestamp, signature, runtime log, and manifest
- **📱 Mobile-First Design**: Optimized for Pi Browser on mobile devices
- **⚙️ Unified Core Engine**: Configuration-driven architecture for easy maintenance

---

## 🚀 Quick Start

### One-Action App Flow

```
Open → Create Bond Intent → Sign with Wallet → View Evidence Pack
```

1. **Open** the app in Pi Browser and authenticate
2. **Create** a new bond intent with structured data
3. **Sign** the intent with your Pi Network wallet
4. **View** the complete evidence pack with audit trail

### Bond Types Supported

- 🏛️ Municipal Bonds
- 🏢 Corporate Bonds
- 🏦 Treasury Bonds
- 🌉 Infrastructure Bonds
- 🌱 Green Bonds
- 🤝 Social Bonds

---

## 🏗️ Architecture

### Unified Core Engine

All application behavior is defined in `/lib/bonds-config.ts`:

```typescript
BONDS_APP_CONFIG = {
  identity: { name, domain, version, description },
  bondTypes: [ /* Configurable bond types */ ],
  validation: { /* Validation rules */ },
  workflow: { /* Process steps */ },
  statusTypes: { /* Status definitions */ },
}
```

**Benefits:**
- Single source of truth for all app behavior
- Easy to add new bond types or modify rules
- Scalable for future institutional integrations
- Clean separation of configuration and logic

### Evidence Pack System

Each bond intent generates a complete, immutable audit trail:

| Component | Description |
|-----------|-------------|
| **Reference ID** | Unique identifier: `BOND-[timestamp]-[random]` |
| **Timestamp** | ISO 8601 creation time |
| **Wallet Signature** | Cryptographic proof (0x... format) |
| **Runtime Log** | Complete execution trace |
| **Manifest** | App version, environment, release tag |
| **Bond Details** | All submitted form data |
| **Status** | Current state (pending/approved/recorded) |

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Authentication:** Pi Network SDK v2.0
- **State Management:** React Hooks + localStorage
- **Icons:** Lucide React

---

## 📦 Installation & Development

### Prerequisites

- Node.js 18+ installed
- Pi Network account
- Pi Browser for testing

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open in browser
# Navigate to http://localhost:3000

# Build for production
npm run build
npm start
```

---

## 🧪 Testing

Comprehensive testing checklist available in `TESTING_CHECKLIST.md`.

### Critical Testing Areas

1. ✅ **Authentication Flow** - Pi SDK loads and authenticates
2. ✅ **Bond Creation** - Form validation and submission
3. ✅ **Signature Process** - Wallet signature simulation
4. ✅ **Evidence Pack** - All sections render with correct data
5. ✅ **Mobile Responsiveness** - Works on all screen sizes
6. ✅ **Data Persistence** - localStorage maintains state
7. ✅ **Edge Cases** - Handles invalid input gracefully

---

## 🚢 Deployment

Complete deployment guide available in `DEPLOYMENT.md`.

### Pre-Deployment Checklist

- ✅ Test in Pi Browser (mobile device)
- ✅ Verify all form validations work
- ✅ Confirm evidence pack displays correctly
- ✅ Check manifest.json and icons exist
- ✅ Ensure HTML title is "Made with App Studio"
- ✅ No console errors in production build
- ✅ Mobile responsiveness tested

### Domain Approval Process

1. **Deploy** to production hosting
2. **Submit** to Pi Developer Portal
3. **Request** domain: `bonds.pi`
4. **Await** review (typically 3-7 days)
5. **Launch** once approved! 🎉

---

## 📁 Project Structure

```
bonds/
├── app/
│   ├── page.tsx                    # 📊 Dashboard
│   ├── create/page.tsx             # 📝 Bond form
│   └── status/[id]/page.tsx        # 📦 Evidence pack
├── lib/
│   ├── bonds-config.ts             # ⚙️ Core configuration
│   ├── bond-store.ts               # 💾 Data storage
│   └── types.ts                    # TypeScript types
├── components/
│   ├── app-footer.tsx              # App identity
│   └── ui/                         # UI components
├── public/
│   ├── manifest.json               # PWA manifest
│   └── icon-*.png                  # App icons
├── DEPLOYMENT.md                   # 📚 Deployment guide
└── TESTING_CHECKLIST.md            # ✅ Testing checklist
```

---

## 🔧 Customization

### Adding New Bond Types

Edit `/lib/bonds-config.ts`:

```typescript
bondTypes: [
  {
    value: "sustainable",
    label: "Sustainable Bond",
    description: "For sustainability projects"
  },
]
```

### Modifying Validation Rules

```typescript
validation: {
  minAmount: 1000,
  maxAmount: 1000000000,
  minCouponRate: 0,
  maxCouponRate: 20,
}
```

---

## 🔐 Security & Compliance

### Current Implementation

✅ **No Financial Execution** - Intent documentation only  
✅ **No Asset Custody** - No holdings or transfers  
✅ **Signature Authentication** - Wallet signature proof only  
✅ **Complete Audit Trail** - Immutable evidence pack  
✅ **Transparent Process** - Full runtime logging  

---

## 🤝 Support & Resources

### Documentation

- 📖 **Deployment Guide:** `DEPLOYMENT.md`
- ✅ **Testing Checklist:** `TESTING_CHECKLIST.md`
- 🔗 **Pi SDK Docs:** https://sdk.minepi.com/
- 🔗 **Pi Developer Portal:** https://developers.minepi.com/

---

## 🎯 Success Criteria

Your app is **ready for publication** when:

✅ Loads in Pi Browser without errors  
✅ Authentication flow completes  
✅ Bond creation form works end-to-end  
✅ Evidence pack displays complete audit trail  
✅ Mobile responsive on all devices  
✅ No console errors in production  
✅ Professional institutional appearance  

---

**Made with App Studio** | **Pi Network** | **bonds.pi**

*Ready for Pi Developer Portal submission and domain approval*
