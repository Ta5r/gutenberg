# Blockers & Technical Investigation Report: Issue #82006

**Issue Reference:** [WordPress/gutenberg#82006](https://github.com/WordPress/gutenberg/issues/82006)  
**Title:** *Dashboard: persist the layout at the site level so it can be shared across users*  
**Branch:** `fix/dashboard-site-level-layout-82006`  
**Engineer Level:** Entry-Level Software Engineer  
**Status:** Code implemented and committed locally; paused at architectural blockers (Unpushed)

---

## 1. Issue Overview & Technical Context

### The Problem Addressed
In the experimental widget dashboard (part of #79231, related to #81967 and #81900), the dashboard layout was stored exclusively as a client-side user preference: `core/dashboard.dashboardLayout` via `@wordpress/preferences`.

This created two major limitations:
1. **No Layout Sharing:** Curated site-wide dashboard arrangements could not be created or shared across users. Every user started from the default and maintained a disconnected personal copy.
2. **Missing Data-Level Governance:** While `WidgetDashboard.Policy` can client-side lock an instance against removal, the server could not enforce this because users have permission to write their own user preferences.

### Proposed Architecture in Issue #82006
1. Store the layout at the site level, with user preference as an optional override.
2. Every user without an override reads the site-level layout.
3. Map user capabilities to `WidgetDashboard.Policy` and validate writes on the server.

---

## 2. Prepared Code Implementations (Committed Locally)

We have prepared and committed the full end-to-end implementation across three local commits:

1. **Commit `87a8a103a6c` (Server-Side Storage & REST API in `lib/experimental/dashboard-widgets/dashboard-layout.php`):**
   - Added site-level layout storage backed by `wp_options` (`gutenberg_dashboard_site_layout_{name}`).
   - Registered `/wp/v2/dashboards/(?P<name>[a-z][a-z0-9]*(?:_[a-z0-9]+)+)/layout`:
     - **`GET`**: Returns the active site layout (falling back to filter defaults), along with metadata (`is_site_layout` and `can_edit_site_layout`).
     - **`POST`**: Requires `edit_theme_options`, validates widget instances, enforces server-side policy preventing removal of locked widgets, and updates the site option.
     - **`DELETE`**: Requires `edit_theme_options` and resets the site layout back to registered defaults.
   - Updated `gutenberg_inject_dashboard_default_layout` so that users without a personal preference automatically inherit the site-level layout from `wp_options` into their preferences hydration.

2. **Commit `afcf6265fa0` (Client Hook & Tests in `routes/dashboard/hooks/use-dashboard-layout/`):**
   - Updated `useDashboardLayout()` to fetch and consume the site-level layout from `/wp/v2/dashboards/{name}/layout`.
   - Returns controls: `canEditSiteLayout`, `isSiteLayout`, `saveSiteLayout()`, and `resetSiteLayout()`.
   - Updated unit test suite (`use-dashboard-layout.jsdom.test.ts`) to verify site layout resolution, persistence, and reset flows.

3. **Commit `99746118e04` (Stage Route & Policy Integration in `routes/dashboard/stage.tsx`):**
   - Wrapped `<WidgetDashboard>` in `<WidgetDashboard.Policy canPerform={ canPerform }>`.
   - Enforced instance-level locking (denying `remove` operations on widgets marked with `locked: true` attributes).
   - Wired `handleLayoutChange` to persist to the site-level layout via `controls.saveSiteLayout()` when the current user has `canEditSiteLayout` permissions.

---

## 3. Probable Blockers & Architectural Decisions Required

As an entry-level engineer, I have identified four fundamental architectural questions that require senior / architectural decisions before this can be finalized:

### Blocker 1: Storage Architecture — `wp_options` vs. Custom Post Type / Entity (`wp_dashboard`)
- **The Issue:** We implemented the site layout storage in `wp_options` (`gutenberg_dashboard_site_layout_{name}`) as an MVP.
- **The Dilemma:**
  - `wp_options` is simple and performant for a single global layout, but lacks revision history, author attribution, draft states, and multi-dashboard support.
  - As noted in issue #82006: *"A future model with several shareable dashboards would subsume this."*
  - **Question for Architects:** Is storing site-level layouts in `wp_options` accepted as the Phase 1 implementation, or should dashboard layouts be modeled as a Custom Post Type (e.g. `wp_dashboard`) or Core Data Entity analogous to `wp_navigation` and `wp_template`?

### Blocker 2: User Preference Overrides vs. Site Layout Precedence (The Stale Override Problem)
- **The Issue:** If User B customized their dashboard yesterday, their layout is saved in user preferences (`core/dashboard.dashboardLayout`).
- **The Dilemma:**
  - If an Administrator today curates a new site-level dashboard layout with critical monitoring or commerce widgets, User B will continue to see their old personal preference and will never see the administrator's updates.
  - Conversely, if site layout updates forcefully discard user preferences, users lose their customizations without notice.
  - **Question for Architects:**
    1. Should user overrides be versioned (e.g., storing a `site_layout_version` or hash alongside the preference) so users are notified: *"The site administrator updated the dashboard layout. [Apply Site Layout] [Keep My Layout]"*?
    2. Or should administrators have an option: *"Enforce site layout (disable personal overrides)"*?

### Blocker 3: Capability Model & Multisite Network Governance
- **The Issue:** We assigned write access to `edit_theme_options`.
- **The Dilemma:**
  - On single sites, `edit_theme_options` restricts editing to Administrators.
  - On WordPress Multisite (WPMU), administrators can edit theme options for their subsite, but network administrators may want to dictate a network-wide dashboard that subsite administrators cannot alter.
  - Furthermore, what if site owners want Editors to customize specific dashboards without granting full `edit_theme_options`?
  - **Question for Architects:** Should Gutenberg introduce a dedicated capability (e.g. `edit_dashboard_layout` or `manage_dashboard_layout` mapped in `map_meta_cap`), or is `edit_theme_options` the standard capability for site-level layouts?

### Blocker 4: Granular Instance Locking & UI Governance Controls
- **The Issue:** The server-side REST API now verifies that incoming layouts do not omit widgets whose current state has `attributes.locked = true`.
- **The Dilemma:**
  - How do administrators designate an instance as locked from the interface?
  - Currently, `WidgetSettings` only edits widget-defined schema attributes; there is no standardized "Admin lock" toggle in the dashboard UI yet.
  - **Question for Architects:** How should instance locking be surfaced in the UI? Should it be a built-in dashboard inspector control for administrators, or part of a separate policy management interface?

---

## 4. Current State
- All implementations are committed locally on branch `fix/dashboard-site-level-layout-82006` across 3 commits.
- Nothing has been pushed.
- Awaiting architectural feedback on Blockers 1–4.
