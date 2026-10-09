# ⚡ Quick Deployment Checklist - Copy & Paste Version

## Pre-Deployment (5 minutes)

```bash
# 1. Verify build works locally
npm run build

# 2. Check Node version (need 18+)
node --version
```

## Environment Setup (5 minutes)

**Create `.env.production` in project root with:**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
NEXT_PUBLIC_SUPABASE_URL=https://wrkrfzjwehhmrckkfazh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=REDACTED_SET_IN_SERVER_ENVIRONMENT
SUPABASE_SERVICE_ROLE_KEY=REDACTED_SET_IN_SERVER_ENVIRONMENT
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_ID
GOHIGHLEVEL_API_KEY=YOUR_KEY
```

## Hostinger Setup (10 minutes)

**In Hostinger Control Panel:**

1. **Applications** → **Node.js** → **Create Application**
   - Name: `alf-launch`
   - Node Version: `20.x`
   - Port: `3000`
   - Root Directory: `/` or `/public`

2. **Domains** → Select domain → **Point to Application** → Choose app above

3. **Application Settings** → **Deployment**
   - Method: Git or Manual Upload
   - Branch: `production`

## Deployment Method A: Git (Easiest)

```bash
# 1. Create production branch
git checkout -b production
git add .
git commit -m "Prepare for Hostinger production deployment"

# 2. Push to Hostinger or GitHub
git push origin production

# 3. In Hostinger panel: Deploy Now button
# Hostinger automatically runs:
# - git clone
# - npm install
# - npm run build
# - npm start
```

## Deployment Method B: Manual SFTP Upload

```bash
# 1. Install dependencies
npm install --production

# 2. Build project
npm run build

# 3. Connect via SFTP (FileZilla or WinSCP)
# Upload everything EXCEPT:
# - node_modules/
# - .next/ (will rebuild)
# - .env (use .env.production renamed to .env)

# 4. SSH into Hostinger
ssh user@hostinger.com
cd public_html

# 5. Install and start
npm install
npm run build
npm start
```

## Setup Process Manager (PM2)

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Create ecosystem.config.js (copy from HOSTINGER-DEPLOYMENT-GUIDE.md)

# 3. Start application
pm2 start ecosystem.config.js

# 4. Setup auto-restart on reboot
pm2 startup
pm2 save

# 5. View logs
pm2 logs alf-launch
```

## Database & Files Setup (10-15 minutes)

```bash
# 1. Verify Supabase tables created
# In Supabase Dashboard → Editor → Check tables exist

# 2. Create admin user (on Hostinger via SSH)
node seed-admin-users.js

# 3. Seed all 500 bundles (REQUIRED)
node seed-all-bundles.js

# 4. Upload all bundle files (REQUIRED - takes ~10 min)
node seed-bundle-files.js ./bundle-files

# Monitor upload in Supabase Storage bucket "bundle-files"
```

## Stripe Webhook Setup (5 minutes)

**In Stripe Dashboard:**

1. **Developers** → **Webhooks** → **Create endpoint**
2. **URL**: `https://yourdomain.com/api/stripe-webhook`
3. **Events**: 
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.refunded
4. Copy **Signing Secret** → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

**Restart app:**
```bash
pm2 restart alf-launch
```

## Testing & Verification (10 minutes)

```bash
# Test homepage
curl -I https://yourdomain.com
# Should return 200 OK

# Test API
curl https://yourdomain.com/api/products | head -20

# Test admin login (via browser)
# https://yourdomain.com/admin
# Use admin email/password from seed-admin-users.js

# Test Stripe payment (via browser)
# Go to /shop, add bundle, checkout
# Use test card: 4242 4242 4242 4242, any future date, any CVC

# Test webhook
# In Stripe Dashboard → Webhooks → Select your endpoint → Send test
# Should show successful delivery
```

## Enable Monitoring

```bash
# Option 1: PM2 Dashboard
pm2 web
# Access at http://localhost:9615 (if SSH tunnel)

# Option 2: Hostinger logs
# View in Hostinger Panel → Application → Logs

# Option 3: External (Recommended)
# Setup UptimeRobot.com for uptime monitoring
# https://uptimerobot.com
```

## Troubleshooting

```bash
# Check if app is running
pm2 status

# View logs for errors
pm2 logs alf-launch --tail 100

# Restart if needed
pm2 restart alf-launch

# Check Node modules installed
npm list --depth=0

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $STRIPE_SECRET_KEY
```

## Important Notes

⚠️ **Do NOT forget these:**
1. Update `.env.production` with LIVE Stripe keys (pk_live_, sk_live_)
2. Seed bundles BEFORE going live: `node seed-all-bundles.js`
3. Upload bundle files: `node seed-bundle-files.js ./bundle-files`
4. Test Stripe webhook delivery
5. Create admin user
6. Enable HTTPS (automatic on Hostinger)
7. Point domain to Hostinger nameservers or CNAME

## Success Indicators

✅ Application is running
✅ Homepage loads quickly
✅ Admin dashboard accessible
✅ Test payment processes
✅ Webhook delivers successfully
✅ Bundle files download
✅ PM2 shows "online" status
✅ Logs show no errors

## After Going Live

1. Monitor logs daily for first week
2. Test purchase flow manually
3. Check Stripe dashboard for payments
4. Review admin stats
5. Gather user feedback
6. Plan improvements

---

**Typical Timeline:**
- Hostinger setup: 5-10 min
- Git/Upload files: 5-10 min
- Install & build: 3-5 min
- Database setup: 10-15 min
- Testing: 10 min
- **Total: ~45 minutes**
