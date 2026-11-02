import { describe, expect, it } from 'vitest';
import { computeFieldDiff, isEmptyValue } from '../diff';
import type { NormalizedField } from '../../types';

describe( 'diff utils', () => {
	describe( 'isEmptyValue', () => {
		it( 'returns true for empty values', () => {
			expect( isEmptyValue( undefined ) ).toBe( true );
			expect( isEmptyValue( null ) ).toBe( true );
			expect( isEmptyValue( '' ) ).toBe( true );
			expect( isEmptyValue( [] ) ).toBe( true );
			expect( isEmptyValue( {} ) ).toBe( true );
		} );

		it( 'returns false for non-empty values', () => {
			expect( isEmptyValue( 'hello' ) ).toBe( false );
			expect( isEmptyValue( 0 ) ).toBe( false );
			expect( isEmptyValue( false ) ).toBe( false );
			expect( isEmptyValue( [ 1 ] ) ).toBe( false );
			expect( isEmptyValue( { a: 1 } ) ).toBe( false );
			expect( isEmptyValue( new Date() ) ).toBe( false );
		} );
	} );

	describe( 'computeFieldDiff', () => {
		const textField = {
			id: 'title',
			getValue: ( { item }: { item: { title?: string } } ) => item.title,
		} as NormalizedField< { title?: string } >;

		it( 'returns undefined when previousItem is undefined', () => {
			const diff = computeFieldDiff( textField, { title: 'New' } );
			expect( diff ).toBeUndefined();
		} );

		it( 'detects unchanged field', () => {
			const diff = computeFieldDiff(
				textField,
				{ title: 'Hello' },
				{ title: 'Hello' }
			);
			expect( diff ).toEqual( {
				fieldId: 'title',
				status: 'unchanged',
				currentValue: 'Hello',
				previousValue: 'Hello',
				hasChanged: false,
			} );
		} );

		it( 'detects added field', () => {
			const diff = computeFieldDiff(
				textField,
				{ title: 'New title' },
				{ title: '' }
			);
			expect( diff ).toEqual( {
				fieldId: 'title',
				status: 'added',
				currentValue: 'New title',
				previousValue: '',
				hasChanged: true,
			} );
		} );

		it( 'detects removed field', () => {
			const diff = computeFieldDiff(
				textField,
				{ title: '' },
				{ title: 'Old title' }
			);
			expect( diff ).toEqual( {
				fieldId: 'title',
				status: 'removed',
				currentValue: '',
				previousValue: 'Old title',
				hasChanged: true,
			} );
		} );

		it( 'detects modified field', () => {
			const diff = computeFieldDiff(
				textField,
				{ title: 'Modified title' },
				{ title: 'Initial title' }
			);
			expect( diff ).toEqual( {
				fieldId: 'title',
				status: 'modified',
				currentValue: 'Modified title',
				previousValue: 'Initial title',
				hasChanged: true,
			} );
		} );

		it( 'handles deep object equality', () => {
			const objectField = {
				id: 'meta',
				getValue: ( { item }: { item: { meta?: object } } ) =>
					item.meta,
			} as NormalizedField< { meta?: object } >;

			const diffUnchanged = computeFieldDiff(
				objectField,
				{ meta: { author: 'Alice', tags: [ 'a', 'b' ] } },
				{ meta: { author: 'Alice', tags: [ 'a', 'b' ] } }
			);
			expect( diffUnchanged?.status ).toBe( 'unchanged' );

			const diffModified = computeFieldDiff(
				objectField,
				{ meta: { author: 'Alice', tags: [ 'a', 'b', 'c' ] } },
				{ meta: { author: 'Alice', tags: [ 'a', 'b' ] } }
			);
			expect( diffModified?.status ).toBe( 'modified' );
		} );
	} );
} );
