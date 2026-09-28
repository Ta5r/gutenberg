import type { DataRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Invalidates every cached `getEntityRecords` and `getEntityRecord` resolution
 * for the `attachment` post type, so components listing media attached to the
 * current post (e.g. the Gallery block's dynamic mode) or components displaying
 * individual attachments (e.g. the Site Logo block on the canvas or featured image)
 * re-resolve against the server after an upload or in-place edit (like cropping).
 *
 * `invalidateResolution` only clears the exact query passed to it — on a
 * paginated grid, page 1 (where a new upload lands) would stay stale — while
 * `invalidateResolutionForStoreSelector` clears every `getEntityRecords`
 * resolution, unrelated entity types included. This walks the cached
 * resolutions and invalidates only the `['postType', 'attachment', …]` entries.
 *
 * @param registry A `@wordpress/data` registry (`useRegistry()`), or the
 *                 default-registry `{ select, dispatch }` exports.
 */
export function invalidateAttachmentResolutions(
	registry: Pick< DataRegistry, 'select' | 'dispatch' >
) {
	const resolvers = registry.select( coreStore ).getCachedResolvers();

	// getCachedResolvers() is typed as Record<string, unknown> but the values
	// are EquivalentKeyMap instances (Map-like). Cast the same way the
	// resolvers-cache-middleware does internally.
	const entityRecordsResolutions = resolvers.getEntityRecords as
		| Map< unknown[], { status: string } >
		| undefined;

	entityRecordsResolutions?.forEach( ( _value, args ) => {
		if ( args[ 0 ] === 'postType' && args[ 1 ] === 'attachment' ) {
			registry
				.dispatch( coreStore )
				.invalidateResolution( 'getEntityRecords', args );
		}
	} );

	const entityRecordResolutions = resolvers.getEntityRecord as
		| Map< unknown[], { status: string } >
		| undefined;

	entityRecordResolutions?.forEach( ( _value, args ) => {
		if ( args[ 0 ] === 'postType' && args[ 1 ] === 'attachment' ) {
			registry
				.dispatch( coreStore )
				.invalidateResolution( 'getEntityRecord', args );
		}
	} );
}
