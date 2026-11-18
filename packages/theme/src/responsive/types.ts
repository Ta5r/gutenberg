import type { RefObject } from 'react';
import type { Breakpoint } from '../prebuilt/ts/token-types.ts';

/**
 * Active breakpoint identifier, where `'default'` represents widths narrower
 * than the smallest named breakpoint (`xs`).
 */
export type BreakpointKey = 'default' | Breakpoint;

/**
 * Comparison operator for matching a width against a breakpoint threshold.
 */
export type BreakpointOperator = '>=' | '<';

/**
 * Mobile-first map of breakpoint overrides with a required `default` base value.
 * Values cascade upward: if a breakpoint is omitted, resolution falls back to
 * the nearest smaller defined breakpoint down to `default`.
 */
export type ResponsiveValueMap< T > = {
	default: T;
} & Partial< Record< Breakpoint, T > >;

/**
 * Options for `useViewportBreakpoint`.
 */
export interface ViewportBreakpointOptions {
	/**
	 * Window instance to evaluate media queries against. Pass an iframe's
	 * `contentWindow` to track the iframe viewport instead of the host window.
	 */
	window?: Window;
}

/**
 * Options for `useContainerBreakpoint`.
 */
export interface ContainerBreakpointOptions {
	/**
	 * Box model to observe. Defaults to `'content-box'` to align with CSS
	 * container size queries (`@container`).
	 *
	 * @default 'content-box'
	 */
	box?: ResizeObserverBoxOptions;
}

/**
 * Target element for `useContainerBreakpoint`. Accepts a DOM element, a React
 * ref object pointing to an element, or `null`/`undefined`.
 */
export type ContainerTarget< T extends Element = Element > =
	T | RefObject< T | null > | null | undefined;

/**
 * Return value of `useContainerBreakpoint`.
 */
export interface ContainerBreakpointResult< T extends Element = HTMLElement > {
	/**
	 * Callback ref to attach to the container element to measure when no
	 * explicit `target` argument is provided.
	 */
	ref: ( element?: T | null ) => void;
	/**
	 * Active breakpoint matching the container's current inline size, or
	 * `'default'` before measurement / when narrower than `xs`.
	 */
	breakpoint: BreakpointKey;
}
