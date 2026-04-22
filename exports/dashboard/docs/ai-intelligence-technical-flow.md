# AI Intelligence Technical Flow (Blueprint Only - Not Implemented Yet)

Date: April 21, 2026
Status: Planning only (no code integration yet)

## Goal

Prepare production-ready architecture for AI intelligence across:
- Orders
- Marketing
- Reports
- Future customer intelligence

This document is for rollout planning and should only be implemented after core backend is stable.

## High-Level Architecture

1. Event Sources
- Orders created/updated
- Inventory low-stock events
- Checkout abandoned events
- Campaign performance updates
- Scheduled daily/weekly reporting jobs

2. Event Transport
- Webhooks or message queue (recommended)
- Each event includes:
  - `event_type`
  - `tenant_id`
  - `timestamp`
  - `payload` (normalized domain data)

3. AI Orchestration Service (Backend)
- Validate tenant + permissions
- Enrich payload from DB
- Choose AI workflow by event type
- Call OpenAI for:
  - insight generation
  - anomaly explanation
  - recommendation ranking
  - action text drafting

4. Persistence Layer
- Store AI outputs in internal tables:
  - `ai_insights`
  - `ai_recommendations`
  - `ai_action_queue`
  - `ai_runs` (audit/logging)

5. Admin UI Consumption
- Reports > AI Insights reads from `ai_action_queue`
- Marketing automations read from `ai_recommendations`
- UI actions (`Execute`) call backend endpoints that change status and log actor/time

## Recommended Execution Modes

1. Async mode (default)
- Event -> queue -> worker -> AI run -> store results
- Best for reliability + rate limiting

2. On-demand mode
- User clicks “Run AI Insight”
- Backend executes short workflow and returns latest insight

## Core Backend Endpoints (Future)

- `POST /api/ai/run-insight` (manual trigger)
- `GET /api/ai/insights?module=reports`
- `GET /api/ai/actions?status=pending`
- `POST /api/ai/actions/:id/execute`
- `POST /api/webhooks/marketing`
- `POST /api/webhooks/orders`

## AI Prompting Strategy

1. Structured prompt input
- Keep raw business data in JSON blocks
- Include tenant context and timezone
- Define hard output schema

2. Strict output schema
- Always request JSON-only response:
  - `summary`
  - `risk_level`
  - `confidence`
  - `recommended_actions[]`
  - `reasoning_trace_short`

3. Guardrails
- No direct auto-execution for critical actions
- High-risk actions require admin approval
- Redact sensitive personal data before prompt

## Multi-Tenant Safety

- Tenant isolation on every AI read/write query
- Per-tenant model usage quotas
- Per-tenant webhook signing secret
- Full audit trail for all AI outputs and executions

## Observability

- Log each AI run:
  - request id
  - model
  - tokens
  - latency
  - success/failure
- Add retry policy with dead-letter queue
- Add fallback message if AI unavailable

## Rollout Plan (When Ready)

1. Phase A - Read-only Insights
- Generate and display insights only
- No execute actions

2. Phase B - Action Queue
- Enable pending/execute lifecycle
- Require manual admin confirmation

3. Phase C - Semi-Automation
- Low-risk actions can auto-apply with safeguards
- Critical actions still manual approval

## Mapping to Current Frontend

Already prepared in UI (frontend mock state):
- Reports > AI Insights cards and action queue
- Marketing > Funnels > Automations rule builder

When backend is ready:
- Replace local state with API
- Keep current UX structure
- Add loading/error/empty states per endpoint

## Not In Scope Yet

- No OpenAI API keys wired yet
- No webhook handlers implemented yet
- No queue workers implemented yet
- No DB schema migration applied yet

