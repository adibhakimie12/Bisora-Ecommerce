# Products Module — Notes (Admin SaaS System)

## Overview

Products module manages the full product catalog for the ecommerce SaaS system.

It covers:

* Product listing
* Inventory tracking
* Category management
* Category detail and arrangement
* Category SEO
* Product editing studio

This module must stay simple for daily use but powerful enough for scaling stores with many products and variants.

---

## Navigation Structure

### Sidebar

* Products (active)

### Top Tabs

* All Products
* Inventory
* Categories

---

## 1. All Products

### Purpose

Main catalog overview page for all products.

### Key Functions

* View all products
* Filter by stock state:

  * All Stock
  * Low Stock
  * Out of Stock
  * High Stock
* Filter by product status:

  * Active
  * Unpublished
  * Hidden
* Filter by category
* Search by product name

### Table / List Content

Each product row includes:

* Product thumbnail
* Product name
* SKU
* Category
* Price
* Stock count
* Status badge
* Actions menu

### Row Actions

* Edit Product
* Duplicate
* Archive
* Delete

### Primary Action

* Add Product

### Notes

This is the default entry point for the Products module.

---

## 2. Inventory

### Purpose

Operational inventory management for stock updates.

### Key Functions

* View stock by product variant
* Quick edit quantity
* Status visibility:

  * In Stock
  * Low Stock
  * Out of Stock
* Last updated timestamp
* Bulk inventory actions

### Bulk Actions

* Update Stock
* Mark In Stock
* Mark Out of Stock
* Delete
* Save inventory changes

### Notes

Inventory is operational and should be optimized for speed.
This tab is used by store staff for fast stock maintenance.

---

## 3. Categories

### Purpose

Manage product groupings / collections.

### Key Functions

* View all categories
* See category health
* View product count per category
* Category status:

  * Published
  * Hidden
* Open category detail

### Primary Action

* Create Category

### Notes

Categories support storefront organization and editorial merchandising.

---

## 4. Category Detail

### Purpose

Edit category settings and manage category visibility.

### Tabs inside Category Detail

* Category
* Category Products
* SEO

---

### 4A. Category Tab

Contains:

* Category name
* Description
* Status / visibility

  * Published
  * Hidden
* Cover image / category visual

### Actions

* Save
* Preview
* Delete

---

### 4B. Category Products Tab

Purpose:
Manage product arrangement inside a category.

Functions:

* Search products to add
* Add product to category
* Reorder products manually
* Remove product from category
* Sort mode:

  * Manual
  * possibly auto sort later

### Notes

This tab is important for merchandising and homepage/category curation.

---

### 4C. SEO Tab

Purpose:
Manage search visibility for category pages.

Fields:

* Meta Title
* Meta Description
* URL Slug

Preview:

* Search engine preview snippet

Notes:
This tab improves storefront SEO and collection discoverability.

---

## 5. Edit Product Studio

### Purpose

Main product edit and management screen.

### Core Sections

#### Basic Information

* Product title
* Description

#### Media

* Product images
* Upload / reorder

#### Variants

* Variant combinations
* Price per variant
* SKU
* Availability / stock status

#### Color Media Mapping

* Assign images to variant colors

#### Search Engine Listing

* Product-level SEO fields

---

### Right Side Summary Panel

Displays:

* Product status

  * Published / Draft
* Price
* Inventory summary
* Organization / categorization
* Visibility
* Product type / vendor / tags

---

### Top Actions

* Preview
* Duplicate
* Save Changes

---

## Functional Logic

### Product Relationships

Products connect to:

* Categories
* Inventory
* Orders
* Marketing offers
* Frontend storefront
* SEO system

### Category Relationships

Categories connect to:

* Homepage sections
* Collection pages
* Product filtering
* Navigation menus
* Website Builder

---

## Build Priority for Antigravity

### Recommended build order

1. All Products
2. Edit Product Studio
3. Inventory
4. Categories
5. Category Detail
6. Category Products tab
7. SEO tab

---

## Shared Components Needed

* Product table row
* Status badge
* Action dropdown
* Search/filter bar
* Bulk action bar
* Right-side summary cards
* Tab navigation
* Media uploader
* Variant matrix / table
* SEO preview card

---

## Notes for Antigravity

### Important

* Reuse the global admin shell
* Products module must share the same sidebar, topbar, and layout system
* Do not overcomplicate tab behavior
* Keep All Products as default
* Category Detail is a child view of Categories
* Edit Product Studio is a child view of All Products

### Navigation logic

* Products > All Products > Edit Product
* Products > Categories > Category Detail > Category Products / SEO
* Products > Inventory for operational stock management

---

## Future Scope

Not required now, but should remain compatible with:

* Product bundles
* Dropship / affiliate products
* AI product description generation
* Smart stock alerts
* Low stock automation
* Product recommendation engine

---

## Goal

The Products module should help merchants manage catalog, inventory, and merchandising easily, while staying ready for scale and future automation.
