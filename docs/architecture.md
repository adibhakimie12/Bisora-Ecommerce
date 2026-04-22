# Ecommerce SaaS System Architecture

## Project Structure
This project is divided into six major layers:

1. Admin App
2. Shared UI System
3. Module Logic
4. Backend Services
5. Frontend Store
6. Superadmin SaaS Control

## Main Folders
- app/: route entry points for admin pages
- modules/: feature-specific UI and logic
- shared/: reusable layout and UI components
- backend/: APIs, services, database, auth, billing
- frontend-store/: customer-facing storefront
- superadmin/: tenant, plan, billing, trial management
- docs/: architecture and flow references
- exports/: AI Studio and Stitch export references

## Core Admin Modules
- Dashboard
- Orders
- Products
- Customers
- Marketing
- Reports
- Settings
- Website Builder

## Shared Shell
All admin pages use the same global shell:
- fixed left sidebar
- top header
- main content container
- shared cards, tables, forms, badges, and modals

## Key Principle
Build module by module.
Do not attempt to build the entire SaaS in one pass.