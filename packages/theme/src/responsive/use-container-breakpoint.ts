import { useCallback, useRef, useState } from '@wordpress/element';
import {
	useIsomorphicLayoutEffect,
	useResizeObserver,
} from '@wordpress/compose';
import { getActiveBreakpoint } from './resolve-responsive-value.ts';
import type {
	BreakpointKey,
	ContainerBreakpointOptions,
	ContainerBreakpointResult,
	ContainerTarget,
} from './types.ts';

function isRefObject< T extends Element >(
	target: ContainerTarget< T >
): target is { current: T | null } {
	return typeof target === 'object' && target !== null && 'current' in target;
}

function getEntryInlineSize(
	entry: ResizeObserverEntry,
	box: ResizeObserverBoxOptions
): number {
	const boxSize =
		box === 'border-box' ? entry.borderBoxSize : entry.contentBoxSize;
	if ( Array.isArray( boxSize ) && boxSize.length > 0 ) {
		return boxSize[ 0 ].inlineSize;
	}
	if ( boxSize && 'inlineSize' in boxSize ) {
		return ( boxSize as unknown as ResizeObserverSize ).inlineSize;
	}
	return entry.contentRect.width;
}

/**
 * Returns the active WPDS breakpoint for a container element using
 * `ResizeObserver`, decoupled from `ThemeProvider` (whose wrapper uses
 * `display: contents`).
 *
 * Attach the returned `ref` to the container element to measure, or pass an
 * explicit `target` element / ref object (useful for observing an external
 * ancestor, a nested container, or across React portal boundaries).
 *
 * Re-renders only when the active breakpoint changes. During SSR or before the
 * first measurement, returns `'default'`.
 *
 * @param target  Optional explicit container element or React ref object.
 * @param options Optional `ResizeObserver` configuration (`box` defaults to `'content-box'`).
 * @return Object containing a callback `ref` and the active `breakpoint`.
 */
export function useContainerBreakpoint< T extends Element = HTMLElement >(
	target?: ContainerTarget< T >,
	options: ContainerBreakpointOptions = {}
): ContainerBreakpointResult< T > {
	const { box = 'content-box' } = options;
	const [ breakpoint, setBreakpoint ] =
		useState< BreakpointKey >( 'default' );
	const breakpointRef = useRef< BreakpointKey >( 'default' );

	const updateBreakpoint = useCallback( ( next: BreakpointKey ) => {
		if ( next !== breakpointRef.current ) {
			breakpointRef.current = next;
			setBreakpoint( next );
		}
	}, [] );

	const setObservedElement = useResizeObserver< T >(
		( entries ) => {
			const entry = entries[ entries.length - 1 ];
			if ( ! entry ) {
				return;
			}
			const inlineSize = getEntryInlineSize( entry, box );
			updateBreakpoint( getActiveBreakpoint( inlineSize ) );
		},
		{ box }
	);

	const safeSetObservedElement = useCallback(
		( element?: T | null ) => {
			if ( ! element ) {
				updateBreakpoint( 'default' );
			}
			if ( typeof ResizeObserver === 'undefined' ) {
				return;
			}
			setObservedElement( element );
		},
		[ setObservedElement, updateBreakpoint ]
	);

	// Synchronize explicit element or RefObject targets when provided.
	const targetRef = isRefObject( target ) ? target : null;
	const explicitElement = isRefObject( target ) ? target.current : target;

	useIsomorphicLayoutEffect( () => {
		if ( target === undefined ) {
			return;
		}
		const element = targetRef ? targetRef.current : explicitElement;
		safeSetObservedElement( element ?? null );
	}, [ target, targetRef, explicitElement, safeSetObservedElement ] );

	return {
		ref: safeSetObservedElement,
		breakpoint,
	};
}
