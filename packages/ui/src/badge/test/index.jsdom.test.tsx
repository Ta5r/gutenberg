import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Badge } from '../index';
import type { BadgeIntent } from '../types';

describe( 'Badge', () => {
	describe( 'basic behaviour', () => {
		it( 'forwards ref', () => {
			const ref = createRef< HTMLSpanElement >();
			render( <Badge ref={ ref }>Status</Badge> );

			expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
		} );

		it( 'renders text children', () => {
			render( <Badge>Active</Badge> );

			expect( screen.getByText( 'Active' ) ).toBeVisible();
		} );

		it( 'defaults to none intent', () => {
			render( <Badge>Default</Badge> );

			const badge = screen.getByText( 'Default' );
			expect( badge.className ).toMatch( /is-none-intent/ );
		} );

		it( 'merges custom className and passes through HTML attributes', () => {
			render(
				<Badge className="custom-class" data-testid="custom-badge">
					Custom
				</Badge>
			);

			const badge = screen.getByTestId( 'custom-badge' );
			expect( badge ).toHaveClass( 'custom-class' );
		} );
	} );

	describe( 'canonical status tones', () => {
		const tones: BadgeIntent[] = [
			'neutral',
			'info',
			'caution',
			'warning',
			'success',
			'error',
			'draft',
		];

		it.each( tones )( 'renders %s intent correctly', ( intent ) => {
			render( <Badge intent={ intent }>{ intent }</Badge> );

			const badge = screen.getByText( intent );
			expect( badge.className ).toMatch(
				new RegExp( `is-${ intent }-intent` )
			);
		} );
	} );

	describe( 'priority aliases', () => {
		const aliases: BadgeIntent[] = [
			'none',
			'informational',
			'low',
			'medium',
			'stable',
			'high',
		];

		it.each( aliases )( 'renders %s alias intent correctly', ( intent ) => {
			render( <Badge intent={ intent }>{ intent }</Badge> );

			const badge = screen.getByText( intent );
			expect( badge.className ).toMatch(
				new RegExp( `is-${ intent }-intent` )
			);
		} );
	} );
} );
