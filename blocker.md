# Blockers & Technical Considerations: DataViews Always-Visible Action Buttons

**Issue Reference:** [WordPress/gutenberg#82109](https://github.com/WordPress/gutenberg/issues/82109) — *DataViews: allow rendering actions as always-visible buttons*  
**Branch:** `fix/dataviews-actions-buttons-82109`  
**Engineer Perspective:** Entry-Level Software Engineer

---

## 1. Summary of Completed Implementation
We have implemented the complete code foundation for rendering primary actions as always-visible buttons across DataViews:
1. **Types (`packages/dataviews/src/types/dataviews.ts`)**:
   - Added `actions?: 'text' | 'button'` to `ViewTable['layout']`, `ViewList['layout']`, `ViewGrid['layout']`, `ViewPickerTable['layout']`, and `ViewPickerGrid['layout']`.
   - Added `variant?: 'button-default' | 'button-outline'` to `ActionBase< Item >` (applicable to both callback actions and modal actions).
2. **Item Actions & Primary Actions (`packages/dataviews/src/components/dataviews-item-actions/`)**:
   - Added `actionsLayout?: 'text' | 'button'` prop to `ItemActions`, `PrimaryActions`, and `ButtonTrigger`.
   - Mapped `action.variant === 'button-outline'` to `'secondary'` (outline button) and `button-default` (or default fallback) to `'primary'` (default solid button).
   - Added `.has-button-actions` class to `.dataviews-item-actions` and scoped hover opacity rules and unstyled button padding so button actions maintain standard design-system button dimensions and padding.
   - Preserved visibility on mobile viewports when `actionsLayout === 'button'`.
3. **Layout Renderers**:
   - **Table (`packages/dataviews/src/components/dataviews-layouts/table/`)**: Passed `actionsLayout={ view.layout?.actions }` to `ItemActions` and ensured buttons remain visible at all times (`opacity: 1`) in `.has-button-actions`.
   - **List (`packages/dataviews/src/components/dataviews-layouts/list/`)**: Updated `PrimaryActionGridCell` with `actionsLayout` and variant mapping, and applied `.has-button-actions` to keep the button visible without requiring row hover.
   - **Grid (`packages/dataviews/src/components/dataviews-layouts/grid/`)**: Filtered eligible primary actions in `GridItem`, rendered them at the bottom of the card (`.dataviews-view-grid__card-actions`) with full width and auto top margin when `view.layout?.actions === 'button'`, while preventing click bubbling to card handlers.
4. **Unit Tests & Storybook**:
   - Added comprehensive tests in `packages/dataviews/src/dataviews/test/dataviews.jsdom.test.tsx` testing Table, List, and Grid layouts with `button-default` and `button-outline`.
   - Added `actionsLayout` controls (`'text'` vs `'button'`) to Table, List, and Grid Storybook stories.

---

## 2. Identified Blockers & Open Design Questions

### Blocker 1: Multiple Primary Actions Behavior & Layout Inconsistencies
- **Context:**
  In the issue description, @oandregal states:
  > *"An item can have 0, 1, or multiple primary actions as now. It's the consumer responsibility to enforce a good design according to guidelines (e.g., 'only use 1 primary action at most when in CTA mode')."*
- **The Problem:**
  - **In Table layout:** Table renders all primary actions side-by-side. If a consumer defines 2 or 3 primary actions, multiple buttons render in the Actions column. On narrow tables or smaller screens, this can cause significant column crowding or wrap awkwardly.
  - **In List layout:** `ListItem` currently only takes the *first* primary action (`primaryAction: _primaryActions[ 0 ]`) and pushes everything else into the dropdown menu (`...`). If a consumer specifies 2 primary actions in CTA mode, only the first renders as a button, while the second ends up inside the dropdown.
  - **In Grid layout:** Multiple primary actions stack vertically at the bottom of the card. A card with 2 primary actions will be taller than a card with 1 primary action in the same row unless min-height or flex stretch is strictly calibrated.
- **Decision Needed:**
  Should List layout be refactored to support rendering multiple primary buttons (matching Table), or should all layouts enforce a single primary CTA button when `view.layout.actions === 'button'`?

---

### Blocker 2: Mobile Viewport Handling for CTA Buttons
- **Context:**
  In existing DataViews code, primary actions in Table and Activity layouts are hidden on mobile viewports (`useViewportMatch( 'medium', '<' )`) and merged into the `...` menu to prevent horizontal overflow.
- **The Problem:**
  In CTA mode (`view.layout.actions === 'button'`), hiding the primary CTA on mobile defeats the purpose of the call-to-action (e.g. users on mobile won't see "Install" or "View details" directly on the screen).
  Our implementation keeps the primary button visible on mobile when `actionsLayout === 'button'`.
- **Decision Needed:**
  Does core design want to keep CTA buttons visible on mobile for all layouts (Table, List, Grid), or should Table layout on mobile collapse into a combined button/dropdown pattern?

---

### Blocker 3: Design System Button Component Choice (`@wordpress/components` vs `@wordpress/ui`)
- **Context:**
  The issue refers to Storybook URLs from the new `@wordpress/ui` package:
  `design-system-components-button--default` and `design-system-components-button--outline`.
  However, `ItemActions` and `PrimaryActionGridCell` currently render `<Button>` from `@wordpress/components`.
  In `packages/dataviews/src/components/dataviews-item-actions/style.scss`, there is an existing comment:
  `// TODO: the way forward here would be to use the new unstyle button coming from wordpress/ui package, but we're not ready to use it yet.`
- **The Problem:**
  In `@wordpress/components`, the buttons use `variant="primary"` (solid brand) and `variant="secondary"` (outline). In `@wordpress/ui`, the buttons use `variant="solid"` and `variant="outline"`.
- **Decision Needed:**
  Should we keep using `@wordpress/components` `<Button>` mapping `button-default` -> `primary` and `button-outline` -> `secondary` (our current approach, which avoids breaking existing dataviews styling), or is this issue the signal to migrate `ItemActions` to `@wordpress/ui`'s `Button`?
