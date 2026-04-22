# MODULE: CUSTOMER ACCOUNT

## PURPOSE

Customer Account module allows buyers to manage their profile, view orders, and track purchases after buying from the store.

This module is part of the frontend system.

---

## AUTHENTICATION

### Login / Register

* Email-based login
* Password authentication
* Optional future: OTP / WhatsApp login

---

## CUSTOMER DASHBOARD

Main sections:

* Profile
* Orders
* Order Tracking
* Address Book

---

## 1. PROFILE

### Fields

* Name
* Email
* Phone (optional)
* Password update

---

## 2. ORDERS

### Purpose

Show purchase history

### Table

* Order ID
* Date
* Total
* Payment status
* Fulfillment status

### Action

* View Order Detail

---

## 3. ORDER DETAIL

### Sections

* Items purchased
* Shipping address
* Payment method
* Order timeline

---

## 4. ORDER TRACKING

### Show:

* Processing
* Shipped
* In Transit
* Delivered

### Include:

* Tracking number
* Courier name

---

## 5. ADDRESS BOOK

### Features

* Add new address
* Edit address
* Set default address

---

## FUNCTIONAL FLOW

Customer buys product →
Checkout →
Order created →
Customer logs in →
View order →
Track shipment

---

## CONNECTIONS

This module connects to:

* Orders module
* Shipping module
* Notifications module

---

## FUTURE EXTENSIONS (NOT NOW)

* Loyalty points
* Affiliate dashboard
* Wishlist
* Saved items

---

## NOTES FOR ANTIGRAVITY

* Keep UI simple and mobile-first
* Focus on usability, not complexity
* Must load fast
* Must connect to Orders module
* Use consistent layout with frontend system

---

## GOAL

Allow customers to:

* Track their orders easily
* Manage their account
* Trust the store experience
