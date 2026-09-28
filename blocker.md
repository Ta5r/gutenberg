# Blocker Report: Issue #81479

**Issue Reference:** [WordPress/gutenberg#81479](https://github.com/WordPress/gutenberg/issues/81479)  
**Title:** Identity: cropping an image via the media library selector does not update the canvas preview  
**Branch:** `fix/identity-media-crop-preview-81479`  
**Engineer Level:** Entry-Level Software Engineer  

---

## 1. Issue Summary & Root Cause Analysis

### The Problem
When navigating to **Site Editor → Design → Identity** (`/identity`), selecting **Site Logo** or **Site Icon** opens the media library modal (`wp.media`). If a user selects an image and crops it via the modal's built-in "Edit Image" tool (`wp.media.view.EditImage`), the cropped version is saved to the server. However, the canvas preview (the `core/site-logo` block inside the template-locked editor iframe) continues to show the pre-crop image until a full browser reload.

### Root Cause
1. **Asymmetric Invalidation (`getEntityRecords` vs `getEntityRecord`):**
   - In PR #79844, `invalidateAttachmentResolutions` was introduced in `@wordpress/media-utils` and `@wordpress/editor` to invalidate core-data cached resolutions when closing `MediaUpload`.
   - However, it **only** invalidated `resolvers.getEntityRecords` (plural query listings, e.g., Gallery block).
   - In contrast, the `SiteLogo` block on the canvas reads its attachment using `select( coreStore ).getEntityRecord( 'postType', 'attachment', _siteLogoId, { context: 'view' } )` (singular).
   - Because `resolvers.getEntityRecord` was never invalidated, `@wordpress/core-data` never re-resolved the attachment record from the REST API (`/wp/v2/media/{id}`). The canvas remained bound to the stale, in-memory attachment object.
2. **`editEntityRecord` No-Op on Unchanged Attachment ID:**
   - When an image is cropped via WordPress's image editor, the cropped file is saved to the **same** attachment post ID (appending `-e{timestamp}` to the file path).
   - When the user confirms the selection, `MediaEditControl` dispatches `onChangeControl( selectedMedia.id )`. Because the attachment ID did not change (e.g. `site_logo: 45`), the site entity record (`'root'`, `'site'`) experiences no diff, so components observing the site entity are not notified of any change.
3. **Core Data `getEntityRecord.shouldInvalidate` Missed Cache Invalidation:**
   - In `@wordpress/core-data`, `getEntityRecords.shouldInvalidate` handled `action.invalidateCache`, but `getEntityRecord.shouldInvalidate` only watched for template saves, ignoring `action.invalidateCache`.

---

## 2. Code Implementation Prepared

We have implemented and committed the following changes locally across 3 commits:

1. **Commit 1 (`cf3ff233c2c`):**
   - Updated `packages/media-utils/src/utils/invalidate-attachment-resolutions.ts` to invalidate all cached `getEntityRecord` (singular) resolutions matching `['postType', 'attachment', ...]`.
   - Updated `packages/editor/src/store/utils/attach-media-in-post/invalidate-attachment-resolutions.js` to mirror this behavior.
   - Updated unit tests in `packages/media-utils/src/utils/test/invalidate-attachment-resolutions.jsdom.test.ts` to verify both `getEntityRecords` and `getEntityRecord` cache invalidation.

2. **Commit 2 (`6cbbc035bd1`):**
   - Updated `getEntityRecord.shouldInvalidate` in `packages/core-data/src/resolvers.js` to support `action.invalidateCache` for `RECEIVE_ITEMS` and `REMOVE_ITEMS`.
   - Updated `packages/media-utils/src/components/media-upload/index.js` to invoke `invalidateAttachmentResolutions( { select, dispatch } )` during `onSelect` and `onUpdate`, guaranteeing invalidation immediately upon media selection.

3. **Commit 3 (`730f05ad627`):**
   - Updated `packages/fields/src/components/media-edit/index.tsx` (`MediaEditControl`) to dispatch `receiveEntityRecords( 'postType', 'attachment', [], undefined, true )` during `onSelect`, ensuring attachment queries are invalidated even when using alternative or experimental modal implementations.

---

## 3. Probable Blockers & Questions for Senior Engineers / Product Designers

While the technical cache invalidation is implemented, the following architectural and product blockers require clarification before pushing or opening a PR:

### Blocker 1: Core Team Position & Feature vs Bug Scope
Core contributor Aki Hamano (@t-hamano) commented on issue #81479:
> *"Thanks for the report. As I understand it, the current Gutenberg does not provide a UI for cropping images for the site icon in either the post editor or the site editor, similar to how images cannot be cropped in the site logo block. In any case, since this is a feature enhancement, I will exclude it from the 7.1 release."*
- **Question:** Does the Gutenberg team consider this purely a cache-invalidation bug for the legacy media modal workflow, or is the intention to design and build a native cropping UI (similar to the classic Customizer's 512x512 forced square crop or block-level crop tools) for Site Logo / Site Icon?

### Blocker 2: Site Icon vs Canvas Preview Semantics
- In Site Editor → Design → Identity, `site_icon` is stored in the site settings for favicons and mobile app icons.
- **`site_icon` is not rendered on the template canvas** unless a `core/site-logo` block specifically enables `shouldSyncIcon: true`.
- If a user crops a `site_icon` and expects the canvas preview to change, nothing will show on the canvas unless a Site Logo block is synced. We should confirm whether documentation or UI feedback should clarify this distinction.

### Blocker 3: In-Memory REST Data vs Browser HTTP Image Cache
- When `getEntityRecord` is invalidated, `@wordpress/data` triggers an asynchronous REST request to `/wp/v2/media/{id}`.
- Although WordPress appends `-e{timestamp}` to the file URL upon cropping, browser caching or image loading delay in the canvas `iframe` could cause a brief flicker or display latency.
- Full end-to-end verification in a live WordPress environment (with PHP GD / Imagick enabled) is recommended to ensure the iframe canvas re-renders smoothly.
