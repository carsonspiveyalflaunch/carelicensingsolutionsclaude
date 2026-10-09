# 🎓 Course Enrollment Payment System - Quick Start

## What's New

The "Enroll Now - $697" button on the course page now opens a full payment flow with:

✅ Stripe payment processing
✅ SweetAlert confirmations  
✅ Skool course invite email
✅ Go High Level (GHL) automation
✅ Success page confirmation

---

## How It Works

```
Click "Enroll Now"
    ↓
Answer email & confirm
    ↓
Pay $697 on Stripe
    ↓
Automations trigger (GHL + Skool)
    ↓
Get instant course access
```

---

## Setup (5 minutes)

### 1. Add Environment Variables

Add these to your `.env.local`:

```env
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_ID/...
```

Optional:
```env
GHL_WEBHOOK_URL=https://api.gohighlevel.com/webhooks/...
SKOOL_INVITE_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
```

### 2. Configure Zapier (Optional but Recommended)

1. Create Zapier account: https://zapier.com
2. Create new Zap:
   - **Trigger**: Webhooks by Zapier → "Catch Hook"
   - **Action**: Send email or integrate with Skool
3. Copy webhook URL to `.env.local`

### 3. Deploy

```bash
npm run dev  # Local testing
# or
git push     # Deploy to production
```

---

## Files Modified/Created

### New Files
- `app/api/course-enrollment/route.ts` - Payment endpoint
- `app/course/components/CourseSuccessClient.tsx` - Success page
- `app/course/success/page.tsx` - Success route

### Updated Files
- `app/course/components/CoursePageHeroSection.tsx` - Button handler
- `app/api/stripe-webhook/route.ts` - Automations

---

## Testing Locally

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook listener**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

3. **Test the flow**:
   - Go to http://localhost:3000/course
   - Click "Enroll Now - $697"
   - Use test card: `4242 4242 4242 4242`
   - Verify success page appears

See `COURSE-ENROLLMENT-TESTING.md` for detailed testing.

---

## Key Features

| Feature | Details |
|---------|---------|
| **Price** | $697 |
| **Payment Method** | Stripe |
| **Email Capture** | From user or prompted |
| **Automations** | GHL + Skool |
| **Confirmation** | Success page + email |
| **Mobile** | Fully responsive |

---

## User Experience

### For Logged-In Users

```
1. Click "Enroll Now - $697"
2. See confirmation modal with price & benefits
3. Click "Proceed to Payment"
4. Pay on Stripe
5. Get instant access
6. Receive confirmation email
7. Receive Skool course invite
```

### For Non-Logged-In Users

```
1. Click "Enroll Now - $697"
2. See "Login Required" modal
3. Click "Go to Login"
4. Login
5. Same flow as above
```

---

## Automation Flow

After payment:

```
✓ Purchase created in database
✓ Course access granted
✓ GHL receives webhook (email, name, course type)
✓ Skool receives invite webhook
✓ Customer gets confirmation email
✓ Customer gets Skool invite email
✓ GHL tags contact as "course-enrolled"
```

---

## Troubleshooting

### "Login Required" Error
→ Make sure you're logged in

### "Email Required" Error
→ Provide valid email address

### Payment Declined
→ Use Stripe test card: `4242 4242 4242 4242`

### Webhook Not Firing
→ Make sure Stripe webhook secret is correct

### Success Page Loading Forever
→ Check if payment actually completed on Stripe

For more help: See `COURSE-ENROLLMENT-TESTING.md`

---

## Monitoring

Check these in Stripe Dashboard:
- Successful payments ✓
- Failed payments ✗
- Webhook deliveries

Check these in Zapier:
- Webhook receipts
- Automation execution
- Error logs

---

## Next Steps

1. ✅ Add environment variables
2. ✅ Setup Zapier webhook (optional)
3. ✅ Test locally
4. ✅ Deploy to production
5. ✅ Monitor first enrollments

---

## Documentation

- **Full Guide**: See `COURSE-ENROLLMENT-IMPLEMENTATION.md`
- **Testing**: See `COURSE-ENROLLMENT-TESTING.md`
- **Checklist**: See `COURSE-ENROLLMENT-CHECKLIST.md`

---

## Support

If something isn't working:

1. Check server logs for errors
2. Check Stripe dashboard for payment status
3. Check Zapier history for webhook delivery
4. Review the troubleshooting section
5. Check the full documentation files

---

## Cost

- Stripe: 2.9% + $0.30 per transaction
- Zapier: Depends on your plan
- Everything else: Included

---

## What Customers Get

After payment:
- ✓ Instant access to all 11 course modules
- ✓ Private community (Skool)
- ✓ Downloadable resources
- ✓ Lifetime access
- ✓ Certificate of completion (future)

---

## Questions?

1. Review documentation files
2. Check error logs
3. Test with test card locally
4. Review the implementation guide

Happy enrolling! 🎓
