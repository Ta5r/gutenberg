# Architectural Blockers: Add Author Filter to Patterns Data Views (Issue #59497)

## Overview & Context
- **Issue**: [WordPress/gutenberg#59497](https://github.com/WordPress/gutenberg/issues/59497) — *"Add Author filter to patterns data views"*
- **Goal**: Enable filtering pattern DataViews to display patterns added by a specific user, plugin, or theme, ideally using a multi-select filter so users can select multiple sources.
- **Approach**: Entry-level software engineer assessment of implementation feasibility, data flow, and architecture.

---

## Summary of Prepared Implementation
The initial code implementation has been prepared and committed locally:
1. **`patternAuthorField` Definition (`packages/fields/src/fields/pattern-author/index.tsx`)**:
   - Implemented a dedicated field definition for pattern authors.
   - Configured `filterBy` with `operators: ['isAny', 'isNone']` and `isPrimary: true` to enable multi-select filtering.
   - Configured `getElements` to dynamically query WordPress user authors and active theme details.
2. **Field Schema Registration (`packages/editor/src/dataviews/store/private-actions.ts`)**:
   - Added `isPattern && patternAuthorField` to the DataViews field schema for `wp_block`.
3. **Data Augmentation (`packages/edit-site/src/components/page-patterns/use-patterns.js`)**:
   - Augmented theme patterns with `original_source` and `author_text` based on active theme and pattern source properties.
   - Augmented user pattern posts (`wp_block`) with `author_text` derived from resolved author users.
4. **DataViews Filter Pipeline (`packages/edit-site/src/components/page-patterns/index.jsx`)**:
   - Removed the blanket clearing of all filters (`viewWithoutFilters.filters = []`) for patterns, specifically retaining the `author` filter so `filterSortAndPaginate` can evaluate it client-side.
5. **View Configuration (`lib/compat/wordpress-7.1/view-config-api.php`)**:
   - Added `'author'` to the default visible fields for `wp_block`.

---

## Identified Blockers & Architectural Dilemmas

### 1. WordPress Core REST API Schema Deficiency: `wp_block` Post Type Does Not Support `author`
- **Finding**: In WordPress core (`create_initial_post_types()`), `wp_block` is registered with:
  ```php
  'supports' => array( 'title', 'editor', 'revisions', 'custom-fields' )
  ```
  Notice that `'author'` is **not** included in the supports array.
- **Consequence**: `WP_REST_Posts_Controller::get_item_schema()` explicitly checks `post_type_supports( $this->post_type, 'author' )`. Because it returns `false`, the REST API endpoint `/wp/v2/blocks` omits the `author` property from both its schema and response records. In JavaScript, `pattern.author` on user pattern records is `undefined`.
- **Dilemma**: 
  - Should Gutenberg inject `add_post_type_support( 'wp_block', 'author' )` during `init` in PHP?
  - Or should `WP_REST_Blocks_Controller` explicitly expose `author` and `author_text` in the REST response (similar to `WP_REST_Templates_Controller` for `wp_template`)?

---

### 2. Registered Patterns Lack Granular Author / Plugin Origin Metadata
- **Finding**: Patterns in the Site Editor are a hybrid collection of user patterns (`wp_block` database posts) and registered patterns (`theme.json` / PHP `register_block_pattern()`). Registered patterns are served by `/wp/v2/block-patterns/patterns` from `WP_Block_Patterns_Registry`.
- **Consequence**: In `WP_Block_Patterns_Registry`, pattern registrations do not have an `author`, `plugin`, or `theme` field. The only metadata available is `source`, which is typically a coarse string: `'theme'` or `'plugin'`.
- **Dilemma**:
  - If multiple plugins register patterns (e.g., WooCommerce, Yoast, Jetpack), all patterns may report `source: 'plugin'` with no standardized way to know *which* plugin registered them.
  - While we could attempt to parse the pattern's prefix name (e.g., `pattern.name.split('/')[0]`), namespace prefixes are not guaranteed to correspond to installed plugin slugs or titles.
  - Does WordPress core / Gutenberg need to update `register_block_pattern` and `WP_REST_Block_Patterns_Controller` to include origin metadata (plugin/theme name, slug, author)?

---

### 3. Data Heterogeneity: Unified Multi-Select Filter Across Dissimilar Entities
- **Finding**: The issue requests:
  > *"filter pattern data views to show only those patterns added by a specific user, plugin, or theme. This would ideally be a multi-select filter so that you can select multiple sources."*
- **Consequence**:
  - WordPress user patterns have numeric user IDs (`author: 1`).
  - Themes have theme slugs / names (`twentytwentyfour`).
  - Plugins have plugin slugs / names (`woocommerce`).
- **Dilemma**:
  - How should values in the multi-select filter be formatted?
    1. Composite strings: `{ value: 'user:1', label: 'Admin (User)' }`, `{ value: 'theme:twentytwentyfour', label: 'Twenty Twenty-Four (Theme)' }`, `{ value: 'plugin:woocommerce', label: 'WooCommerce (Plugin)' }`.
    2. Plain display strings (`author_text`): Matches string names (e.g., `'Admin'`, `'Twenty Twenty-Four'`), but carries risk of naming collisions.
  - Standard DataViews `authorField` uses integer user IDs and `operators: ['isAny', 'isNone']`. A hybrid source field requires custom operator handling and normalization.

---

### 4. Client-Side vs Server-Side Filtering Architecture
- **Finding**: In `packages/edit-site/src/components/page-patterns/index.jsx`, search and `sync-status` are handled server-side / upstream, whereas `template-part` author filtering is handled client-side in memory via `filterSortAndPaginate`.
- **Consequence**:
  - User patterns could theoretically be queried via `/wp/v2/blocks?author=X`.
  - However, registered theme and plugin patterns exist only in-memory from `getBlockPatterns()`. They cannot be filtered via the `wp_block` REST endpoint.
  - Therefore, any filtering across the combined list of patterns *must* happen client-side in memory.
  - Although `usePatterns` currently fetches `{ per_page: -1 }`, if large sites contain thousands of user patterns, client-side filtering on unpaginated REST payloads degrades performance and blocks server-side pagination.

---

## Questions for Senior Engineers / Core Maintainers
1. **Post Type Support**: Can we safely add `add_post_type_support( 'wp_block', 'author' )` in Gutenberg's PHP bootstrap, or does `wp_block` require an explicit `author_text` field in `WP_REST_Blocks_Controller`?
2. **Pattern Registry Metadata**: Is there an ongoing initiative or RFC to extend `register_block_pattern` with plugin/theme ownership metadata?
3. **Filter Semantics**: Should the DataViews filter be labeled "Author" or "Source / Author", and should its value schema be namespaced composite identifiers (`source:id`)?
