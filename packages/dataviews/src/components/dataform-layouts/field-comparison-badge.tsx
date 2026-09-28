import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import type { FieldComparisonStatus } from '../../types';

interface FieldComparisonBadgeProps {
	status: FieldComparisonStatus;
	className?: string;
}

const STATUS_LABELS: Record< FieldComparisonStatus, string > = {
	added: __( 'Added' ),
	removed: __( 'Removed' ),
	modified: __( 'Modified' ),
	unchanged: __( 'Unchanged' ),
};

export function FieldComparisonBadge( {
	status,
	className,
}: FieldComparisonBadgeProps ) {
	if ( status === 'unchanged' ) {
		return null;
	}

	const label = STATUS_LABELS[ status ];

	return (
		<span
			className={ clsx(
				'dataforms-layouts__comparison-badge',
				`dataforms-layouts__comparison-badge--${ status }`,
				className
			) }
			role="status"
			aria-label={ label }
		>
			<span className="dataforms-layouts__comparison-badge-indicator" />
			<span className="dataforms-layouts__comparison-badge-text">
				{ label }
			</span>
		</span>
	);
}
