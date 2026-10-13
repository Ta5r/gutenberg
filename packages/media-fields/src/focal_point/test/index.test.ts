import { describe, expect, it } from 'vitest';
import focalPointField from '../index';
import type { MediaItem } from '../../types';

describe( 'focalPointField', () => {
	it( 'has correct field configuration', () => {
		expect( focalPointField ).toMatchObject( {
			id: 'focal_point',
			type: 'text',
			label: 'Focal point',
			enableSorting: false,
			filterBy: false,
		} );
	} );

	describe( 'isVisible', () => {
		it.each( [
			[ { media_type: 'image' }, true ],
			[ { mime_type: 'image/jpeg' }, true ],
			[ { media_type: 'video', mime_type: 'video/mp4' }, false ],
			[
				{ media_type: 'application', mime_type: 'application/pdf' },
				false,
			],
			[ {}, false ],
		] )( 'returns %s for %j', ( item, expected ) => {
			const result = focalPointField.isVisible?.( item as MediaItem );
			expect( result ).toBe( expected );
		} );
	} );
} );
