# Care Licensing Solutions - Membership Platform

A comprehensive membership platform built with Next.js, featuring user authentication, Stripe payments, automated product delivery, and integrations with Zapier, Skool, and GoHighLevel.

## Features

- 🔐 **Supabase Authentication** - Secure user registration and login
- 💳 **Stripe Checkout** - Seamless payment processing
- 🎯 **Product Access Control** - Digital product delivery system
- 🤖 **Zapier Automation** - Automated workflows for user onboarding
- 👥 **Skool Integration** - Community access management
- 📊 **GoHighLevel CRM** - Customer relationship management
- 📱 **Responsive Dashboard** - User product access and management
- 🌐 **Vercel Deployment** - Optimized for serverless deployment

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Checkout
- **Automation**: Zapier
- **Community**: Skool
- **CRM**: GoHighLevel
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd alf-launch-project
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your keys:

```bash
cp .env.local.example .env.local
```

Fill in the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Integrations
ZAPIER_WEBHOOK_URL=your_zapier_webhook_url
GOHIGHLEVEL_API_KEY=your_gohighlevel_api_key
SKOOL_COMMUNITY_ID=your_skool_community_id
```

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API and copy your project URL and keys
3. Go to SQL Editor and run the schema from `supabase-schema.sql`
4. Run the seed script from `seed-products.js` in SQL Editor
5. (Optional) Create initial admin and customer accounts by running `node seed-admin-users.js` with your Supabase env vars set

### 4. Stripe Setup

1. Create a Stripe account at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Copy your API keys to `.env.local`
3. Create a webhook endpoint:
   - Go to Webhooks in Stripe Dashboard
   - Add endpoint: `https://yourdomain.com/api/stripe-webhook`
   - Select events: `checkout.session.completed`, `payment_intent.payment_failed`
   - Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 5. Zapier Setup

1. Create a Zapier account
2. Create a new Zap with "Webhooks by Zapier" as trigger
3. Set up the webhook URL in your `.env.local`
4. Add steps for:
   - Adding users to Skool using `skool_group_id` or `skool_course_id`
   - Creating contacts in GoHighLevel and applying `ghl_tag`
   - Sending welcome emails
   - Using the webhook payload fields `customer_email`, `customer_first_name`, `customer_last_name`, `products`, and `purchase_date`

### 6. GoHighLevel Setup

1. Get your API key from GoHighLevel dashboard
2. Add it to `.env.local`

### 7. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following main tables:

- `profiles` - User profiles (extends auth.users)
- `products` - Available products/courses
- `purchases` - Payment transactions
- `user_products` - User access to products
- `webhooks` - Stripe webhook logging

## API Routes

- `POST /api/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe-webhook` - Handle Stripe webhooks
- `GET /api/verify-purchase` - Verify purchase completion

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Update webhook URLs to production domain
4. Deploy!

### Environment Variables for Production

Make sure to update these for production:

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
# Update webhook URLs in Stripe and Zapier
```

## User Flow

1. **Signup/Login** → User creates account with Supabase Auth
2. **Browse Products** → User selects products from shop
3. **Checkout** → Stripe Checkout session created
4. **Payment** → User completes payment on Stripe
5. **Webhook Processing** → Stripe sends webhook to our API
6. **Access Granted** → Product access added to database
7. **Automation** → Zapier triggers Skool and GoHighLevel integration
8. **Dashboard Access** → User can access products in dashboard

## Testing

### Stripe Test Cards

- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

### Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## Support

For issues or questions:

1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Check Supabase dashboard for database issues
4. Review Stripe dashboard for payment issues
5. Check Zapier execution history for automation issues

## License

This project is private and proprietary.