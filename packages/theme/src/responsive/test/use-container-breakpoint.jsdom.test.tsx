import { act, render, screen } from '@testing-library/react';
import { useRef } from '@wordpress/element';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useContainerBreakpoint } from '../use-container-breakpoint.ts';

type ObservedRecord = {
	callback: ResizeObserverCallback;
	element: Element;
	options?: ResizeObserverOptions;
};

let observedRecords: ObservedRecord[] = [];
const originalResizeObserver = globalThis.ResizeObserver;

function triggerResize(
	element: Element,
	sizes: { contentWidth: number; borderWidth?: number }
) {
	for ( const record of observedRecords ) {
		if ( record.element !== element ) {
			continue;
		}
		const entry = {
			target: element,
			contentRect: {
				width: sizes.contentWidth,
			} as DOMRectReadOnly,
			contentBoxSize: [
				{
					inlineSize: sizes.contentWidth,
					blockSize: 100,
				},
			],
			borderBoxSize: [
				{
					inlineSize: sizes.borderWidth ?? sizes.contentWidth,
					blockSize: 100,
				},
			],
		} as unknown as ResizeObserverEntry;
		record.callback( [ entry ], {} as ResizeObserver );
	}
}

beforeEach( () => {
	observedRecords = [];
	globalThis.ResizeObserver = class MockResizeObserver {
		private callback: ResizeObserverCallback;
		constructor( callback: ResizeObserverCallback ) {
			this.callback = callback;
		}
		observe( element: Element, options?: ResizeObserverOptions ) {
			observedRecords.push( {
				callback: this.callback,
				element,
				options,
			} );
		}
		unobserve( element: Element ) {
			observedRecords = observedRecords.filter(
				( record ) =>
					! (
						record.callback === this.callback &&
						record.element === element
					)
			);
		}
		disconnect() {
			observedRecords = observedRecords.filter(
				( record ) => record.callback !== this.callback
			);
		}
	} as unknown as typeof ResizeObserver;
} );

afterEach( () => {
	globalThis.ResizeObserver = originalResizeObserver;
} );

describe( 'useContainerBreakpoint', () => {
	it( 'measures an element attached via callback ref and only re-renders on breakpoint changes', () => {
		const onRender = vi.fn();

		function ContainerProbe() {
			const { ref, breakpoint } =
				useContainerBreakpoint< HTMLDivElement >();
			onRender( breakpoint );
			return (
				<div ref={ ref } data-testid="container">
					{ breakpoint }
				</div>
			);
		}

		render( <ContainerProbe /> );
		const el = screen.getByTestId( 'container' );

		expect( el ).toHaveTextContent( 'default' );
		expect( onRender ).toHaveBeenCalledTimes( 1 );

		act( () => {
			triggerResize( el, { contentWidth: 650 } );
		} );
		expect( el ).toHaveTextContent( 'sm' );
		expect( onRender ).toHaveBeenCalledTimes( 2 );

		// Resizing within the same `sm` band (600px..781px) must not re-render.
		act( () => {
			triggerResize( el, { contentWidth: 700 } );
		} );
		expect( el ).toHaveTextContent( 'sm' );
		expect( onRender ).toHaveBeenCalledTimes( 2 );

		act( () => {
			triggerResize( el, { contentWidth: 960 } );
		} );
		expect( el ).toHaveTextContent( 'lg' );
		expect( onRender ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'supports observing an explicit external target element and RefObject', () => {
		function RefTargetProbe() {
			const containerRef = useRef< HTMLDivElement >( null );
			const { breakpoint } = useContainerBreakpoint( containerRef );

			return (
				<div ref={ containerRef } data-testid="explicit-container">
					{ breakpoint }
				</div>
			);
		}

		render( <RefTargetProbe /> );
		const el = screen.getByTestId( 'explicit-container' );

		act( () => {
			triggerResize( el, { contentWidth: 782 } );
		} );

		expect( el ).toHaveTextContent( 'md' );
	} );

	it( 'supports border-box measurement option', () => {
		function BorderBoxProbe() {
			const { ref, breakpoint } =
				useContainerBreakpoint< HTMLDivElement >( undefined, {
					box: 'border-box',
				} );
			return (
				<div ref={ ref } data-testid="border-box">
					{ breakpoint }
				</div>
			);
		}

		render( <BorderBoxProbe /> );
		const el = screen.getByTestId( 'border-box' );

		act( () => {
			triggerResize( el, { contentWidth: 580, borderWidth: 620 } );
		} );

		expect( el ).toHaveTextContent( 'sm' );
	} );

	it( 'handles nested containers independently', () => {
		function NestedProbe() {
			const outer = useContainerBreakpoint< HTMLDivElement >();
			const inner = useContainerBreakpoint< HTMLDivElement >();

			return (
				<div ref={ outer.ref } data-testid="outer">
					<span data-testid="outer-bp">{ outer.breakpoint }</span>
					<div ref={ inner.ref } data-testid="inner">
						<span data-testid="inner-bp">{ inner.breakpoint }</span>
					</div>
				</div>
			);
		}

		render( <NestedProbe /> );
		const outerEl = screen.getByTestId( 'outer' );
		const innerEl = screen.getByTestId( 'inner' );

		act( () => {
			triggerResize( outerEl, { contentWidth: 1280 } );
			triggerResize( innerEl, { contentWidth: 500 } );
		} );

		expect( screen.getByTestId( 'outer-bp' ) ).toHaveTextContent( 'xl' );
		expect( screen.getByTestId( 'inner-bp' ) ).toHaveTextContent( 'xs' );
	} );

	it( 'does not throw when ResizeObserver is unavailable', () => {
		// @ts-expect-error simulating SSR / environment without ResizeObserver
		delete globalThis.ResizeObserver;

		function NoObserverProbe() {
			const { ref, breakpoint } =
				useContainerBreakpoint< HTMLDivElement >();
			return (
				<div ref={ ref } data-testid="no-observer">
					{ breakpoint }
				</div>
			);
		}

		render( <NoObserverProbe /> );
		expect( screen.getByTestId( 'no-observer' ) ).toHaveTextContent(
			'default'
		);
	} );
} );
