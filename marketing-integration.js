// ============================================
// COLDPILOT MARKETING PAGE INTEGRATION
// Add this JavaScript to your coldpilot.tech pricing page
// ============================================

// Configuration
const API_BASE_URL = "https://app.coldpilot.tech";

// Main checkout function
async function initiateCheckout(plan, interval) {
  try {
    // Show loading state
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = "Loading...";
    button.disabled = true;

    // 🚨 AUDIT IMPROVEMENT: UTM tracking for campaign attribution
    const urlParams = new URLSearchParams(window.location.search);
    const utmData = {
      utm_source: urlParams.get("utm_source"),
      utm_medium: urlParams.get("utm_medium"),
      utm_campaign: urlParams.get("utm_campaign"),
      referrer: document.referrer,
      landing_page: window.location.pathname,
    };

    // Call your API
    const response = await fetch(
      `${API_BASE_URL}/api/stripe/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: plan,
          interval: interval,
          metadata: utmData, // Add tracking data
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    const data = await response.json();

    // Redirect to Stripe checkout
    window.location.href = data.url;
  } catch (error) {
    console.error("Checkout error:", error);

    // Reset button state
    const button = event.target;
    button.textContent = originalText;
    button.disabled = false;

    // Show error message
    alert("Sorry, there was an error starting checkout. Please try again.");
  }
}

// ============================================
// OPTION 1: HTML Button Examples
// ============================================

/*
Replace your pricing buttons with these:

<!-- Basic Plan -->
<button onclick="initiateCheckout('basic', 'monthly')" class="pricing-button">
  Get Basic Monthly - $29/mo
</button>

<button onclick="initiateCheckout('basic', 'yearly')" class="pricing-button">
  Get Basic Yearly - $290/yr
</button>

<!-- Pro Plan -->
<button onclick="initiateCheckout('pro', 'monthly')" class="pricing-button">
  Get Pro Monthly - $99/mo
</button>

<button onclick="initiateCheckout('pro', 'yearly')" class="pricing-button">
  Get Pro Yearly - $990/yr
</button>

<!-- Agency Plan -->
<button onclick="initiateCheckout('agency', 'monthly')" class="pricing-button">
  Get Agency Monthly - $199/mo
</button>

<button onclick="initiateCheckout('agency', 'yearly')" class="pricing-button">
  Get Agency Yearly - $1990/yr
</button>
*/

// ============================================
// OPTION 2: Add Event Listeners (Modern Approach)
// ============================================

// Use this if you prefer to add event listeners instead of onclick
document.addEventListener("DOMContentLoaded", function () {
  // Basic plan buttons
  const basicMonthlyBtn = document.querySelector(
    '[data-plan="basic"][data-interval="monthly"]'
  );
  const basicYearlyBtn = document.querySelector(
    '[data-plan="basic"][data-interval="yearly"]'
  );

  // Pro plan buttons
  const proMonthlyBtn = document.querySelector(
    '[data-plan="pro"][data-interval="monthly"]'
  );
  const proYearlyBtn = document.querySelector(
    '[data-plan="pro"][data-interval="yearly"]'
  );

  // Agency plan buttons
  const agencyMonthlyBtn = document.querySelector(
    '[data-plan="agency"][data-interval="monthly"]'
  );
  const agencyYearlyBtn = document.querySelector(
    '[data-plan="agency"][data-interval="yearly"]'
  );

  // Add click handlers
  if (basicMonthlyBtn)
    basicMonthlyBtn.addEventListener("click", () =>
      initiateCheckout("basic", "monthly")
    );
  if (basicYearlyBtn)
    basicYearlyBtn.addEventListener("click", () =>
      initiateCheckout("basic", "yearly")
    );
  if (proMonthlyBtn)
    proMonthlyBtn.addEventListener("click", () =>
      initiateCheckout("pro", "monthly")
    );
  if (proYearlyBtn)
    proYearlyBtn.addEventListener("click", () =>
      initiateCheckout("pro", "yearly")
    );
  if (agencyMonthlyBtn)
    agencyMonthlyBtn.addEventListener("click", () =>
      initiateCheckout("agency", "monthly")
    );
  if (agencyYearlyBtn)
    agencyYearlyBtn.addEventListener("click", () =>
      initiateCheckout("agency", "yearly")
    );
});

/*
For Option 2, update your HTML buttons to include data attributes:

<button data-plan="basic" data-interval="monthly" class="pricing-button">
  Get Basic Monthly - $29/mo
</button>

<button data-plan="pro" data-interval="yearly" class="pricing-button">
  Get Pro Yearly - $990/yr
</button>

etc...
*/

// ============================================
// STEP-BY-STEP INTEGRATION GUIDE
// ============================================

/*
1. Add this JavaScript file to your coldpilot.tech site
2. Update your pricing buttons using either Option 1 or Option 2 above
3. Test with a button click - it should redirect to Stripe checkout
4. Complete a test payment - you'll be redirected to app.coldpilot.tech/dashboard with success message
5. Check app.coldpilot.tech/settings to see your active subscription!

THAT'S IT! Your marketing page is now connected to your subscription system! 🎉
*/
