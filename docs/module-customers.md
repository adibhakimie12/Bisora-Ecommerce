# Customers Module — Notes (Admin SaaS System)

## Overview

Customers module is the CRM and relationship management layer of the ecommerce SaaS system.

It handles:

* Customer listing and segmentation
* Customer profile and spending insights
* Internal notes and quick actions
* Review moderation and customer-generated content

This module should help store owners understand customer value, repeat purchase behavior, and communication history.

---

## Navigation Structure

### Sidebar

* Customers (active)

### Top Tabs

* All Customers
* Reviews

---

## 1. All Customers

### Purpose

Main CRM overview page for all customer records.

### Core Functions

* View all customers
* Search customers
* Filter customer list
* Create new customer
* Open customer action menu

### Table / List Content

Each customer row includes:

* Customer avatar
* Customer name
* Email
* Number of orders
* Total spent
* Customer status / tag
* Last order date

### Status / Tags

Examples:

* VIP
* Returning
* New

### Row Actions

* View Profile
* Edit Customer
* Add Note
* Delete

### Notes

This is the default entry point for the Customers module.

---

## 2. Customer Profile & CRM Insights

### Purpose

Detailed CRM view for a single customer.

### Main Sections

#### KPI Summary

* Total Spent
* Total Orders
* AOV (average order value)
* Lifetime Value

#### Order History

Shows previous orders:

* Order ID
* Date
* Total
* Payment status
* Fulfillment status

Action:

* View full order history

#### Recent Purchases

Shows recently purchased products with thumbnails.

#### Customer Card / Identity Panel

* Full name
* Email
* Member since
* Optional tags:

  * VIP
  * Returning
  * High Value

#### Shipping Address

* Saved customer shipping info

#### Internal Notes

* Add internal notes for staff / CRM use

#### Quick Actions

* Send WhatsApp
* Send Email
* Deactivate Account

### Notes

This page acts as the CRM detail page and should connect to Orders and Marketing later.

---

## 3. Reviews

### Purpose

Moderate and manage customer reviews across products.

### KPI Summary

* Average Rating
* Total Reviews
* Pending Moderation

### Filters

* Rating
* Status
* Product
* Search

### Review Table

Each row includes:

* Customer
* Product
* Rating
* Review excerpt
* Status
* Date

### Review Status

* Pending
* Approved
* Hidden
* Featured

### Main Actions

* Export Report
* Open review moderation modal

---

## 4. Review Moderation Modal

### Purpose

Moderate a specific customer review.

### Contents

* Customer name
* Purchase verification
* Product reviewed
* Star rating
* Full review text

### Actions

* Approve Review
* Mark as Featured
* Hide
* Delete

### Notes

This modal is triggered from the Reviews table.

---

## Functional Logic

### Customer Relationships

Customers connect to:

* Orders
* Reviews
* Marketing segmentation
* Notifications
* Loyalty / points system (future)
* Affiliate system (future)
* Frontend customer account (future)

---

## Important Navigation Logic

### Main Flow

Customers > All Customers > Customer Profile

### Reviews Flow

Customers > Reviews > Review Moderation Modal

---

## Build Priority for Antigravity

### Recommended order

1. All Customers
2. Customer Profile
3. Reviews page
4. Review Moderation Modal

---

## Shared Components Needed

* Customer list row
* Status tag / badge
* KPI cards
* CRM profile side panel
* Order history table
* Review table
* Review moderation modal
* Internal notes card
* Quick action panel

---

## Notes for Antigravity

### Important

* Reuse the same global admin shell
* Customers must use the same sidebar, topbar, and page container as Dashboard, Orders, and Products
* Keep All Customers as default tab
* Reviews is the second tab
* Customer Profile is a child detail page of All Customers
* Review Moderation is a modal from Reviews

### UX Focus

* CRM must feel useful for real store operations
* Easy to identify high-value customers
* Easy to moderate reviews without leaving context

---

## Future Scope

Not required now, but should remain compatible with:

* Loyalty points
* Customer login portal
* Order tracking account page
* Reward tiers
* Affiliate/referral accounts
* AI customer segmentation
* Smart retention campaigns

---

## Goal

The Customers module should give merchants a practical CRM and moderation system that supports retention, support, and customer value tracking.
