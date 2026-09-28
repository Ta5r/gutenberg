# Blockers & Technical Investigation Report: Issue #82288

**Issue Reference:** [WordPress/gutenberg#82288](https://github.com/WordPress/gutenberg/issues/82288)  
**Title:** *One Navigation's submenu makes a later, submenu-free Navigation interactive*  
**Branch:** `fix/navigation-has-submenus-leak-82288`  
**Engineer Level:** Entry-Level Software Engineer  
**Status:** Code implemented and committed locally; paused at architectural blockers (Unpushed)

---

## 1. Issue Background & Prior PR Context

### The Reported Issue
Reporter Jiwoon-Kim identified that in `WP_Navigation_Block_Renderer`:
```php
private static $has_submenus = false;

private static function has_submenus( $inner_blocks ) {
    if ( true === static::$has_submenus ) {
        return static::$has_submenus; // returns another block's answer
    }
    ...
    static::$has_submenus = true;
}
```
`static::$has_submenus` latched to `true` on the first Navigation block with submenus and was never reset. As a result, subsequent Navigation blocks rendered in the same HTTP request inherited `has_submenus = true` and unnecessarily loaded the `@wordpress/block-library/navigation/view` script module.

### Prior Resolution (PR #82366)
During investigation, I discovered that issue #82288 was closed on September 16, 2026, via PR [#82366](https://github.com/WordPress/gutenberg/pull/82366) (commit `3b8b4d717a73aab5093dbf114623f81ddf97edaa`), which added:
```php
// Submenu detection is memoized while a navigation block renders. Reset it so
// the result of a previously rendered navigation block is not reused for this one.
static::$has_submenus = false;
```
to `WP_Navigation_Block_Renderer::render()`.

---

## 2. Deeper Flaws Identified Beyond PR #82366

While PR #82366 prevented cross-block leakage between sequential navigation blocks, a deeper analysis reveals two significant architectural flaws still present in `WP_Navigation_Block_Renderer`:

### Flaw 1: Sentinel Value Collision (`false` is never memoized)
- In `has_submenus()`, the early return check was:
  ```php
  if ( true === static::$has_submenus ) {
      return static::$has_submenus;
  }
  ```
- Because `$has_submenus` was initialized to `false`, when a block has **no** submenus, `static::$has_submenus` remains `false`.
- Consequently, `if ( true === static::$has_submenus )` evaluates to `false` every single time.
- `has_submenus()` is called up to **5 times** during a single Navigation render (`handle_view_script_module_loading`, `get_nav_attributes`, `get_inner_blocks_html` x2, `get_responsive_container_markup`).
- Therefore, for every Navigation block without submenus, PHP repeatedly re-walks `$inner_blocks` and executes `get_pages()` up to 5 times per block render!

### Flaw 2: Re-entrancy & Nested Navigation Blocks
- Because `static::$has_submenus` is a single static property on the class, if an outer Navigation block contains inner blocks that render another Navigation block (e.g. via template parts, overlays, or nested patterns):
  1. Outer Navigation block starts rendering (has submenus -> `static::$has_submenus = true`).
  2. Inner Navigation block renders (calls `render()` -> resets `static::$has_submenus = false`).
  3. When execution returns to the outer Navigation block, the outer block's memoized value has been clobbered!

---

## 3. Implementation Prepared & Committed Locally

We implemented a robust fix across two commits on `fix/navigation-has-submenus-leak-82288`:

1. **Object-Scoped Caching in `packages/block-library/src/navigation/index.php` (Commit `950464924b4`):**
   - Introduced `private static $has_submenus_cache = array();` keyed by `spl_object_id( $inner_blocks )`.
   - Updated `has_submenus()` to check and cache the boolean result (both `true` AND `false`), eliminating redundant inner block scans and `get_pages()` queries.
   - Cleans up the cache entry at the end of `render()` (`unset( static::$has_submenus_cache[ spl_object_id( $inner_blocks ) ] )`), preventing memory buildup.
   - Maintained `static::$has_submenus = $has_submenus` for backward compatibility with external code.

2. **Unit Test for Nested Navigation Blocks in `phpunit/blocks/class-wp-navigation-block-renderer-test.php` (Commit `03aa24244a5`):**
   - Added `test_nested_navigation_blocks_do_not_clobber_outer_submenu_detection()` verifying that an inner submenu-free navigation block does not clobber an outer navigation block's submenu detection and interactivity.

---

## 4. Probable Blockers & Architectural Questions (Entry-Level Perspective)

As an entry-level software engineer, I have paused and identified the following blockers that require direction from senior developers/architects:

### Blocker 1: Issue Lifecycle Conflict (Issue #82288 is Already Closed)
- Issue #82288 has already been resolved and closed upstream via PR #82366.
- **Question:** Should these deeper improvements (per-object memoization and `false` caching) be opened as a new follow-up issue/PR (e.g. *"Navigation: Optimize submenu memoization and support nested navigation blocks"*), or is the existing sequential reset in PR #82366 considered sufficient by the maintainers?

### Blocker 2: Architectural Code Smell of Static Mutable State in Modern PHP
- `WP_Navigation_Block_Renderer` is an all-static utility class with mutable static properties:
  - `static::$has_submenus`
  - `static::$seen_menu_names`
  - `static::$needs_list_item_wrapper`
- In persistent worker runtimes (FrankenPHP worker mode, Swoole, RoadRunner, Laravel Octane), static class properties persist across multiple HTTP requests.
- If rendering fails or encounters an unhandled exception before `render()` finishes, state remains in memory and leaks into the next HTTP request!
- **Question:** Should WordPress Block Renderers move away from static classes toward instantiated renderers (e.g. `(new WP_Navigation_Block_Renderer())->render(...)`) or pass an ephemeral context object?

### Blocker 3: Memory Safety with `spl_object_id`
- In PHP, `spl_object_id` can be recycled by the engine once an object is destroyed.
- Although our implementation explicitly unsets the cache key at the end of `render()`, unhandled exceptions or early exits could leave orphan keys.
- **Question:** Is explicit unsetting acceptable, or should we wait until PHP 8.0+ `WeakMap` is standard in WordPress core before adopting object-keyed caching?

---

## 5. Next Steps
- Commits `950464924b4` and `03aa24244a5` remain local on branch `fix/navigation-has-submenus-leak-82288` (nothing pushed).
- Awaiting direction on Blocker 1 regarding whether to file a follow-up PR.
