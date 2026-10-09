# Course Enrollment Payment Flow Implementation Guide

## Overview

This guide documents the complete implementation of the $697 course enrollment payment flow with Stripe, automations, and SweetAlert confirmations.

## Implementation Summary

### ✅ What Was Implemented

1. **API Endpoint** - `/api/course-enrollment`
   - Creates Stripe checkout session for course enrollment
   - Captures customer email for Skool invite
   - Stores course-specific metadata

2. **Frontend Components** 
   - Updated `CoursePageHeroSection.tsx` with `handleEnrollClick` function
   - Integrated SweetAlert for confirmations
   - Added authentication check and email validation
   - Processing state management

3. **Success Page** - `/course/success`
   - Beautiful confirmation page with order details
   - Lists what customer gets access to
   - Next steps guidance
   - Links to dashboard

4. **Webhook Automations**
   - Extended `/api/stripe-webhook/route.ts` 
   - Detects course enrollments
   - Sends to GHL (Go High Level)
   - Triggers Skool course invite
   - Logs automation events

---

## User Flow

### Step 1: User Clicks "Enroll Now - $697"
```
User visits /course page
↓
User clicks "Enroll Now - $697" button
↓
handleEnrollClick() triggers
```

### Step 2: Authentication Check
```
If NOT authenticated:
  ↓
  SweetAlert shows "Login Required"
  ↓
  User clicks "Go to Login"
  ↓
  Redirects to home with login modal
  ↓
  localStorage saves "intendedAction" = "enroll-course"

If authenticated:
  ↓
  Continue to next step
```

### Step 3: Email Validation
```
If user.email exists:
  ↓
  Use existing email
  
If user.email missing:
  ↓
  SweetAlert prompts for email
  ↓
  Validates email format
  ↓
  User enters email and clicks "Continue to Payment"
```

### Step 4: Create Stripe Session
```
POST /api/course-enrollment
  ├─ Validate authentication token
  ├─ Create Stripe checkout session
  │  └─ Price: $697 (69700 cents)
  │  └─ Add metadata (user_id, enrollment_type, customer_email)
  │  └─ Set success/cancel URLs
  └─ Return session URL
```

### Step 5: Confirmation Modal
```
SweetAlert shows enrollment details:
  ├─ Course name
  ├─ Price: $697.00
  ├─ Customer email
  └─ What they'll get after payment:
     ├─ Instant access to all 11 modules
     ├─ Skool course invite email
     ├─ Private community access
     └─ Confirmation email

User choices:
  ├─ "Proceed to Payment" → window.location.href = stripeUrl
  └─ "Cancel" → Close modal, stay on page
```

### Step 6: Stripe Checkout
```
User redirected to Stripe hosted checkout
↓
User enters payment information
↓
Stripe processes payment
↓
Success: Webhook triggered
```

### Step 7: Backend Webhook Processing
```
Stripe webhook: checkout.session.completed
  ↓
  webhook endpoint receives event
  ↓
  Detects it's course enrollment (metadata.enrollment_type = "course")
  ↓
  Two automations trigger:
  
  1. Send to GHL (Go High Level):
     ├─ Contact email
     ├─ Contact name
     ├─ Course type
     ├─ Purchase ID
     └─ Timestamp
     ↓
     GHL tags contact as "course-enrolled"
     GHL adds to course pipeline
     GHL may trigger additional workflows
  
  2. Send Skool Invite:
     ├─ Customer email (from stripe payment)
     ├─ Customer name
     ├─ Course name
     └─ Purchase ID
     ↓
     Skool receives invite request
     Skool sends course invitation email
```

### Step 8: Success Page
```
Redirect to: /course/success?session_id={CHECKOUT_SESSION_ID}
↓
CourseSuccessClient verifies purchase
↓
Displays success page with:
  ├─ Checkmark icon
  ├─ Order details
  ├─ What customer has access to
  ├─ Next steps
  └─ Action buttons (Return to Course, Go to Dashboard)
```

