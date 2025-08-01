# 🔍 COLDPILOT APP FLOW AUDIT CHECKLIST

## 📋 COMPLETE USER JOURNEY TESTING

### **PHASE 1: MARKETING TO CHECKOUT** 🌐

#### **1.1 Marketing Site (coldpilot.tech)**

- [ ] **Landing Page Loads**: All content renders properly
- [ ] **Pricing Section**: All plans display correctly
- [ ] **Button Functionality**: All "Get Started" buttons clickable
- [ ] **UTM Tracking**: Test with `?utm_source=test&utm_campaign=audit`
- [ ] **Mobile Responsive**: Test on mobile devices

**Test URLs:**

```
https://coldpilot.tech/?utm_source=audit&utm_campaign=flow_test
```

#### **1.2 Checkout Initiation**

- [ ] **Basic Monthly**: Button creates checkout session
- [ ] **Pro Yearly**: Button creates checkout session
- [ ] **Agency Plans**: All tiers work correctly
- [ ] **Loading States**: Buttons show "Loading..." feedback
- [ ] **Error Handling**: Failed requests show user-friendly errors

**Test Command:**

```bash
# Test checkout API directly
curl -X POST https://app.coldpilot.tech/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"plan":"pro","interval":"monthly","metadata":{"utm_source":"audit"}}'
```

#### **1.3 Stripe Integration**

- [ ] **Redirect to Stripe**: Proper checkout page loads
- [ ] **Payment Methods**: Cards, Apple Pay, Google Pay work
- [ ] **Trial Messaging**: "7-day free trial" shows for Pro/Agency
- [ ] **Success Redirect**: Returns to `app.coldpilot.tech/dashboard`
- [ ] **Cancel Redirect**: Returns to pricing page

---

### **PHASE 2: AUTHENTICATION FLOW** 🔐

#### **2.1 Sign-In Required**

- [ ] **Unauthenticated Access**: Redirects to sign-in page
- [ ] **Correct Domain**: Uses `https://app.coldpilot.tech/sign-in`
- [ ] **UI Styling**: Dark theme, Coldpilot branding
- [ ] **Google OAuth**: "Continue with Google" button works
- [ ] **Error States**: Invalid credentials handled gracefully

#### **2.2 Clerk Authentication**

- [ ] **Production Mode**: Using live Clerk keys
- [ ] **Domain Configuration**: All CNAME records verified
- [ ] **OAuth Callback**: Google login completes successfully
- [ ] **User Profile**: First name, last name, email captured
- [ ] **Session Management**: Stays logged in across tabs

**Test Clerk Setup:**

```bash
# Verify DNS records
dig clerk.coldpilot.tech CNAME
dig accounts.coldpilot.tech CNAME
```

---

### **PHASE 3: WEBHOOK & DATABASE SYNC** 💳

#### **3.1 Payment Processing**

- [ ] **Webhook Delivery**: Stripe sends events to `/api/stripe/webhooks`
- [ ] **Event Logging**: All events logged to `webhook_events` table
- [ ] **Signature Verification**: Webhooks authenticate properly
- [ ] **Retry Logic**: Failed webhooks retry correctly

#### **3.2 User Creation**

- [ ] **User Record**: Created in database with Clerk ID
- [ ] **Subscription Record**: Linked with Stripe data
- [ ] **Plan Assignment**: Correct plan (BASIC/PRO/AGENCY)
- [ ] **Trial Status**: Shows TRIALING for new Pro/Agency users
- [ ] **Metadata Capture**: UTM data saved correctly

**Database Verification:**

```sql
-- Check recent user creations
SELECT u.email, s.plan, s.status, s.currentPeriodEnd
FROM users u
JOIN subscriptions s ON u.id = s.userId
ORDER BY u.createdAt DESC
LIMIT 10;

-- Check webhook events
SELECT eventType, status, createdAt, handledAt
FROM webhook_events
ORDER BY createdAt DESC
LIMIT 20;
```

---

### **PHASE 4: DASHBOARD EXPERIENCE** 🖥️

#### **4.1 Dashboard Landing**

- [ ] **Access Control**: Only authenticated users can access
- [ ] **Subscription Status**: Displays current plan correctly
- [ ] **Billing Badge**: Shows trial countdown or plan name
- [ ] **Feature Access**: Pro features visible for Pro users
- [ ] **Navigation**: All menu items functional

#### **4.2 Core Features**

- [ ] **Contacts Page**: Loads without errors
- [ ] **Conversations Page**: Displays properly
- [ ] **Analytics Page**: Charts and metrics render
- [ ] **Settings Page**: Subscription info accurate
- [ ] **Plan Restrictions**: Basic users can't access Pro features

#### **4.3 Billing Management**

- [ ] **Billing Portal**: "Manage Subscription" button works
- [ ] **Stripe Portal**: Redirects to Stripe billing portal
- [ ] **Return URL**: Comes back to settings page
- [ ] **Plan Changes**: Upgrades/downgrades work
- [ ] **Cancellation**: Can cancel subscription

