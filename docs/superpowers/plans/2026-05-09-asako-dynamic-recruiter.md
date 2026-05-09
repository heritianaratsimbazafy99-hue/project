# Asako Dynamic Recruiter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the static Asako prototype toward a dynamic, recruiter-focused experience that matches the audited Asako.mg public and recruiter UX.

**Architecture:** Keep the current vanilla SPA and enrich it with data-driven renderers, local demo state, route-specific recruiter empty states, and Asako-like sticky panels. The implementation stays in `app.js` and `styles.css`, with a dependency-free Node smoke test that evaluates route HTML.

**Tech Stack:** HTML, CSS custom properties, vanilla JavaScript, Node built-ins for tests, Chrome for visual verification.

---

### Task 1: Lock Expected Behaviors With Tests

**Files:**
- Create: `tests/asako-dynamic.test.mjs`

- [ ] Add a Node VM smoke test that loads `app.js` with a minimal browser stub.
- [ ] Assert the home route renders a sticky `Derniers jours pour postuler` rail with `data-sticky-deadlines`.
- [ ] Assert recruiter offers renders an Asako-like empty state and does not render seeded fake offer rows.
- [ ] Assert the new offer route renders method cards for manual writing and AI generation.
- [ ] Assert the CVthèque route renders search modes plus the free-plan access limit.
- [ ] Assert the subscription route renders quotas and monthly/quarterly controls.
- [ ] Run `node tests/asako-dynamic.test.mjs` and verify it fails before production edits.

### Task 2: Public Home Sticky Deadline Rail

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Add `data-sticky-deadlines` to the home deadline side-card.
- [ ] Wrap home side cards so the deadline card sticks below the header throughout the latest jobs section.
- [ ] Keep the Pro CTA visible below the deadline card without pushing the sticky card out of view.
- [ ] Ensure mobile collapses the rail below the job list without sticky overlap.

### Task 3: Recruiter State And Asako-Accurate Empty Offers

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Add a `recruiterState` object for plan, quotas, profile completion, offer counts, candidate counts, and recent activity.
- [ ] Render dashboard KPIs from `recruiterState` with five aligned cards.
- [ ] Render `Mes offres` with KPI cards, tabs, search/sort controls, footer quota text, and empty state when no recruiter offers exist.
- [ ] Keep fictional demo candidates separate from actual recruiter account data.

### Task 4: New Offer Manual/AI Flow

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Render the first new-offer screen with two method cards: `Je rédige mon offre` and `Générer avec l'IA`.
- [ ] Use a `method=manual` hash query to show the detailed form.
- [ ] Add fields matching Asako: title, contract, city select, location, salary range, internal reference, description, missions, profile, optional extra info.
- [ ] Add editor-like toolbars, character counters, AI improve CTA, locked visibility options, progress hint, draft/publish sticky bottom bar.

### Task 5: CVthèque Free-Plan Experience

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Add top stats for available profiles, AI-analyzed CVs, and sectors.
- [ ] Add segmented controls for `Recherche libre` and `Matcher par offre`.
- [ ] Add a large search panel with popular searches.
- [ ] For a free plan, render a limited-access notice and sample masked profile cards with an upgrade CTA.

### Task 6: Subscription And Profile Polish

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Render current plan, quotas, plan-change section, monthly/quarterly switch, and transaction empty state in the recruiter subscription route.
- [ ] Align recruiter profile route with Asako: personal info card plus password-change card.
- [ ] Keep the existing public pricing page intact while reusing plan data.

### Task 7: Verification

**Files:**
- No source edits unless fixes are needed.

- [ ] Run `node tests/asako-dynamic.test.mjs` and confirm it passes.
- [ ] Start a local static server with `python3 -m http.server`.
- [ ] Use Chrome to inspect desktop home, recruiter dashboard, new offer manual form, CVthèque, and subscription pages.
- [ ] Inspect a mobile viewport for overlap, sticky behavior, and text fit.
- [ ] Fix any console or layout issues found during verification.
