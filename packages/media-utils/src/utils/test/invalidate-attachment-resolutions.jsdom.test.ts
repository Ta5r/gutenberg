import { describe, expect, it, vi } from 'vitest';
import { invalidateAttachmentResolutions } from '../invalidate-attachment-resolutions';

type Registry = Parameters< typeof invalidateAttachmentResolutions >[ 0 ];

/**
 * Builds a minimal registry stub whose `getCachedResolvers()` returns the
 * supplied maps, and captures the `invalidateResolution` calls.
 *
 * @param entityRecords The cached `getEntityRecords` resolutions (or undefined).
 * @param entityRecord  The cached `getEntityRecord` resolutions (or undefined).
 */
function createRegistryStub(
	entityRecords: Map< unknown[], { status: string } > | undefined,
	entityRecord?: Map< unknown[], { status: string } > | undefined
) {
	const invalidateResolution = vi.fn();
	const registry = {
		select: () => ( {
			getCachedResolvers: () => ( {
				getEntityRecords: entityRecords,
				getEntityRecord: entityRecord,
			} ),
		} ),
		dispatch: () => ( { invalidateResolution } ),
	} as unknown as Registry;

	return { registry, invalidateResolution };
}

describe( 'invalidateAttachmentResolutions', () => {
	it( 'invalidates both getEntityRecords and getEntityRecord resolutions for attachments', () => {
		const attachmentPage1 = [ 'postType', 'attachment', { parent: 1 } ];
		const attachmentPage2 = [
			'postType',
			'attachment',
			{ parent: 1, page: 2 },
		];
		const postQuery = [ 'postType', 'post', { per_page: 10 } ];
		const rootMediaQuery = [ 'root', 'media', {} ];

		const singleAttachment1 = [
			'postType',
			'attachment',
			45,
			{ context: 'view' },
		];
		const singleAttachment2 = [ 'postType', 'attachment', 99 ];
		const singlePost = [ 'postType', 'post', 123 ];

		const { registry, invalidateResolution } = createRegistryStub(
			new Map( [
				[ attachmentPage1, { status: 'finished' } ],
				[ attachmentPage2, { status: 'finished' } ],
				[ postQuery, { status: 'finished' } ],
				[ rootMediaQuery, { status: 'finished' } ],
			] ),
			new Map( [
				[ singleAttachment1, { status: 'finished' } ],
				[ singleAttachment2, { status: 'finished' } ],
				[ singlePost, { status: 'finished' } ],
			] )
		);

		invalidateAttachmentResolutions( registry );

		// Both attachment queries (including paginated and single records) are invalidated,
		// with their exact args, and nothing else is touched.
		expect( invalidateResolution ).toHaveBeenCalledTimes( 4 );
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecords',
			attachmentPage1
		);
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecords',
			attachmentPage2
		);
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			singleAttachment1
		);
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			singleAttachment2
		);
		expect( invalidateResolution ).not.toHaveBeenCalledWith(
			'getEntityRecords',
			postQuery
		);
		expect( invalidateResolution ).not.toHaveBeenCalledWith(
			'getEntityRecords',
			rootMediaQuery
		);
		expect( invalidateResolution ).not.toHaveBeenCalledWith(
			'getEntityRecord',
			singlePost
		);
	} );

	it( 'does nothing when there are no cached resolutions', () => {
		const { registry, invalidateResolution } = createRegistryStub(
			undefined,
			undefined
		);

		invalidateAttachmentResolutions( registry );

		expect( invalidateResolution ).not.toHaveBeenCalled();
	} );
} );
