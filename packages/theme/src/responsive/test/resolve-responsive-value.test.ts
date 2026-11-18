import { describe, expect, it } from 'vitest';
import {
	BREAKPOINTS,
	getActiveBreakpoint,
	matchesBreakpoint,
	resolveResponsiveValue,
} from '../index.ts';

describe( 'responsive value resolution', () => {
	describe( 'getActiveBreakpoint', () => {
		it( 'returns default for widths narrower than xs or invalid numbers', () => {
			expect( getActiveBreakpoint( 0 ) ).toBe( 'default' );
			expect( getActiveBreakpoint( BREAKPOINTS.xs - 1 ) ).toBe(
				'default'
			);
			expect( getActiveBreakpoint( -100 ) ).toBe( 'default' );
			expect( getActiveBreakpoint( Number.NaN ) ).toBe( 'default' );
			expect( getActiveBreakpoint( Number.POSITIVE_INFINITY ) ).toBe(
				'default'
			);
		} );

		it( 'returns the largest matching breakpoint at and above each threshold', () => {
			expect( getActiveBreakpoint( 480 ) ).toBe( 'xs' );
			expect( getActiveBreakpoint( 599 ) ).toBe( 'xs' );
			expect( getActiveBreakpoint( 600 ) ).toBe( 'sm' );
			expect( getActiveBreakpoint( 782 ) ).toBe( 'md' );
			expect( getActiveBreakpoint( 960 ) ).toBe( 'lg' );
			expect( getActiveBreakpoint( 1280 ) ).toBe( 'xl' );
			expect( getActiveBreakpoint( 1440 ) ).toBe( '2xl' );
			expect( getActiveBreakpoint( 2560 ) ).toBe( '2xl' );
		} );
	} );

	describe( 'matchesBreakpoint', () => {
		it( 'evaluates >= and < operators accurately', () => {
			expect( matchesBreakpoint( 782, 'md' ) ).toBe( true );
			expect( matchesBreakpoint( 781, 'md' ) ).toBe( false );
			expect( matchesBreakpoint( 781, 'md', '<' ) ).toBe( true );
			expect( matchesBreakpoint( 782, 'md', '<' ) ).toBe( false );
			expect( matchesBreakpoint( Number.NaN, 'md' ) ).toBe( false );
		} );
	} );

	describe( 'resolveResponsiveValue', () => {
		it( 'returns default when active breakpoint is default', () => {
			expect(
				resolveResponsiveValue(
					{ default: 'compact', lg: 'comfortable' },
					'default'
				)
			).toBe( 'compact' );
		} );

		it( 'cascades mobile-first to the nearest smaller defined breakpoint', () => {
			const columns = {
				default: 1,
				sm: 2,
				xl: 4,
			};

			expect( resolveResponsiveValue( columns, 'default' ) ).toBe( 1 );
			expect( resolveResponsiveValue( columns, 'xs' ) ).toBe( 1 );
			expect( resolveResponsiveValue( columns, 'sm' ) ).toBe( 2 );
			expect( resolveResponsiveValue( columns, 'md' ) ).toBe( 2 );
			expect( resolveResponsiveValue( columns, 'lg' ) ).toBe( 2 );
			expect( resolveResponsiveValue( columns, 'xl' ) ).toBe( 4 );
			expect( resolveResponsiveValue( columns, '2xl' ) ).toBe( 4 );
		} );

		it( 'preserves explicit undefined overrides in responsive maps', () => {
			const density: {
				default: string | undefined;
				md?: string | undefined;
				lg?: string | undefined;
			} = {
				default: undefined,
				md: 'compact',
				lg: undefined,
			};

			expect( resolveResponsiveValue( density, 'default' ) ).toBe(
				undefined
			);
			expect( resolveResponsiveValue( density, 'md' ) ).toBe( 'compact' );
			expect( resolveResponsiveValue( density, 'lg' ) ).toBe( undefined );
			expect( resolveResponsiveValue( density, 'xl' ) ).toBe( undefined );
		} );
	} );
} );