---

## File Structure

```
app/
  ├─ api/
  │  ├─ course-enrollment/
  │  │  └─ route.ts (NEW - Creates Stripe session)
  │  └─ stripe-webhook/
  │     └─ route.ts (UPDATED - Added course automation)
  │
  ├─ course/
  │  ├─ components/
  │  │  ├─ CoursePageHeroSection.tsx (UPDATED - Button handler)
  │  │  └─ CourseSuccessClient.tsx (NEW - Success page)
  │  │
  │  └─ success/
  │     └─ page.tsx (NEW - Success page route)
```

---

## API Endpoints

### 1. POST /api/course-enrollment

**Purpose**: Create Stripe checkout session for course

**Request**:
```json
{
  "customerEmail": "user@example.com",
  "successUrl": "http://localhost:3000/course/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "http://localhost:3000/course?cancelled=true"
}
```

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Response**:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Error Responses**:
```json
{ "error": "Authentication required" }              // 401
{ "error": "Payment system not configured" }        // 500
{ "error": "Customer email is required" }           // 400
```

---

## Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Zapier Webhooks (for automations)
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...

# GHL (Go High Level)
GHL_WEBHOOK_URL=https://api.gohighlevel.com/webhooks/...

# Skool Invite (optional - uses ZAPIER_WEBHOOK_URL by default)
SKOOL_INVITE_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Database Changes (Optional)

If you want to track course enrollments, add to your database:

### purchases table additions:
```sql
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(50);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS course_type VARCHAR(100);
```

### profiles table additions:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enrolled_courses JSONB[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skool_invite_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ghl_tagged BOOLEAN DEFAULT FALSE;
```

---

## SweetAlert Modals

### Modal 1: Login Required
```
Title: "Login Required"
Message: "Please log in to enroll in the course"
Button: "Go to Login"
```

### Modal 2: Email Prompt (if needed)
```
Title: "Enter Your Email"
Input: Email field
Message: "We'll send your Skool course invite to this email"
Validator: Email format validation
```

### Modal 3: Enrollment Confirmation
```
Title: "Ready to Enroll?"
Shows:
  - Course name
  - Price: $697.00
  - Customer email
  - Benefits (4 items)
Buttons:
  - "Proceed to Payment"
  - "Cancel"
