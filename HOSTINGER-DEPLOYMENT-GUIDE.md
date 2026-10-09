# 🚀 Complete Hostinger Deployment Guide
## ALF Launch Project - Next.js Website + Admin Panels

**Project Overview:**
- **Frontend**: Next.js 16.1.6 with React 18.3
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe Integration
- **Admin Panel**: Authenticated dashboard at `/admin`
- **Bundle System**: 500 state/program bundles with files
- **Integrations**: Zapier, GoHighLevel, Stripe Webhooks

---

## 📋 PART 1: PRE-DEPLOYMENT CHECKLIST

### ✅ Local Environment Validation
```bash
# 1. Verify Node.js version (need 18+)
node --version

# 2. Test build locally
npm run build

# 3. Test start locally
npm run start

# 4. Verify all bundle files exist
dir bundle-files
# Should show 500 subfolders (one per state/program combination)

# 5. Verify .env file has all keys
# Check STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.
```

### ✅ Production Accounts Setup
- [ ] **Hostinger Account** - Created and Node.js hosting enabled
- [ ] **Supabase Project** - Active with tables created (products, bundles, etc.)
- [ ] **Stripe Account** - Live API keys obtained
- [ ] **Stripe Webhooks** - Configured pointing to `/api/stripe-webhook`
- [ ] **Zapier Account** - Webhook URL created (if using integrations)
- [ ] **GoHighLevel Account** - API key obtained (if using)
- [ ] **Domain Name** - Purchased and ready to point to Hostinger

---

## 🏗️ PART 2: HOSTINGER SETUP

### Step 1: Create Node.js Application on Hostinger

**Via Hostinger Control Panel:**
1. Login to [Hostinger Control Panel](https://hpanel.hostinger.com)
2. Navigate to **Applications** → **Node.js**
3. Click **Create Application**
4. **Application Name**: `alf-launch` (or your preferred name)
5. **Node.js Version**: Select `18.x` or `20.x`
6. **Port**: `3000` (Next.js default)
7. **Root Directory**: `/public` or `/` (we'll configure this)
8. Click **Create**

**Note the following:**
- Application URL (temporary domain)
- SSH credentials
- Git repository URL (if using)

### Step 2: Connect Your Domain

1. In Hostinger Control Panel → **Domains** → Select your domain
2. **Point to Application**: Select the Node.js app created above
3. **SSL Certificate**: Enable automatic SSL (usually enabled by default)
4. **Wait 24-48 hours** for DNS propagation (or update nameservers immediately)

### Step 3: Connect Git Repository (Recommended Method)

If you have GitHub/GitLab repository:

1. In Hostinger Application settings → **Deployment**
2. **Select Git Provider**: GitHub/GitLab/Gitea
3. **Connect Repository**: Authorize and select your repo
4. **Branch**: `main` (or your production branch)
5. **Automatic Deployments**: Enable (optional but recommended)

---

## 📦 PART 3: PREPARE PROJECT FOR DEPLOYMENT

### Step 1: Create Production Build Package

```bash
# In your local project root
npm run build

# Verify build succeeded
# Should create .next folder
ls .next
```

### Step 2: Optimize next.config.ts for Hostinger

Update [next.config.ts](next.config.ts):

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // ✓ Already set - good for Hostinger
  },
  // Add these for production
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false, // Don't expose Next.js version
  // If using API routes
  api: {
    responseLimit: '5mb', // Adjust based on file uploads
  },
};

export default nextConfig;
```

### Step 3: Create .env.production File

Create [.env.production](file://.env.production) in project root:

```env
# Stripe Configuration (PRODUCTION KEYS)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE

# Supabase Configuration (SAME FOR PRODUCTION)
NEXT_PUBLIC_SUPABASE_URL=https://wrkrfzjwehhmrckkfazh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=REDACTED_SET_IN_SERVER_ENVIRONMENT
SUPABASE_SERVICE_ROLE_KEY=REDACTED_SET_IN_SERVER_ENVIRONMENT

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET

# Zapier & GoHighLevel (if used)
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_ID
GOHIGHLEVEL_API_KEY=YOUR_KEY
```

### Step 4: Create package-lock.json (if not in git)

```bash
npm install --frozen-lockfile
```

---

## 🚀 PART 4: DEPLOYMENT METHODS

### METHOD A: Git Push Deployment (Recommended)

#### 1A. Setup GitHub Repository

```bash
# Initialize Git (if not already)
git init

# Add Hostinger as remote
git remote add hostinger [URL from Hostinger Git section]

