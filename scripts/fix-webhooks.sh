#!/bin/bash

echo "🔧 STRIPE WEBHOOKS SETUP HELPER"
echo "================================"
echo ""

echo "1. Install Stripe CLI (if not already installed):"
echo "   brew install stripe/stripe-cli/stripe"
echo ""

echo "2. Login to Stripe:"
echo "   stripe login"
echo ""

echo "3. Get webhook secret for local testing:"
echo "   stripe listen --print-secret"
echo "   # Copy the whsec_... value to your .env as STRIPE_WEBHOOK_SECRET"
echo ""

echo "4. Test webhooks locally:"
echo "   stripe listen --forward-to localhost:3000/api/stripe/webhooks"
echo ""

echo "5. Trigger test events:"
echo "   stripe trigger checkout.session.completed"
echo "   stripe trigger customer.subscription.updated"
echo "   stripe trigger invoice.payment_succeeded"
echo ""

echo "6. For production, add webhook endpoint in Stripe Dashboard:"
echo "   URL: https://your-app.railway.app/api/stripe/webhooks"
echo "   Events to select:"
echo "   - checkout.session.completed"
echo "   - customer.subscription.updated" 
echo "   - invoice.payment_succeeded"
echo "   - customer.subscription.deleted"
echo "   - invoice.payment_failed"
echo ""

echo "7. Add the production webhook secret to Railway:"
echo "   railway variables set STRIPE_WEBHOOK_SECRET=whsec_production_key_here"
echo ""

echo "✅ Once these steps are complete, your subscription system will be fully operational!" 