```

### Modal 4: Error Handling
```
Title: "Error"
Message: Error details from API
Button: "OK"
```

---

## Automation Flows

### GHL Automation Payload
```json
{
  "event_type": "course_enrollment",
  "contact_email": "user@example.com",
  "contact_name": "John Doe",
  "course_type": "operational-success-academy",
  "purchase_id": "purchase-id-uuid",
  "enrollment_date": "2024-06-17T10:30:00Z",
  "amount": 697,
  "stripe_session_id": "cs_test_..."
}
```

### Skool Automation Payload
```json
{
  "event": "course_enrollment_send_skool_invite",
  "customer_email": "user@example.com",
  "customer_name": "John Doe",
  "course_type": "operational-success-academy",
  "course_name": "Care Licensing Solutions Operational Success Academy",
  "purchase_id": "purchase-id-uuid",
  "enrollment_date": "2024-06-17T10:30:00Z"
}
```

---

## Testing the Flow

### 1. Test Authentication Check
```bash
# Without logging in
1. Navigate to /course
2. Click "Enroll Now - $697"
3. Expected: "Login Required" modal
4. Verify: localStorage has "intendedAction" = "enroll-course"
```

### 2. Test Email Collection
```bash
# With user.email = null
1. Login but ensure email field is empty
2. Click "Enroll Now - $697"
3. Expected: Email prompt modal
4. Enter: valid@example.com
5. Click: "Continue to Payment"
```

### 3. Test Stripe Checkout
```bash
# With valid user and email
1. Click "Enroll Now - $697"
2. Confirmation modal appears
3. Click "Proceed to Payment"
4. Expected: Redirected to Stripe checkout
5. Use Stripe test card: 4242 4242 4242 4242
6. Complete payment
```

### 4. Test Success Page
```bash
# After payment
1. Expected: Redirected to /course/success?session_id=...
2. Page shows loading state initially
3. After verification: Shows success with order details
4. Verify: Order ID, Amount, Date display correctly
```

### 5. Test Webhook Automations
```bash
# Check logs
1. Backend logs show course enrollment detected
2. Logs show GHL webhook sent successfully
3. Logs show Skool invite sent successfully
4. Check Zapier history for webhook deliveries
```

---

## Troubleshooting

### Problem: "Authentication required" error

**Solution**:
```typescript
// Ensure access token is being sent
const response = await fetch("/api/course-enrollment", {
  headers: {
    Authorization: `Bearer ${session?.access_token}`
  }
});
```

### Problem: Button not responding

**Solution**:
- Check if `isProcessing` state is stuck at `true`
- Verify SweetAlert library is loaded
- Check browser console for errors

### Problem: Webhook not triggering

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check Stripe Dashboard → Webhooks for failed attempts
3. Ensure webhook endpoint URL is correct
4. Check server logs for webhook processing errors

### Problem: Skool invite not sent

**Solution**:
1. Verify `ZAPIER_WEBHOOK_URL` or `SKOOL_INVITE_WEBHOOK_URL` is configured
2. Check Zapier history for delivery status
3. Verify email is being captured correctly from Stripe
4. Check webhook payload in Zapier logs

### Problem: Success page shows loading indefinitely

**Solution**:
1. Verify `session_id` parameter in URL
2. Check if purchase record was created in database
3. Verify API authentication token is valid
4. Check browser console for API errors

---

## Monitoring & Analytics

### Key Metrics to Track
- Total enrollments (daily/monthly)
- Success rate of payments
- Automation delivery rates (GHL + Skool)
- Drop-off rates at each step
- Email collection rate

### Logs to Monitor
```
// Success indicators:
"🎓 Course Enrollment Detected for user@example.com"
"📤 Sending course enrollment to GHL"
"✓ Successfully sent to GHL"
"📧 Sending Skool course invite to user@example.com"
"✓ Skool invite sent successfully"
```

---

## Security Considerations

1. **Authentication Required**: Course enrollment requires authenticated user
2. **Email Validation**: Email is validated before Stripe session creation
3. **Webhook Signature Verification**: Stripe webhook signature is verified
4. **CORS**: API endpoint requires proper CORS headers
5. **Rate Limiting**: Consider adding rate limiting to prevent abuse

---

## Future Enhancements

1. **Payment Plans**: Add monthly/annual subscription options
2. **Discount Codes**: Support promo codes for course enrollment
3. **Cohort Scheduling**: Group enrollments by start dates
4. **Course Progress Tracking**: Track which modules users complete
5. **Certificate Generation**: Auto-generate certificates on completion
6. **Referral Program**: Add referral bonuses for new enrollments

---

## Support & Maintenance

- Monitor Stripe dashboard for failed payments
- Check Zapier/GHL webhook delivery logs weekly
- Review enrollment metrics in analytics
- Test flow quarterly to ensure no regressions

---

## Appendix: Code References

- **Main Button**: [CoursePageHeroSection.tsx](app/course/components/CoursePageHeroSection.tsx#L232)
- **API Endpoint**: [course-enrollment/route.ts](app/api/course-enrollment/route.ts)
- **Success Page**: [CourseSuccessClient.tsx](app/course/components/CourseSuccessClient.tsx)
- **Webhook Handler**: [stripe-webhook/route.ts](app/api/stripe-webhook/route.ts)
- **Automation Function**: [stripe-webhook/route.ts](app/api/stripe-webhook/route.ts#handleCourseEnrollmentAutomation)

---

## Questions?

If you have questions about this implementation:
1. Check the troubleshooting section above
2. Review the inline code comments
3. Check Stripe logs for payment errors
4. Check Zapier/GHL logs for automation issues