# Or add GitHub
git remote add origin https://github.com/yourusername/alf-launch.git

# Create .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".next/" >> .gitignore
echo ".env.production" >> .gitignore
```

#### 1B. Create Production Branch

```bash
git checkout -b production
git add .
git commit -m "Prepare for production deployment"
git push origin production
```

#### 1C. Configure in Hostinger

1. Hostinger Panel → Application → **Deployment**
2. **Branch**: `production`
3. **Enable Auto-Deploy**: Yes (optional)
4. Click **Deploy Now**

Hostinger will:
- Clone repository
- Run `npm install`
- Run `npm run build`
- Start application with `npm start`

---

### METHOD B: Manual SFTP Upload

#### 1. Connect via SFTP

**Using FileZilla or WinSCP:**
- Host: `hostinger-sftp.yourdomain.com` (from Hostinger credentials)
- Username: From Hostinger credentials
- Password: From Hostinger credentials
- Port: `22` (SSH) or `22` (SFTP)

#### 2. Upload Project Files

```
/public_html/ or /home/app/
├── app/
├── lib/
├── public/
├── types/
├── utils/
├── .env.production (RENAME TO .env)
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── ... (all other files except node_modules and .next)
```

**Do NOT upload:**
- `node_modules/` (will be installed)
- `.next/` (will be built)
- `.git/` (optional)

#### 3. Install Dependencies via SSH

```bash
# SSH into Hostinger
ssh user@hostinger.com

# Navigate to app directory
cd public_html

# Install dependencies
npm install --production

# Build project
npm run build

# Start application
npm start

