# Blocker Report: Issue #59248

**Issue Reference:** [WordPress/gutenberg#59248](https://github.com/WordPress/gutenberg/issues/59248)  
**Title:** use "screen" with media queries on width so not to affect print view  
**Branch:** `fix/media-queries-screen-print-view-59248`  
**Engineer Level:** Entry-Level Software Engineer  

---

## 1. Issue Summary & Root Cause Analysis

### The Problem
When printing pages built with Gutenberg (or viewing Print Preview in browsers via Ctrl+P / Cmd+P), multi-column layouts such as the **Columns** block collapse into a single vertical stack where each column takes 100% width (`flex-basis: 100% !important;`). The user reported:
> "Some media queries in the block library don't use 'screen' with max-width. This is causing problems when using print view on sites. For example, I have a set of columns which contain blocks with images in them. If I use this with print view it goes to flex-basis of 100 (and I can't override because of importance) which means that the image takes up full width of print page which is not what the user would expect."

### Root Cause
1. **Unscoped Media Queries Default to `all`:**
   In CSS, `@media (max-width: 781px)` without a specified media type defaults to `@media all and (max-width: 781px)`. This means it evaluates against all media types, including `screen` and `print`.
2. **Print Viewport Width Triggering Mobile Breakpoints:**
   Standard paper formats (A4 or US Letter) with standard 0.75-inch page margins produce a CSS print viewport width between **600px and 672px** at 96 CSS DPI. Because this is less than 782px (`$break-medium`), the browser treats the printed page as a mobile viewport and applies:
   ```scss
   @media (max-width: #{ ($break-medium - 1) }) {
       flex-basis: 100% !important;
   }
   ```
3. **High Specificity with `!important`:**
   Because `flex-basis: 100% !important` is applied with high specificity (`.wp-block-columns:not(.is-not-stacked-on-mobile) > .wp-block-column`), themes attempting to provide print styling (`@media print`) cannot easily override it without matching or exceeding that specificity plus `!important`.

---

## 2. Code Implementation Prepared

We have implemented and committed the following changes locally across 2 commits:

1. **Commit 1 (`820ba74402e`):**
   - In [`packages/block-library/src/columns/style.scss`](file:///Users/tanay/Local%20Sites/wp-contributions/app/public/wp-content/plugins/gutenberg/packages/block-library/src/columns/style.scss), updated the mobile breakpoint to `@media screen and (max-width: #{ ($break-medium - 1) })`.
   - Added an explicit `@media print` block ensuring `flex-wrap: nowrap !important;` and `flex-basis: 0; flex-grow: 1;` apply on paper, preserving horizontal column layouts and allowing inline widths (`style*="flex-basis"`) to maintain their sizing.

2. **Commit 2 (`e165e3348de`):**
   - In [`packages/block-library/src/media-text/style.scss`](file:///Users/tanay/Local%20Sites/wp-contributions/app/public/wp-content/plugins/gutenberg/packages/block-library/src/media-text/style.scss), updated `@media (max-width: #{ ($break-small) })` to `@media screen and (max-width: #{ ($break-small) })` so `.is-stacked-on-mobile` only stacks on mobile screens, leaving the desktop grid intact for print.
   - In [`packages/block-library/src/latest-posts/style.scss`](file:///Users/tanay/Local%20Sites/wp-contributions/app/public/wp-content/plugins/gutenberg/packages/block-library/src/latest-posts/style.scss), updated `@media (max-width: $break-small)` to `@media screen and (max-width: $break-small)`.
   - In [`packages/block-library/src/post-template/style.scss`](file:///Users/tanay/Local%20Sites/wp-contributions/app/public/wp-content/plugins/gutenberg/packages/block-library/src/post-template/style.scss), updated `@media (max-width: $break-small)` to `@media screen and (max-width: $break-small)`.

---

## 3. Probable Blockers & Questions for Senior Engineers / Architects

While the targeted fixes prevent mobile stacking in print, several architectural questions and potential blockers require senior input before pushing or opening a PR:

### Blocker 1: Asymmetry Between Mobile Queries and Base-Styles Breakpoint Mixins
- In [`@wordpress/base-styles/_mixins.scss`](file:///Users/tanay/Local%20Sites/wp-contributions/app/public/wp-content/plugins/gutenberg/packages/base-styles/_mixins.scss), mixins like `@mixin break-medium()` output `@media (min-width: 782px)` without a media type.
- Because a printed page is ~650px wide, `@media (min-width: 782px)` **does not match in print**.
- If we only scope the mobile query with `screen and`, then in print:
  - Mobile query (`screen and max-width: 781px`) does **not** match.
  - Desktop query (`min-width: 782px`) also does **not** match!
- This leaves the block in an intermediate/fallback state unless an explicit `@media print` rule is provided (as we did in Commit 1 for Columns).
- **Question:** Should Gutenberg adopt a centralized convention in `@wordpress/base-styles` (e.g. `@mixin break-medium-screen-or-print` or updating breakpoint mixins) rather than patching individual block SCSS files?

### Blocker 2: Print Layout Expectations for Dense Multi-Column Blocks
- On an 8.5" printed page, having 4, 5, or 6 columns horizontally can cause text squishing or horizontal clipping, whereas stacking might have been preferred by some users on narrow paper.
- Should there be user/theme configuration (e.g., a "Stack on print" attribute or theme.json setting), or should Gutenberg default to multi-column desktop layout on print?

### Blocker 3: Specificity and `!important` Usage
- The original issue exists largely because `flex-basis: 100% !important;` was used to override inline widths.
- We should consider whether CSS cascade layers (`@layer`) or lower specificity selectors in Gutenberg could eliminate the need for `!important`, allowing themes to freely customize print and screen styles without specificity battles.

### Blocker 4: Visual and Build Verification
- Per instructions, builds and test suites were not run. Automated visual regression or browser print preview emulation (testing Chrome/Firefox print rendering across A4 and Letter paper) should be performed to ensure no regressions in theme layouts.
