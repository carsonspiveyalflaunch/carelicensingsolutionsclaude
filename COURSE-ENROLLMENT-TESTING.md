# Course Enrollment: Local Testing Guide

## Prerequisites

1. **Stripe Account**: https://stripe.com
2. **Zapier Account**: https://zapier.com (optional, for automations)
3. **Local Development Server**: Running Next.js dev server
4. **Authenticated User**: Test user account in your app

---

## Step 1: Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click "Developers" → "API Keys"
3. Copy your **Secret Key** (starts with `sk_test_`)
4. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (set this later)
   ```

---

## Step 2: Setup Stripe Webhook Locally

### Option A: Using Stripe CLI (Recommended)

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   choco install stripe-cli
   
   # Linux
   curl https://raw.githubusercontent.com/stripe/stripe-cli/master/install.sh -s | sudo bash
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   # Paste your Stripe API key when prompted
   ```

3. **Forward Webhook Events**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
   
   This will output your webhook signing secret:
   ```
   Ready! Your webhook signing secret is: whsec_...
   ```

4. **Add to `.env.local`**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Keep the terminal open** while testing

### Option B: Manual Webhook Testing

If you can't use Stripe CLI:

1. Use a tunneling service like [ngrok](https://ngrok.com)
2. Create webhook endpoint in Stripe Dashboard manually
3. Test events via Stripe Dashboard

---

## Step 3: Setup Zapier Webhooks (Optional)

1. **Create Zapier Account**: https://zapier.com/sign-up
2. **Create a New Zap**:
   - Trigger: "Webhooks by Zapier" → "Catch Hook"
   - Copy the webhook URL (looks like `https://hooks.zapier.com/hooks/catch/...`)

3. **Add to `.env.local`**:
   ```
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
   ```

4. **Test the Webhook**:
   - In Zapier, you'll see a "Send Test Data" option
   - Leave the Zapier page open while testing

---

## Step 4: Verify Environment Variables

Your `.env.local` should have:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Zapier (optional)
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Step 5: Start Development Server

```bash
npm run dev
# Server starts at http://localhost:3000
```

---

## Test Scenario 1: Complete Payment Flow

### Prerequisites
- [ ] Logged in as test user
- [ ] Stripe CLI listening for webhooks
- [ ] All env variables set

### Steps

1. **Navigate to Course Page**
   ```
   Go to: http://localhost:3000/course
   ```

2. **Click "Enroll Now - $697"**
   ```
   Expected: "Ready to Enroll?" confirmation modal
   ```

3. **Review Modal Details**
   ```
   Should show:
   - Course: Care Licensing Solutions Operational Success Academy
   - Price: $697.00
   - Email: your@email.com
   - 4 benefits listed
   ```

4. **Click "Proceed to Payment"**
   ```
   Expected: Redirected to Stripe checkout page
   ```

5. **Complete Payment**
   ```
   Use Test Card: 4242 4242 4242 4242
   - Expiry: Any future date (e.g., 12/26)
   - CVC: Any 3 digits (e.g., 123)
   - Name: Any name (e.g., Test User)
   
   Click "Pay" or "Complete payment"
   ```

6. **Verify Success Page**
   ```
   Expected URL: http://localhost:3000/course/success?session_id=cs_test_...
   
   Should show:
   - Checkmark icon ✓
   - "Welcome to the Academy!"
   - Order ID
   - Amount: $697.00
   - Order date
   - Status: "Completed" ✓
   - 4 access cards (Modules, Community, Resources, Lifetime)
   ```

7. **Check Terminal for Webhook Event**
   
   In Stripe CLI terminal, you should see:
   ```
   2024-06-17 10:30:45  --> checkout.session.completed [cs_test_...]
   ```

8. **Check Server Logs**
   
   In Next.js terminal, you should see:
   ```
   📦 Processing checkout for user {user_id} with 1 item(s)
   🎓 Course Enrollment Detected for {email}
   📤 Sending course enrollment to GHL
   📧 Sending Skool course invite to {email}
   ```

---

## Test Scenario 2: Without Authentication

### Steps

1. **Logout** (if logged in)
2. **Navigate to Course Page**: `/course`
3. **Click "Enroll Now - $697"**

### Expected
```
Modal appears:
Title: "Login Required"
Message: "Please log in to enroll in the course"
Button: "Go to Login"
```

4. **Click "Go to Login"**
   ```
   Expected: Redirected to home with login modal
   Verify: localStorage has "intendedAction" = "enroll-course"
   ```

---

## Test Scenario 3: Email Validation

### Prerequisites
- User logged in WITHOUT email address

### Steps

1. **Click "Enroll Now - $697"**

### Expected
```
Modal appears:
Title: "Enter Your Email"
Input: Email field
Label: "We'll send your Skool course invite to this email"
```

2. **Try Invalid Email** (e.g., `notanemail`)
   ```
   Expected: "Please enter a valid email" error
   ```

3. **Enter Valid Email** (e.g., `test@example.com`)
   ```
   Expected: Validation passes
   ```

4. **Click "Continue to Payment"**
   ```
   Expected: Confirmation modal with your email
   ```

---

## Test Scenario 4: Verify Webhook Delivery

### Prerequisites
- [ ] Stripe CLI listening
- [ ] Zapier webhook set up (optional)

### Steps

1. **Complete a test payment** (see Scenario 1)

2. **Check Stripe CLI Output**
   ```bash
   # Terminal where you ran: stripe listen --forward-to localhost:3000/api/stripe-webhook
   
   Should show:
   --> checkout.session.completed [cs_test_...]
   <-- [200] POST http://localhost:3000/api/stripe-webhook
   ```

3. **Check Server Logs** (Next.js terminal)
   ```
   Look for:
   "📦 Processing checkout for user {id}"
   "✓ Resolved product_id"
   "✓ Granted access to product"
   "🎓 Course Enrollment Detected"
   "📤 Sending course enrollment to GHL"
   "✓ Successfully sent to GHL"
   ```

4. **Check Zapier** (if configured)
   - Go to your Zapier webhook page
   - Look for a new event in the webhook history
   - Click to see the payload

---

## Test Scenario 5: Error Handling

### Test Invalid Stripe Key

1. **Change `STRIPE_SECRET_KEY`** to invalid value
2. **Try to enroll**
3. **Expected**: Error in server logs, SweetAlert error message

### Test Network Error

1. **Temporarily disconnect internet**
2. **Try to enroll**
3. **Expected**: Network error message in SweetAlert

### Test Cancelled Payment

1. **Complete all steps until Stripe checkout**
2. **Click "Cancel"** on Stripe checkout page
3. **Expected**: Redirected to `/course?cancelled=true`

---

## Monitoring During Testing

### Terminal 1: Stripe CLI (Keep Running)
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

### Terminal 2: Next.js Dev Server
```bash
npm run dev
```

### Terminal 3: Watch Logs
```bash
# Watch for webhook events
tail -f /path/to/logs
```

---

## Stripe Test Cards

| Card | Use | Behavior |
|------|-----|----------|
| `4242 4242 4242 4242` | ✓ Success | Payment succeeds |
| `4000 0000 0000 9995` | ✗ Failure | Payment declined |
| `4000 0000 0000 0002` | ✗ Declined | Card declined |
| `4100 0000 0000 0019` | ✗ CVC Error | CVC fails validation |

---

## Database Verification

After a successful test payment, verify in your database:

### Check `purchases` table
```sql
SELECT * FROM purchases 
WHERE status = 'completed' 
ORDER BY created_at DESC 
LIMIT 1;
```

Should show:
- `status`: 'completed'
- `amount`: 697 (or with tax)
- `metadata`: Contains course enrollment info

### Check `user_products` table
```sql
SELECT * FROM user_products 
WHERE user_id = '{your_user_id}'
ORDER BY created_at DESC 
LIMIT 1;
```

Should show:
- `is_active`: true
- `granted_at`: Recent timestamp

---

## Common Test Issues

### Issue: Webhook Not Firing
```
Solution:
1. Verify Stripe CLI is running
2. Check STRIPE_WEBHOOK_SECRET is correct
3. Look for errors in Stripe CLI output
4. Restart Stripe CLI: Ctrl+C and rerun
```

### Issue: "Payment Failed" Error
```
Solution:
1. Check if using valid test card (4242 4242...)
2. Verify Stripe keys are correct
3. Check browser console for error details
4. Try different test card
```

### Issue: Success Page Shows Loading Indefinitely
```
Solution:
1. Check if session_id is in URL
2. Verify webhook was processed (check logs)
3. Check if purchase was created in database
4. Check browser console for API errors
```

### Issue: Email Not Showing in Zapier
```
Solution:
1. Verify ZAPIER_WEBHOOK_URL is correct
2. Check Zapier webhook test data received
3. Verify email field is being sent in webhook
4. Check Zapier zap is active
```

---

## Test Checklist

- [ ] Login flow works
- [ ] Unauthenticated user sees login prompt
- [ ] Email validation works
- [ ] Confirmation modal appears with correct details
- [ ] Stripe checkout loads
- [ ] Test card payment succeeds
- [ ] Webhook fires successfully
- [ ] Success page loads and shows order details
- [ ] Server logs show course enrollment detected
- [ ] Zapier receives webhook (if configured)
- [ ] Database records created correctly
- [ ] Error handling works for failed scenarios

---

## Performance Notes

- [ ] Page load time: Should be < 2 seconds
- [ ] Stripe checkout redirect: Should be < 3 seconds
- [ ] Webhook processing: Should be < 5 seconds
- [ ] Success page load: Should be < 3 seconds

---

## Next Steps

Once all tests pass:

1. [ ] Merge to development branch
2. [ ] Deploy to staging
3. [ ] Run full end-to-end tests on staging
4. [ ] Deploy to production
5. [ ] Monitor first 24 hours
6. [ ] Announce to users

---

## Need Help?

1. Check server logs for error messages
2. Check browser console (F12) for client errors
3. Review `COURSE-ENROLLMENT-IMPLEMENTATION.md` for detailed docs
4. Check Stripe Dashboard for payment failures
5. Review Zapier logs for webhook delivery status

Good luck with your testing! 🚀
