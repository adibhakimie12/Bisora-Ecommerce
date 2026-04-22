# Marketing Module — Notes (Admin SaaS System)

## Overview

Marketing module is the revenue engine of the system.

It handles:

* Campaign performance tracking
* Discounts & promotions
* Upsells & offers (AOV increase)
* Recovery flows (abandoned cart)
* Broadcast campaigns (email/WhatsApp)
* Funnel builder (conversion journey)
* AI automation rules

This module directly impacts revenue growth, AOV, and customer retention.

---

## Navigation Structure

### Sidebar

* Marketing (active)

### Top Tabs (FINAL STRUCTURE)

* Overview
* Discounts
* Upsells
* Recovery
* Broadcasts
* Funnels

---

# 1. Overview (Marketing Dashboard)

### Purpose

High-level performance summary for all marketing activities.

### KPI Cards

* Discount Revenue
* Upsell Revenue
* Recovery Rate
* Broadcast Revenue

### Sections

* Marketing Performance (graph)
* Top Performing Campaigns
* Strategy Panel (quick actions)

### Quick Actions

* Create Discount
* Create Upsell
* Send Broadcast

---

# 2. Discounts

## Discounts List

### KPI

* Total Discount Revenue
* Active Discounts
* Usage Rate

### Table

* Code
* Type (Percentage / Fixed)
* Value
* Usage
* Status
* Valid date

### Status

* Active
* Expired
* Scheduled

---

## Create Discount Page

### Sections

* Basic Info (code, description)
* Discount Value (percentage / RM)
* Applies To:

  * All products
  * Collections
  * Specific products
* Minimum Requirements
* Customer Eligibility
* Usage Limits
* Active Dates

---

# 3. Upsells

## Upsell List

### KPI

* Upsell Revenue
* Conversion Rate
* Active Offers

### Table

* Offer name
* Type:

  * Bump Offer (checkout)
  * One-Time Offer (post-purchase)
* Trigger (cart / purchase)
* Conversion rate
* Revenue
* Status

---

## Offer Builder (Bump / OTO)

### Sections

* Offer Type
* Product Selection
* Pricing & Discount
* Trigger Settings
* Offer Message (frontend text)
* Limits & Rules
* Campaign Status

### Preview Panel

* Simulated customer view

---

# 4. Recovery (Abandoned Cart)

## Recovery Dashboard

### KPI

* Recovered Revenue
* Recovered Orders
* Recovery Rate
* Pending Carts

### Sections

* Recovery Trends
* Abandoned Checkout Table

---

## Recovery Flow Builder

### Purpose

Visual automation builder for recovery

### Nodes

* Trigger (cart abandoned)
* Delay
* Channel:

  * Email
  * WhatsApp
  * SMS
* Conditional logic

---

## Message Template Builder

### Purpose

Create reusable templates

### Fields

* Template name
* Channel (Email / WhatsApp)
* Dynamic variables
* CTA button

---

# 5. Broadcasts

## Broadcast Dashboard

### KPI

* Total Sent
* Open Rate
* Click Rate
* Revenue Influenced

### Table

* Campaign name
* Channel
* Audience
* Schedule
* Performance

---

## Create Broadcast

### Sections

* Campaign Info
* Channel Selection
* Audience Targeting
* Message Template
* Scheduling

### Modes

* Send now
* Schedule later

---

# 6. Funnels (MOST IMPORTANT)

## Funnel Builder (Visual)

### Purpose

Build full customer journey

### Steps

* Landing Page
* Product Page
* Checkout
* Order Bump
* One-Time Offer (OTO)
* Downsell
* Thank You Page

---

## Funnel Creation Flow (Modal)

### Step 1

* Name funnel
* Objective:

  * Sell product
  * Increase AOV
  * Generate leads
  * Recover carts

### Step 2

* Select template:

  * High converting funnel
  * Simple checkout
  * Product + upsell
  * Recovery funnel

### Step 3

* Summary
* Generate funnel

---

## Funnel Automation (AI Layer)

### Purpose

Smart decision system for offers

### Components

* Rule library
* AI decision node
* Conversion tracking

---

## Automation Rule Builder

### Sections

* Rule name
* Conditions:

  * Cart value
  * Customer type
* AI optimization settings
* Execution preview

---

# Functional Logic

### Flow Relationship

Discounts → increase conversion
Upsells → increase AOV
Recovery → recover lost revenue
Broadcasts → re-engage users
Funnels → combine everything
AI Automation → optimize all above

---

# Navigation Logic

### Main Entry

Marketing → Overview

### Deep Flow Example

Marketing → Funnels → Create Funnel → Builder → Automation

---

# Build Priority for Antigravity

### Phase 1 (Core Revenue)

1. Overview
2. Discounts
3. Upsells

### Phase 2 (Automation)

4. Recovery
5. Broadcasts

### Phase 3 (Advanced)

6. Funnels
7. AI Automation

---

# Shared Components Needed

* KPI cards
* Campaign table
* Modal builder
* Form builder
* Automation nodes
* Graph/chart components
* Template preview panel

---

# Notes for Antigravity

### VERY IMPORTANT

* Keep 6 main tabs only (DO NOT add random extra tabs)
* Funnel builder is a separate experience (canvas style)
* AI automation is part of Funnels (NOT separate module)
* Reuse UI patterns from Orders & Products

---

# Future Expansion

* Ads integration (Meta / Google / TikTok)
* AI ad optimizer
* Customer segmentation AI
* Auto campaign generator
* Affiliate marketing system
* Referral system

---

# Goal

This module should feel like:
"A complete revenue growth engine, not just a marketing dashboard"

It must:

* Help users make money
* Show clear performance
* Automate repetitive marketing tasks
* Increase AOV and retention