# Or use PM2 for persistent process (see Part 5)
```

---

### METHOD C: Docker Deployment (Advanced)

Create [Dockerfile](file://Dockerfile):

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

Push to Docker Hub and deploy on Hostinger Container hosting (if available).

---

## 🛡️ PART 5: PROCESS MANAGEMENT ON HOSTINGER

### Option A: PM2 (Recommended for Reliability)

#### Install PM2
```bash
npm install -g pm2
```

#### Create [ecosystem.config.js](file://ecosystem.config.js):

```javascript
module.exports = {
  apps: [{
    name: 'alf-launch',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
```

#### Start with PM2

```bash
# Start app
pm2 start ecosystem.config.js

# View logs
pm2 logs alf-launch

# Restart app
pm2 restart alf-launch

# Stop app
pm2 stop alf-launch

# Setup startup (auto-restart on server reboot)
pm2 startup
pm2 save
```

### Option B: Systemd Service

Create `/etc/systemd/system/alf-launch.service`:

```ini
[Unit]
Description=ALF Launch Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/app
EnvironmentFile=/home/app/.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable alf-launch
sudo systemctl start alf-launch
```

---

## 🗄️ PART 6: DATABASE SETUP (SUPABASE)

### Step 1: Verify Supabase Project

1. Login to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API** → Copy keys:
   - Project URL
   - anon/public key
   - service_role key

### Step 2: Create Database Tables

In **Supabase SQL Editor**, run [supabase-schema.sql](file://supabase-schema.sql):

```bash
# Or use Supabase CLI
supabase db push
```

This creates:
- `products` table (bundles)
- `orders` table (purchases)
- `order_items` table
- `users` table (admin)
- Related indexes and policies

### Step 3: Setup Authentication

In Supabase Dashboard → **Authentication** → **Providers**:
- [ ] Email/Password enabled (for admin login)
- [ ] (Optional) Google OAuth
- [ ] (Optional) GitHub OAuth

### Step 4: Configure Row Level Security (RLS)

Enable RLS policies for:
- `products` - Public read, Admin write
- `orders` - User read own orders
- `users` - Admin only

---

## 💳 PART 7: STRIPE WEBHOOK CONFIGURATION

### Step 1: Get Production API Keys

1. Login to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Live Keys** (not Test)
3. Copy:
   - Publishable Key (starts with `pk_live_`)
   - Secret Key (starts with `sk_live_`)

### Step 2: Create Webhook Endpoint

In Stripe Dashboard → **Developers** → **Webhooks**:

1. Click **Create endpoint**
2. **Endpoint URL**: `https://yourdomain.com/api/stripe-webhook`
3. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Click **Create endpoint**
5. Copy **Signing Secret** (starts with `whsec_`)

### Step 3: Update Environment Variables

In Hostinger Application Settings or `.env.production`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

---

## 📧 PART 8: EMAIL & NOTIFICATIONS SETUP

### Option A: Supabase Email

1. Supabase Dashboard → **Email Templates**
2. Configure SMTP or use Resend/Sendgrid

### Option B: Third-party Services

**Recommended:**
- [SendGrid](https://sendgrid.com) - $15/month
- [Resend](https://resend.com) - $20/month
- [Mailgun](https://mailgun.com) - Pay-as-you-go

Add to `.env.production`:
```env
SENDGRID_API_KEY=SG.xxx
RESEND_API_KEY=re_xxx
```

---

## 🔌 PART 9: EXTERNAL INTEGRATIONS

### Zapier Integration

If using Zapier webhooks:

1. Create Zap in Zapier Dashboard
2. **Trigger**: Custom Webhook
3. Copy webhook URL: `https://hooks.zapier.com/hooks/catch/...`
4. Add to `.env.production`:
   ```env
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_ID
   ```

### GoHighLevel Integration

If using GoHighLevel CRM:

1. Login to GoHighLevel dashboard
2. Account Settings → API Keys
3. Copy API key
4. Add to `.env.production`:
   ```env
   GOHIGHLEVEL_API_KEY=YOUR_KEY
   ```

---

## 📁 PART 10: FILE UPLOAD & BUNDLE FILES

### Step 1: Upload Bundle Files to Supabase Storage

```bash
# Seed bundles in database first
node seed-all-bundles.js

# Upload all bundle files to Supabase storage
node seed-bundle-files.js ./bundle-files

# Monitor upload progress
# Should complete in ~10-15 minutes for 500 bundles
```

### Step 2: Verify Files in Supabase

In Supabase Dashboard → **Storage**:
- [ ] `bundle-files` bucket created
- [ ] `bundles/` folder contains 500 subfolders
- [ ] Each subfolder has 4 files (PDF + XLSX)

### Step 3: Update File URLs in Database

Ensure `products` table has correct file URLs:

```sql
SELECT id, name, metadata->>'files' 
FROM products 
WHERE type = 'bundle' 
LIMIT 5;
```

URLs should be in format:
```
https://wrkrfzjwehhmrckkfazh.supabase.co/storage/v1/object/public/bundle-files/bundles/UUID/filename.pdf
```

---

## 🧪 PART 11: TESTING BEFORE GOING LIVE

### Test Checklist

- [ ] **Homepage loads**: `https://yourdomain.com`
- [ ] **Shop page works**: `/shop`
- [ ] **Bundle pages load**: `/bundles`
- [ ] **Admin login**: `/admin` → Can login
- [ ] **Admin dashboard**: View products, orders, stats
- [ ] **Stripe payment**: Complete test payment
  - Test card: `4242 4242 4242 4242`
  - Any future date, any CVC
- [ ] **Webhook delivery**: Check Stripe → Webhooks → Test endpoint
- [ ] **Bundle files download**: Purchase bundle, try downloading files
- [ ] **Email notifications**: Receive order confirmation
- [ ] **Mobile responsive**: Test on mobile devices
- [ ] **API endpoints**: Test all `/api/*` routes

### Performance Testing

```bash
# From local machine, test remote server
curl -I https://yourdomain.com
# Should return 200 OK with fast response time

# Test API endpoint
curl -X GET https://yourdomain.com/api/products
# Should return products data
```

---

## 🚨 PART 12: MONITORING & MAINTENANCE

### Enable Logging

Add monitoring to Hostinger or use external service:

1. **PM2 Monitoring** (if using PM2):
   ```bash
   pm2 web  # Starts web dashboard on port 9615
   ```

2. **Hostinger Application Logs**:
   - Check logs in Hostinger Panel
   - Monitor CPU, Memory usage

3. **External Monitoring** (Recommended):
   - [UptimeRobot](https://uptimerobot.com) - Free monitoring
   - [Papertrail](https://www.papertrailapp.com/) - Log aggregation
   - [LogRocket](https://logrocket.com/) - Frontend monitoring

### Add UptimeRobot Monitoring

1. Create account at [UptimeRobot](https://uptimerobot.com)
2. Add new monitor:
   - **Monitor Type**: HTTPS
   - **URL**: `https://yourdomain.com`
   - **Interval**: 5 minutes
   - Receive alerts if down

### Regular Backups

```bash
# Backup Supabase database weekly
# In Supabase Dashboard → Database → Backups

# Backup application files weekly
# Use Hostinger's backup feature or manually download
```

### Security Checks

- [ ] Enable HTTPS (SSL/TLS) - Usually automatic
- [ ] Update dependencies monthly: `npm update`
- [ ] Review admin access logs
- [ ] Rotate API keys quarterly
- [ ] Enable two-factor authentication on accounts

---

## 📞 PART 13: TROUBLESHOOTING

### Issue: Application won't start

```bash
# Check logs
pm2 logs alf-launch

# Common causes:
# 1. Missing environment variables
# 2. Port already in use
# 3. Node version mismatch

# Fix: Ensure .env has all required variables
cat .env
```

### Issue: Build fails on Hostinger

```bash
# Test build locally first
npm run build

# Check for errors
npm run lint

# Clear and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Issue: Stripe webhook not working

1. Verify webhook endpoint URL in Stripe: `https://yourdomain.com/api/stripe-webhook`
2. Check webhook secret in `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
3. Test webhook delivery in Stripe Dashboard
4. Check application logs for errors

### Issue: Supabase connection fails

```bash
# Verify credentials in .env
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl -X GET https://wrkrfzjwehhmrckkfazh.supabase.co/rest/v1/products \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Issue: Files not downloading

1. Check file URLs in Supabase Storage
2. Verify bucket permissions are public
3. Test direct URL access: `https://...supabase.co/storage/v1/object/public/bundle-files/...`

---

## 📊 PART 14: POST-DEPLOYMENT ADMIN TASKS

### 1. Setup Admin Users

```bash
# Create admin user in Supabase
# Either via Supabase Dashboard or API

# Or seed via script
node seed-admin-users.js
```

### 2. Verify Bundle Data

```bash
# Confirm all 500 bundles uploaded
node seed-all-bundles.js

# Confirm all files uploaded
node seed-bundle-files.js ./bundle-files
```

### 3. Monitor First Orders

- [ ] Place test order
- [ ] Verify Stripe captures payment
- [ ] Confirm webhook triggers
- [ ] Check order in admin panel
- [ ] Verify customer receives download link

### 4. Setup Analytics (Optional)

Add to [app/layout.tsx](app/layout.tsx):

```typescript
// Google Analytics
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=GA_ID`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_ID');`}
</Script>
```

---

## ✅ FINAL DEPLOYMENT CHECKLIST

### Before Going Live
- [ ] Domain name pointing to Hostinger
- [ ] SSL certificate installed (auto)
- [ ] All environment variables set
- [ ] Stripe live keys configured
- [ ] Webhooks tested and working
- [ ] Database tables created
- [ ] Bundle files uploaded
- [ ] Admin user created
- [ ] Email system configured
- [ ] All tests passed
- [ ] Monitoring setup
- [ ] Backup system enabled
- [ ] Team notified of launch

### Day 1 After Launch
- [ ] Monitor application logs
- [ ] Test payment processing
- [ ] Verify emails sending
- [ ] Check admin panel access
- [ ] Monitor CPU/Memory usage
- [ ] Share live URL with stakeholders

### Week 1 After Launch
- [ ] Monitor for any errors
- [ ] Gather user feedback
- [ ] Check analytics
- [ ] Verify all integrations working
- [ ] Plan first update/maintenance

---

## 🔗 QUICK COMMAND REFERENCE

```bash
# Build project
npm run build

# Start server locally
npm start

# Development mode
npm run dev

# Seed database
node seed-all-bundles.js
node seed-bundle-files.js ./bundle-files
node seed-admin-users.js

# Deploy (via Git)
git add .
git commit -m "Production deployment"
git push origin production

# Check status (on Hostinger)
pm2 status
pm2 logs alf-launch
pm2 restart alf-launch

# Check Node version
node --version

# List installed packages
npm list --depth=0
```

---

## 📞 HOSTINGER SUPPORT RESOURCES

- **Hostinger Help Center**: https://support.hostinger.com
- **Node.js Hosting Docs**: https://support.hostinger.com/en/articles/4195650-how-to-deploy-node-js-application
- **Live Chat Support**: Available in control panel
- **Email Support**: support@hostinger.com

---

## 🎉 YOU'RE READY!

Your Next.js website with admin panels, Stripe payments, and 500 bundles is now live on Hostinger!

**Summary of what you've deployed:**
✅ Next.js production application  
✅ Admin dashboard at `/admin`  
✅ Stripe payment processing  
✅ 500 state/program bundles with downloadable files  
✅ Supabase PostgreSQL database  
✅ Automated webhooks and integrations  
✅ Full monitoring and logging  

**Next steps:**
1. Share live URL with users
2. Create marketing content
3. Monitor analytics
4. Gather feedback for improvements
5. Plan feature updates

---

**Last Updated**: May 27, 2026
**Version**: 1.0
**Project**: ALF Launch
