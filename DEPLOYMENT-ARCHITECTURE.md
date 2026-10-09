# 📊 ALF Launch - Deployment Architecture & Flow

## System Architecture on Hostinger

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET / USERS                         │
├─────────────────────────────────────────────────────────────────┤
│                       yourdomain.com (SSL/TLS)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             HOSTINGER - Node.js Application               │  │
│  │                    (Port 3000)                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │           Next.js Application (npm start)           │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │  │
│  │  │  │  Routes:                                      │  │  │  │
│  │  │  │  • / (Homepage)                              │  │  │  │
│  │  │  │  • /shop (Bundle store)                      │  │  │  │
│  │  │  │  • /bundles/* (Bundle details)               │  │  │  │
│  │  │  │  • /checkout (Payment)                       │  │  │  │
│  │  │  │  • /admin (Admin dashboard)                  │  │  │  │
│  │  │  │  • /api/* (API endpoints)                    │  │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │  │
│  │  │  │  Managed by: PM2 (Process Manager)           │  │  │  │
│  │  │  │  • Auto-restart on crash                     │  │  │  │
│  │  │  │  • Multiple instances (clustering)           │  │  │  │
│  │  │  │  • Logs at ./logs/                           │  │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │                 │                 │
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐   ┌──────▼──────┐
    │ SUPABASE│      │   STRIPE  │   │    ZAPIER   │
    │ Database│      │  Payments │   │ Automation  │
    │ Storage │      │ Webhooks  │   │ Webhooks    │
    │ Auth    │      │           │   │             │
    └─────────┘      └───────────┘   └─────────────┘
```

## Deployment Flow Chart

```
START
  │
  ├─► 1. SETUP HOSTINGER
  │   ├─ Create Node.js Application
  │   ├─ Connect Domain
  │   └─ Enable SSL (auto)
  │
  ├─► 2. PREPARE PROJECT
  │   ├─ Update next.config.ts
  │   ├─ Create .env.production
  │   ├─ Build locally: npm run build
  │   └─ Verify build succeeds
  │
  ├─► 3. DEPLOYMENT METHOD
  │   ├─► Git Push (Easiest)
  │   │   ├─ Push to production branch
  │   │   ├─ Hostinger auto-builds & deploys
  │   │   └─ Application starts automatically
  │   │
  │   └─► Manual Upload (SFTP)
  │       ├─ SFTP upload all files (except node_modules, .next)
  │       ├─ SSH into server
  │       ├─ npm install --production
  │       ├─ npm run build
  │       └─ Start with PM2
  │
  ├─► 4. PROCESS MANAGEMENT
  │   ├─ npm install -g pm2
  │   ├─ pm2 start ecosystem.config.js
  │   ├─ pm2 startup
  │   └─ pm2 save
  │
  ├─► 5. DATABASE SETUP
  │   ├─ Verify Supabase tables exist
  │   ├─ Run: node seed-admin-users.js
  │   ├─ Run: node seed-all-bundles.js
  │   └─ Run: node seed-bundle-files.js ./bundle-files
  │
  ├─► 6. STRIPE CONFIGURATION
  │   ├─ Get LIVE API keys (pk_live_, sk_live_)
  │   ├─ Create webhook endpoint
  │   ├─ Configure signing secret
  │   └─ Test webhook delivery
  │
  ├─► 7. TESTING
  │   ├─ Test homepage loads
  │   ├─ Test admin login
  │   ├─ Test payment flow
  │   ├─ Test file download
  │   └─ Verify logs are clean
  │
  └─► 8. GO LIVE
      ├─ Announce to users
      ├─ Monitor logs daily
      ├─ Track first orders
      ├─ Gather feedback
      └─ Plan improvements

DONE ✅
```

## File Flow & Locations

### Local Development
```
Your Computer
├── app/
│   ├── page.tsx (homepage)
│   ├── admin/ (admin panel)
│   ├── shop/ (shop pages)
│   ├── checkout/ (payment)
│   ├── bundles/ (bundle pages)
│   ├── api/ (API endpoints)
│   └── ...
├── bundle-files/ (2000 files in 500 folders)
├── .env (local development)
├── .env.production (production env vars)
├── package.json
├── next.config.ts
└── tsconfig.json
```

### After Deployment to Hostinger
```
Hostinger Server (/home/app or /public_html)
├── app/
├── .env (renamed from .env.production)
├── package.json
├── package-lock.json
├── .next/ (built by npm run build)
├── public/
├── logs/
│   ├── out.log (PM2 stdout)
│   ├── err.log (PM2 errors)
│   └── combined.log (PM2 combined)
└── ecosystem.config.js
```

### Supabase (Cloud Database)
```
Supabase Project
├── Tables
│   ├── products (500 bundles)
│   ├── orders (customer purchases)
│   ├── order_items (items in each order)
│   └── users (admin users)
├── Storage
│   └── bundle-files/
│       └── bundles/
│           ├── UUID1/ (4 files)
│           ├── UUID2/ (4 files)
│           └── ... (500 bundle folders)
└── Auth (admin login)
```

## Data Flow - Customer Purchase

```
Customer              Hostinger App           Stripe              Supabase
   │                      │                      │                    │
   ├─Browse shop page──────►│                      │                    │
   │                      │◄─Query bundles──────────────────────────────│
   │                      │                      │                    │
   │                      │◄─Show bundles─────────┤                    │
   │◄─Display bundles─────┤                      │                    │
   │                      │                      │                    │
   ├─Add to cart─────────►│                      │                    │
   │                      │                      │                    │
   ├─Checkout────────────►│                      │                    │
   │                      ├─Create payment intent──────►│               │
   │                      │◄─Returns client secret─────┤               │
   │◄─Show payment form───┤                      │                    │
   │                      │                      │                    │
   ├─Enter card info─────►│                      │                    │
   │                      ├─Confirm payment──────────────►│              │
   │                      │◄─Success confirmation─────────┤              │
   │                      │                      │                    │
   │                      ├─Webhook: payment_intent.succeeded           │
   │                      │                      │                    │
   │                      ├─Create order─────────────────────────────►│
   │                      │◄─Order created─────────────────────────────┤
   │                      │                      │                    │
   │◄─Success page────────┤                      │                    │
   │   with download link │                      │                    │
   │                      │                      │                    │
   ├─Download files──────►│                      │                    │
   │                      ├─Get file URLs from storage──────────────┐  │
   │                      │◄──────────────────────────────────────┘  │
   │◄─Download from───────┤─────────────────────────────────────────►│
   │   Supabase storage   │                      │                    │

```

## Environment Variables & Secrets Flow

```
┌─────────────────────────────────────────┐
│     Developer's Local Machine            │
│  .env.production (kept locally)          │
│  Contains:                               │
│  • STRIPE_SECRET_KEY (sk_live_...)      │
│  • NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   │
│  • SUPABASE_SERVICE_ROLE_KEY            │
└──────────────┬──────────────────────────┘
               │
               │ (Upload to Hostinger)
               │
               ▼
┌─────────────────────────────────────────┐
│     Hostinger Server                    │
│  .env (renamed from .env.production)   │
│  Or Hostinger Application Settings      │
│  Contains same secrets                  │
└──────────────┬──────────────────────────┘
               │
               ├─ Frontend: NEXT_PUBLIC_* variables
               │  • NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
               │  • NEXT_PUBLIC_SUPABASE_URL
               │  • NEXT_PUBLIC_SUPABASE_ANON_KEY
               │  • NEXT_PUBLIC_SITE_URL
               │
               └─ Backend Only: Secret variables
                  • STRIPE_SECRET_KEY
                  • SUPABASE_SERVICE_ROLE_KEY
                  • STRIPE_WEBHOOK_SECRET
                  (NOT exposed to frontend)
```

## Deployment Options Comparison

```
┌──────────────────┬──────────────┬─────────────┬───────────────┐
│ Method           │ Ease         │ Time        │ Best For      │
├──────────────────┼──────────────┼─────────────┼───────────────┤
│ Git Push         │ ★★★★★ Easy   │ 2-3 min     │ Recommended   │
│ (Auto-Deploy)    │              │             │ Team projects │
├──────────────────┼──────────────┼─────────────┼───────────────┤
│ SFTP Manual      │ ★★★ Medium   │ 5-10 min    │ One-time      │
│ Upload + SSH     │              │             │ deployment    │
├──────────────────┼──────────────┼─────────────┼───────────────┤
│ Docker           │ ★★ Hard      │ 10-15 min   │ Production    │
│ Containerization │              │             │ deployments   │
└──────────────────┴──────────────┴─────────────┴───────────────┘
```

## Monitoring & Health Check

```
Application Health Monitoring
           │
    ┌──────┴──────┐
    │             │
 Hostinger    External
   Panel      Services
    │             │
    ├─ Logs     ┌─ UptimeRobot
    │             (5-min checks)
    ├─ CPU    ├─ PM2 Dashboard
    │             (if enabled)
    ├─ Memory  │
    │          └─ Application Logs
    └─ Process    (./logs/)
       Status

Alert Triggers:
✓ CPU > 80%
✓ Memory > 1GB
✓ Process crashed
✓ Response time > 5s
✓ Stripe webhook failed
✓ Database connection lost
```

## DNS Configuration

```
Your Domain Registrar
     │
     ├─ Option 1: Update Nameservers
     │   Set to Hostinger nameservers
     │   TTL: 24-48 hours
     │   Automatic renewal
     │
     └─ Option 2: CNAME Record
         Point to: app.hostinger.com
         TTL: 3600 seconds
         Faster propagation
              │
              ▼
         Hostinger DNS
              │
              ▼
      SSL Certificate (Auto)
              │
              ▼
      Next.js Application
         yourdomain.com:443
         (HTTPS Secure)
```

---

**Diagram Key:**
- ► = Process flow
- ◄ = Data return
- → = Network connection
- ├─ = Branch
- └─ = Final branch

Last Updated: May 27, 2026
