import { type ComponentProps } from '../utils/types';

export type BadgeIntent =
	| 'neutral'
	| 'info'
	| 'caution'
	| 'warning'
	| 'success'
	| 'error'
	| 'draft'
	| 'none'
	| 'informational'
	| 'low'
	| 'medium'
	| 'stable'
	| 'high';

export interface BadgeProps extends ComponentProps< 'span' > {
	/**
	 * The text to display in the badge.
	 */
	children: string;

	/**
	 * The semantic intent of the badge, communicating its meaning through color.
	 * Available intents: neutral (or none), info (or informational), caution (or low),
	 * warning (or medium), success (or stable), error (or high), and draft.
	 *
	 * @default "none"
	 */
	intent?: BadgeIntent;
}
