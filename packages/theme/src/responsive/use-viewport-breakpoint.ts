import { useMediaQuery } from '@wordpress/compose';
import { BREAKPOINTS } from '../prebuilt/ts/breakpoints.ts';
import type { BreakpointKey, ViewportBreakpointOptions } from './types.ts';

/**
 * Returns the active WPDS breakpoint for the current viewport width, using
 * shared `@wordpress/compose` `useMediaQuery` subscriptions.
 *
 * Pass `{ window: iframeWindow }` to observe an iframe's viewport instead of
 * the host document window. During SSR, returns `'default'`.
 *
 * @param options Optional configuration, including a custom `window` instance.
 * @return The largest matching breakpoint name, or `'default'` when narrower than `xs`.
 */
export function useViewportBreakpoint(
	options: ViewportBreakpointOptions = {}
): BreakpointKey {
	const view =
		options.window ??
		( typeof window !== 'undefined' ? window : undefined );

	// Scoped to `screen` so print media does not report as a narrow viewport.
	// Hooks are called unconditionally in a fixed order matching `BREAKPOINT_ORDER`.
	const matchesXs = useMediaQuery(
		`screen and (min-width: ${ BREAKPOINTS.xs }px)`,
		view
	);
	const matchesSm = useMediaQuery(
		`screen and (min-width: ${ BREAKPOINTS.sm }px)`,
		view
	);
	const matchesMd = useMediaQuery(
		`screen and (min-width: ${ BREAKPOINTS.md }px)`,
		view
	);
	const matchesLg = useMediaQuery(
		`screen and (min-width: ${ BREAKPOINTS.lg }px)`,
		view
	);
	const matchesXl = useMediaQuery(
		`screen and (min-width: ${ BREAKPOINTS.xl }px)`,
		view
	);
	const matches2xl = useMediaQuery(
		`screen and (min-width: ${ BREAKPOINTS[ '2xl' ] }px)`,
		view
	);

	if ( matches2xl ) {
		return '2xl';
	}
	if ( matchesXl ) {
		return 'xl';
	}
	if ( matchesLg ) {
		return 'lg';
	}
	if ( matchesMd ) {
		return 'md';
	}
	if ( matchesSm ) {
		return 'sm';
	}
	if ( matchesXs ) {
		return 'xs';
	}
	return 'default';
}
