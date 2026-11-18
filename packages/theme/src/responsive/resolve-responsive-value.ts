import { BREAKPOINT_ORDER, BREAKPOINTS } from '../prebuilt/ts/breakpoints.ts';
import type { Breakpoint } from '../prebuilt/ts/token-types.ts';
import type {
	BreakpointKey,
	BreakpointOperator,
	ResponsiveValueMap,
} from './types.ts';

/**
 * Returns the largest WPDS breakpoint whose minimum width threshold is less
 * than or equal to `width`, or `'default'` when `width` is smaller than the
 * smallest breakpoint (`xs`).
 *
 * @param width Width in pixels.
 * @return Matching breakpoint key.
 */
export function getActiveBreakpoint( width: number ): BreakpointKey {
	if ( ! Number.isFinite( width ) || width < 0 ) {
		return 'default';
	}

	let active: BreakpointKey = 'default';
	for ( const breakpoint of BREAKPOINT_ORDER ) {
		if ( width >= BREAKPOINTS[ breakpoint ] ) {
			active = breakpoint;
		} else {
			break;
		}
	}

	return active;
}

/**
 * Evaluates whether a given pixel width matches a breakpoint threshold with
 * the specified comparison operator (`'>='` by default, or `'<'`).
 *
 * @param width      Width in pixels.
 * @param breakpoint Target breakpoint token name.
 * @param operator   Comparison operator (`'>='` or `'<'`).
 * @return Whether the width satisfies the condition.
 */
export function matchesBreakpoint(
	width: number,
	breakpoint: Breakpoint,
	operator: BreakpointOperator = '>='
): boolean {
	if ( ! Number.isFinite( width ) ) {
		return false;
	}

	const threshold = BREAKPOINTS[ breakpoint ];
	return operator === '>=' ? width >= threshold : width < threshold;
}

/**
 * Resolves a mobile-first responsive value map for the given active breakpoint.
 * Walks downward from `activeBreakpoint` to smaller breakpoints and returns the
 * first explicitly defined key (preserving explicit `undefined` values),
 * falling back to `values.default`.
 *
 * @param values           Responsive value map with a `default` base entry.
 * @param activeBreakpoint Active breakpoint key from a viewport or container hook.
 * @return Resolved value for the active breakpoint.
 */
export function resolveResponsiveValue< T >(
	values: ResponsiveValueMap< T >,
	activeBreakpoint: BreakpointKey
): T {
	if ( activeBreakpoint === 'default' ) {
		return values.default;
	}

	const activeIndex = BREAKPOINT_ORDER.indexOf( activeBreakpoint );
	for ( let i = activeIndex; i >= 0; i-- ) {
		const bp = BREAKPOINT_ORDER[ i ];
		if ( Object.prototype.hasOwnProperty.call( values, bp ) ) {
			return values[ bp ] as T;
		}
	}

	return values.default;
}
