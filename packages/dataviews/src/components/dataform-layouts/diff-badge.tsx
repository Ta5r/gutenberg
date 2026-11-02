import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import type { DiffStatus } from '../../utils/diff';

const STATUS_CONFIG: Record<
	Exclude< DiffStatus, 'unchanged' >,
	{ label: string; symbol: string }
> = {
	added: {
		label: __( 'Added' ),
		symbol: '+',
	},
	modified: {
		label: __( 'Modified' ),
		symbol: '~',
	},
	removed: {
		label: __( 'Removed' ),
		symbol: '−',
	},
};

export interface DiffBadgeProps {
	/**
	 * The diff status of the field.
	 */
	status?: DiffStatus;

	/**
	 * Optional visual variant: 'badge' (default with text) or 'dot' (compact dot).
	 */
	variant?: 'badge' | 'dot';

	/**
	 * Additional CSS class name.
	 */
	className?: string;
}

/**
 * Visual Red/Yellow/Green indicator for removals/modifications/additions alongside a field value.
 */
export default function DiffBadge( {
	status,
	variant = 'badge',
	className,
}: DiffBadgeProps ) {
	if ( ! status || status === 'unchanged' ) {
		return null;
	}

	const config = STATUS_CONFIG[ status ];
	if ( ! config ) {
		return null;
	}

	const classes = clsx(
		'dataforms-diff-badge',
		`dataforms-diff-badge--${ variant }`,
		`is-${ status }`,
		className
	);

	if ( variant === 'dot' ) {
		return (
			<span
				className={ classes }
				role="status"
				aria-label={ config.label }
				title={ config.label }
			/>
		);
	}

	return (
		<span className={ classes } role="status" aria-label={ config.label }>
			<span className="dataforms-diff-badge__symbol" aria-hidden="true">
				{ config.symbol }
			</span>
			<span className="dataforms-diff-badge__label">
				{ config.label }
			</span>
		</span>
	);
}
