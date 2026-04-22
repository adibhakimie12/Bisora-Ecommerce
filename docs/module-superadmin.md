# MODULE: SUPERADMIN

## PURPOSE

Superadmin is the SaaS control center used by the platform owner to manage all stores, subscriptions, plans, access states, and platform-level privileges.

This module is not for sellers.
This module is only for the SaaS owner / internal admin team.

---

## CORE GOALS

Superadmin must allow the platform owner to:

* View all registered stores / tenants
* See which plan each store is using
* Activate / suspend / deactivate stores
* Grant free access manually
* Assign trial periods
* Override subscription logic
* Control feature availability by plan
* Track billing and subscription states
* Monitor usage and growth across all tenants

---

## PRIMARY IDENTITY MODEL

### Tenant / Store Identity

Each store should be identifiable by:

* Store name
* Owner name
* Owner email
* Optional phone number
* Plan type
* Subscription status
* Trial status
* Created date
* Last active

### Login Reference

Main login identity should be email-based.

Notes:

* Sellers log in using email/password
* Superadmin manages stores primarily by email
* Phone number can be secondary / optional

---

## SUPERADMIN NAVIGATION STRUCTURE

### Main Sections

* Overview
* Stores / Tenants
* Plans
* Subscriptions
* Trials
* Billing
* Feature Access
* Support / Admin Actions

---

# 1. OVERVIEW

## Purpose

High-level control dashboard for SaaS business performance.

## KPI Cards

* Total Stores
* Active Stores
* Trial Stores
* Paying Stores
* MRR / Revenue
* Suspended Stores

## Panels

* Recent Signups
* Plan Distribution
* Trial Expiry Alerts
* Recent Admin Actions

---

# 2. STORES / TENANTS

## Purpose

Main directory of all seller accounts / stores.

## Table Columns

* Store name
* Owner name
* Email
* Plan
* Status
* Trial state
* Created date
* Last active

## Status Types

* Active
* Trial
* Suspended
* Expired
* Cancelled
* Free Access

## Actions

* View Store
* Edit Store
* Activate
* Suspend
* Grant Free Access
* Remove Free Access
* Extend Trial
* Reset Password
* Impersonate / View as seller (future optional)

---

# 3. STORE DETAIL VIEW

## Purpose

Deep view for one specific seller / tenant.

## Sections

* Store identity
* Owner details
* Current plan
* Subscription status
* Trial status
* Feature access
* Billing history
* Recent activity
* Manual admin controls

## Admin Controls

* Change plan
* Toggle free access ON/OFF
* Toggle store active/suspended
* Extend trial
* Add internal admin note

---

# 4. PLANS

## Purpose

Manage SaaS pricing plans.

## Example Plans

* Free
* Starter
* Pro
* Enterprise

## Fields per Plan

* Plan name
* Monthly price
* Yearly price
* Trial allowed or not
* Limits:

  * products
  * orders
  * staff seats
  * themes
  * automations
* Feature set

## Actions

* Create Plan
* Edit Plan
* Archive Plan

---

# 5. SUBSCRIPTIONS

## Purpose

Track paid status of all stores.

## Data

* Store
* Plan
* Billing cycle
* Subscription state
* Start date
* Renewal date
* Last payment status

## Subscription States

* Active
* Trialing
* Past Due
* Cancelled
* Manual Free Access

---

# 6. TRIALS

## Purpose

Manage free trial logic.

## Logic

* Default trial can be 30 days
* Trial linked to email/store owner
* Trial start date
* Trial end date
* Remaining days

## Admin Actions

* Extend trial
* End trial now
* Convert to paid
* Grant custom free extension

---

# 7. BILLING

## Purpose

Financial monitoring for SaaS subscriptions.

## Sections

* Billing history
* Failed payments
* Refunds
* Manual adjustments

## Actions

* Mark as paid (manual)
* Retry payment (future)
* Download invoice (future)

---

# 8. FEATURE ACCESS

## Purpose

Control which modules/features a store can use.

## Example Feature Toggles

* Website Builder
* Marketing Funnels
* AI Automation
* Reports
* Staff & Roles
* Custom Domain
* Advanced Integrations
* Affiliate Module (future)
* Loyalty / Points (future)
* Chatbot AI (future)

## Logic

Feature access is controlled by:

1. Plan defaults
2. Manual superadmin override

---

# 9. FREE ACCESS / MANUAL OVERRIDE

## IMPORTANT

Superadmin must be able to manually grant full or partial access to a store.

### Example Use Cases

* Give friend/client free access
* Give internal tester free access
* Restore access temporarily
* Grant lifetime access manually

## Required Controls

* Toggle Free Access ON/OFF
* Set free access type:

  * Full free access
  * Feature-limited free access
* Optional expiry date
* Add internal reason/note

---

# 10. ADMIN ACTION LOG

## Purpose

Track important superadmin changes.

## Logged Actions

* Plan changed
* Trial extended
* Free access granted
* Store suspended
* Feature unlocked

---

# RELATIONSHIP TO OTHER SYSTEMS

Superadmin connects to:

* Admin seller accounts
* Billing system
* Plan engine
* Trial engine
* Feature gating
* Future affiliate and loyalty systems

---

# FEATURE GATING RULES

## Examples

* Free plan:

  * limited products
  * no AI
  * no advanced funnels

* Starter:

  * basic store builder
  * limited integrations

* Pro:

  * full marketing + analytics

* Enterprise:

  * everything unlocked

## Override Rule

Superadmin can manually override any feature regardless of plan.

---

# FUTURE EXPANSION

Not required now, but structure should support:

* Multi-store owner accounts
* Affiliate/referral management
* White-label branding
* Agency accounts
* Team billing
* Per-feature metered billing

---

# NOTES FOR ANTIGRAVITY

## IMPORTANT

* Superadmin must be clearly separate from normal seller admin
* It should feel like a platform owner console
* Email is the primary identity for managing seller access
* Free access and manual override must be easy to use
* Trial + subscription + feature access must be connected logically

## BUILD PRIORITY

1. Overview
2. Stores / Tenants list
3. Store detail
4. Plans
5. Subscriptions
6. Trials
7. Feature Access
8. Admin Action Log

---

# GOAL

Superadmin should feel like:
"A real SaaS command center for managing customers, plans, access, and monetization."
