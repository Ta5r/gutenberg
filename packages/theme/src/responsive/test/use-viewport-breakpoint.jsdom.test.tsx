import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useViewportBreakpoint } from '../use-viewport-breakpoint.ts';

function createMockWindow( initialWidth: number ) {
	let width = initialWidth;
	const listeners = new Map< string, Set< () => void > >();

	const evaluateQuery = ( query: string ) => {
		const match = /\(min-width:\s*(\d+)px\)/.exec( query );
		if ( ! match ) {
			return false;
		}
		return width >= Number( match[ 1 ] );
	};

	const mockWindow = {
		matchMedia( query: string ) {
			let queryListeners = listeners.get( query );
			if ( ! queryListeners ) {
				queryListeners = new Set();
				listeners.set( query, queryListeners );
			}

			return {
				media: query,
				get matches() {
					return evaluateQuery( query );
				},
				addEventListener( _event: string, listener: () => void ) {
					queryListeners!.add( listener );
				},
				removeEventListener( _event: string, listener: () => void ) {
					queryListeners!.delete( listener );
				},
			};
		},
	} as unknown as Window;

	const setWidth = ( nextWidth: number ) => {
		width = nextWidth;
		for ( const queryListeners of listeners.values() ) {
			for ( const listener of queryListeners ) {
				listener();
			}
		}
	};

	return { mockWindow, setWidth };
}

function ViewportProbe( { targetWindow }: { targetWindow?: Window } ) {
	const breakpoint = useViewportBreakpoint( { window: targetWindow } );
	return <span data-testid="breakpoint">{ breakpoint }</span>;
}

describe( 'useViewportBreakpoint', () => {
	it( 'resolves the active breakpoint and updates on media query changes', () => {
		const { mockWindow, setWidth } = createMockWindow( 400 );
		render( <ViewportProbe targetWindow={ mockWindow } /> );

		expect( screen.getByTestId( 'breakpoint' ) ).toHaveTextContent(
			'default'
		);

		act( () => {
			setWidth( 600 );
		} );
		expect( screen.getByTestId( 'breakpoint' ) ).toHaveTextContent( 'sm' );

		act( () => {
			setWidth( 1000 );
		} );
		expect( screen.getByTestId( 'breakpoint' ) ).toHaveTextContent( 'lg' );

		act( () => {
			setWidth( 1600 );
		} );
		expect( screen.getByTestId( 'breakpoint' ) ).toHaveTextContent( '2xl' );
	} );

	it( 'evaluates media queries independently per window (iframe support)', () => {
		const host = createMockWindow( 1440 );
		const iframe = createMockWindow( 500 );

		render(
			<>
				<div data-testid="host">
					<ViewportProbe targetWindow={ host.mockWindow } />
				</div>
				<div data-testid="iframe">
					<ViewportProbe targetWindow={ iframe.mockWindow } />
				</div>
			</>
		);

		expect( screen.getByTestId( 'host' ) ).toHaveTextContent( '2xl' );
		expect( screen.getByTestId( 'iframe' ) ).toHaveTextContent( 'xs' );

		act( () => {
			iframe.setWidth( 800 );
		} );

		expect( screen.getByTestId( 'host' ) ).toHaveTextContent( '2xl' );
		expect( screen.getByTestId( 'iframe' ) ).toHaveTextContent( 'md' );
	} );
} );
