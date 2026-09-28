# Blockers & Technical Investigation Report: Issue #76610

**Issue Reference:** [WordPress/gutenberg#76610](https://github.com/WordPress/gutenberg/issues/76610)  
**Title:** *Block recovery when different language editors edit posts, with RTC implications*  
**Branch:** `fix/block-recovery-rtc-i18n-76610`  
**Engineer Level:** Entry-Level Software Engineer  
**Status:** Paused at architectural blockers (Code changes prepared, uncommitted)

---

## 1. Issue Overview & Root Cause Analysis

### The Reported Problem
When a block's `save()` method uses translation functions (e.g., `__()`, `_x()`) and users with different language locales edit the post:
1. **Single-user / Multi-locale scenario:** User 1 saves the post with an English backend (`en_US`). When User 2 (or User 1 switching to Norwegian `nb_NO`) opens the post, Gutenberg triggers a **Block Recovery** warning.
2. **Real-Time Collaboration (RTC) scenario:** When User 1 (English) and User 2 (Norwegian) edit the post in a collaborative session, whichever user saves last dictates the front-end language. However, when users exit and return, **both users are presented with Block Recovery warnings**, and multiple conflicting or invalid iterations of the block appear.

### Technical Root Cause
1. **Purity Violation of `save()`:**
   - Gutenberg validates blocks during parse by checking `isEquivalentHTML( block.originalContent, getSaveContent( blockType, block.attributes ) )`.
   - `save()` is architecturally required to be a pure function of `attributes`. Calling `__()` inside `save()` introduces an external runtime side-effect: the current user's admin locale (`get_user_locale()`).
   - The stored HTML in the database (`originalContent`) reflects the locale of the user who last saved the post. Any user with a different locale generates different HTML in their browser, causing block validation to fail (`isValid = false`).
2. **RTC Yjs CRDT Synchronization Bug:**
   - In `packages/core-data/src/utils/crdt-blocks.ts`, when `makeBlocksSerializable()` converts Gutenberg blocks to CRDT entries, it preserved `...rest`, which includes `isValid`, `originalContent`, and `__unstableBlockSource`.
   - When User 2 (Norwegian) opens the post, User 2's browser fails block validation locally (`isValid: false`).
   - In `areBlocksEqual()`, the comparison did not ignore `isValid`. Therefore, User 2's editor perceived the block as modified and synced `isValid: false` into the shared `Y.Doc`.
   - This change was broadcast via Yjs to other peers and persisted to the server via `saveCRDTDoc()`.
   - When User 1 re-visited the post, User 1 loaded the CRDT document containing `isValid: false`, displaying the Block Recovery prompt for User 1 as well!
   - In `packages/core-data/src/utils/crdt.ts`, `getPostChangesFromCRDTDoc` compares `__unstableSerializeAndClean( blocksJson ) !== editedRecord.content`. Because serialization in User 2's browser produces Norwegian HTML while `editedRecord.content` in the database is English, the editor continually detects unsaved differences on load.

---

## 2. Prepared Code Implementations (Uncommitted)

We have prepared the following implementations across three files without committing or pushing:

1. **Documentation Enhancement (`docs/reference-guides/block-api/block-edit-save.md`):**
   - Added an explicit, prominent warning callout explaining why `__()` and internationalization functions must **never** be used in `save()`.
   - Documented the exact failure modes: client-side block validation mismatch and Real-Time Collaboration (RTC) synchronization conflict.
   - Pointed developers to the `@wordpress/no-i18n-in-save` ESLint rule and proper design alternatives (server-side dynamic rendering via `render.php`/`render_callback`, or saving user-editable text into block attributes).

2. **CRDT Block Sanitization & Hygiene (`packages/core-data/src/utils/crdt-blocks.ts`):**
   - **`makeBlocksSerializable()`**: Explicitly excluded client-local validation and parser artifacts (`isValid`, `originalContent`, `validationIssues`, `__unstableBlockSource`) from blocks being prepared for CRDT sync.
   - **`areBlocksEqual()`**: Added `isValid: null`, `originalContent: null`, `validationIssues: null`, and `__unstableBlockSource: null` to the `overwrites` mask. This prevents a peer's local validation failure from being flagged as a content change.
   - **`createNewYBlock()`**: Filtered out `isValid`, `originalContent`, `validationIssues`, and `__unstableBlockSource` so they are never inserted into the shared Yjs `YBlock` map.
   - **`mergeCrdtBlocks()`**: Skipped client-local validation properties in the default merge branch to prevent writing local validation status to the shared Y.Doc.

3. **Validation Error Diagnostics (`packages/blocks/src/api/validation/index.ts`):**
   - Added an informative developer guidance note to `validateBlock()`'s error logger alerting developers when validation fails that translation functions in `save()` are discouraged and cause multi-locale failures.

---

## 3. Probable Blockers & Architectural Decisions Required

As an entry-level engineer, I have identified three fundamental architectural blockers that cannot be resolved without senior / architectural guidance from the Gutenberg core team:

### Blocker 1: Purity of `save()` vs. 3rd-Party Blocks (The Client-Side Validation Dilemma)
- **The Issue:** Even though WordPress core now has the `@wordpress/no-i18n-in-save` ESLint rule, thousands of existing third-party plugins in the WordPress ecosystem use `__()` inside `save()`.
- **The Dilemma:** Gutenberg's validation engine runs entirely in the client's browser and has no record of which language was active when `originalContent` was saved to the database.
- **Questions for Core Architects:**
  1. Should Gutenberg core consider locale-tagging in block comment delimiters (e.g. `<!-- wp:my/block {"_locale":"en_US"} -->`)? (Note: This would expand block serialization format and increase database payload).
  2. Or should third-party blocks with `__()` in `save()` be treated strictly as broken/unsupported, with linting and documentation as the sole official resolution?

### Blocker 2: Real-Time Collaboration (RTC) Serializer Conflict with Multi-Locale Collaborators
- **The Issue:** In an RTC session where User 1 is English and User 2 is Norwegian, both users share the same document state (`attributes` and `innerBlocks` in Yjs). However, WordPress persists a single serialized HTML string to `wp_posts.post_content` in MySQL.
- **The Dilemma:**
  - Whichever user triggers the REST API save (`wp/v2/posts/:id`) serializes the block tree using their own browser's locale. If User 2 saves, the database content permanently becomes Norwegian.
  - When User 1 opens the post later (without RTC active), User 1's validation will fail because the database HTML is in Norwegian while User 1's `save()` outputs English.
  - In `crdt.ts`, `getPostChangesFromCRDTDoc` re-serializes blocks to check if the post is dirty. A Norwegian collaborator's browser will always consider the post dirty if the database content was saved in English.
- **Questions for Core Architects:**
  1. In RTC, should `post_content` serialization always be forced to use the site default locale (`get_locale()`) instead of the individual user's admin locale (`get_user_locale()`)?
  2. Or should post HTML serialization for RTC-enabled posts be offloaded entirely to a server-side PHP endpoint, ensuring a single canonical rendering environment?

### Blocker 3: Scope and Handling of Genuinely Invalid Blocks in CRDT Documents
- **The Issue:** In our code preparation, we stopped synchronizing `isValid: false` and `__unstableBlockSource` across CRDT to prevent one user's local i18n failure from infecting other collaborators.
- **The Dilemma:**
  - What happens when a block is *genuinely* corrupted (e.g. malformed markup from an external copy-paste or database corruption)?
  - If Peer A sees a genuinely broken block and clicks "Attempt recovery", `BlockInvalidWarning` replaces the block with a fresh block created from attributes. That replacement *will* sync over CRDT as a block deletion/insertion.
  - If Peer B was concurrently editing that block, Peer B's changes could be abruptly discarded by Peer A's recovery action.
- **Questions for Core Architects:**
  1. How should the block recovery flow interact with active real-time collaboration?
  2. Should block recovery actions require collaborator consensus or be disabled while multiple peers are in the room?

---

## 4. Next Steps
- Awaiting review of the blockers above by the team/user before proceeding with any further structural or server-side changes.
- All code changes remain uncommitted on branch `fix/block-recovery-rtc-i18n-76610`.