---

### **PHASE 5: EDGE CASES & ERROR HANDLING** ⚠️

#### **5.1 Payment Failures**

- [ ] **Declined Cards**: Proper error messaging
- [ ] **Expired Cards**: Retry flow works
- [ ] **Webhook Failures**: Logged and retried
- [ ] **Partial Payments**: Handled correctly
- [ ] **Refunds**: Process properly

#### **5.2 Authentication Edge Cases**

- [ ] **Multiple Devices**: Login syncs across devices
- [ ] **Session Expiry**: Re-authentication prompts
- [ ] **Account Conflicts**: Existing email handling
- [ ] **Social Login Failures**: Fallback options
- [ ] **Network Issues**: Graceful degradation

#### **5.3 Database Consistency**

- [ ] **Orphaned Records**: No users without subscriptions
- [ ] **Data Integrity**: Foreign key constraints work
- [ ] **Concurrent Updates**: No race conditions
- [ ] **Backup Recovery**: Data restoration works

---

## 🚀 AUTOMATED TESTING SETUP

### **API Testing with Newman (Postman)**

```bash
# Install Newman CLI
npm install -g newman

# Run API test collection
newman run coldpilot-api-tests.postman_collection.json \
  --environment production.postman_environment.json
```

### **End-to-End Testing with Playwright**

```javascript
// e2e-flow-test.js
const { test, expect } = require("@playwright/test");

test("Complete signup flow", async ({ page }) => {
  // 1. Start from marketing site
  await page.goto("https://coldpilot.tech");

  // 2. Click Pro monthly plan
  await page.click('[data-plan="pro"][data-interval="monthly"]');

  // 3. Complete Stripe checkout (test mode)
  await page.waitForURL("**/checkout.stripe.com/**");

  // 4. Verify redirect to dashboard
  await page.waitForURL("**/dashboard**");
  await expect(page.locator("h1")).toContainText("Dashboard");
});
```

### **Database Monitoring Queries**

```sql
-- Monitor webhook processing
SELECT
  eventType,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as success,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
FROM webhook_events
WHERE createdAt > NOW() - INTERVAL '24 hours'
GROUP BY eventType;

-- Check subscription health
SELECT
  plan,
  status,
  COUNT(*) as count
FROM subscriptions
GROUP BY plan, status;
```

---

## 🔧 REAL-TIME MONITORING TOOLS

### **Webhook Monitoring Dashboard**

```bash
# Watch webhook events in real-time
railway connect
# Then run in Railway console:
SELECT * FROM webhook_events ORDER BY createdAt DESC LIMIT 20;
```

### **Stripe Dashboard Monitoring**

- Monitor payments: https://dashboard.stripe.com/payments
- Check webhooks: https://dashboard.stripe.com/webhooks
- View customers: https://dashboard.stripe.com/customers

### **Clerk User Analytics**

- User signups: https://dashboard.clerk.com/apps/[app-id]/users
- Authentication logs: Check sign-in events

---

## 📊 PERFORMANCE AUDIT

### **Lighthouse Testing**

```bash
# Test marketing site performance
npx lighthouse https://coldpilot.tech --output html --output-path ./audit-marketing.html

# Test dashboard performance
npx lighthouse https://app.coldpilot.tech/dashboard --output html --output-path ./audit-dashboard.html
```

### **Load Testing with Artillery**

```yaml
# load-test.yml
config:
  target: "https://app.coldpilot.tech"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Checkout flow"
    requests:
      - post:
          url: "/api/stripe/create-checkout-session"
          json:
            plan: "pro"
            interval: "monthly"
```

---

## 🛡️ SECURITY AUDIT

### **API Security Testing**

```bash
# Test webhook signature verification
curl -X POST https://app.coldpilot.tech/api/stripe/webhooks \
  -H "Content-Type: application/json" \
  -d '{"fake": "data"}'
# Should return 400 - No signature found

# Test authentication protection
curl https://app.coldpilot.tech/api/user/subscription
# Should return 401 - Unauthorized
```

### **Environment Variable Check**

```bash
# Verify production keys are set
railway variables | grep -E "(CLERK|STRIPE|DATABASE)"
```

---

## ✅ AUDIT COMPLETION CHECKLIST

- [ ] **All manual tests pass** (Phases 1-5)
- [ ] **Automated tests implemented** (E2E + API)
- [ ] **Performance benchmarks met** (Lighthouse > 90)
- [ ] **Security vulnerabilities addressed** (No exposed keys)
- [ ] **Database integrity verified** (No orphaned records)
- [ ] **Monitoring dashboards set up** (Real-time alerts)
- [ ] **Documentation updated** (Known issues logged)

**🎯 READY FOR PRODUCTION**: All tests pass, monitoring active, team trained!
