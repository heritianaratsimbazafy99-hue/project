# JobMada Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, high-fidelity JobMada-inspired jobboard and recruiter dashboard in `le workspace local`.

**Architecture:** A single-page vanilla app renders public pages and recruiter pages from structured data. Routing uses `location.hash`, keeping deployment simple and avoiding framework setup in an empty workspace.

**Tech Stack:** HTML5, CSS custom properties, vanilla JavaScript, inline SVG/icon glyphs, mock data.

---

### Task 1: Static App Shell

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`

- [ ] Create semantic HTML with root containers, metadata, and linked assets.
- [ ] Define CSS variables for JobMada colors, typography, spacing, radii, shadows.
- [ ] Add a router in `app.js` that maps hash routes to page renderers.
- [ ] Verify `index.html` opens locally.

### Task 2: Public Jobboard Pages

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Add mock jobs, companies, sectors, urgent jobs, and plan data.
- [ ] Implement home page sections: hero, companies, pro banner, latest jobs, sectors, preparation, timeline, CTA, footer.
- [ ] Implement offers page with search and filters.
- [ ] Implement job detail and company listing pages.

### Task 3: Recruiter Dashboard

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Add recruiter layout with sidebar and quota card.
- [ ] Implement dashboard metrics, offers, candidates, CVthèque, selection, company profile, subscription and profile pages.
- [ ] Add new-job form with mocked options and active states.
- [ ] Use fictional candidates only.

### Task 4: Interactions And Polish

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Add route-aware active states.
- [ ] Add filter/search behavior.
- [ ] Add plan toggle, save toast, load-more behavior and candidate save toggles.
- [ ] Add responsive breakpoints for public and recruiter layouts.

### Task 5: Verification

**Files:**
- No source edits unless fixes are needed.

- [ ] Start a local static server.
- [ ] Inspect desktop and mobile rendering.
- [ ] Fix overlap, broken navigation and console errors.
- [ ] Finalize with the local URL and summary.
