import { __, sprintf } from '@wordpress/i18n';
import type { MediaItem } from '../types';

export default function MediaFocalPointView( { item }: { item: MediaItem } ) {
	if ( ! item?.focal_point ) {
		return <>{ __( 'Center (default)' ) }</>;
	}

	const xPct = Math.round( ( item.focal_point.x ?? 0.5 ) * 100 );
	const yPct = Math.round( ( item.focal_point.y ?? 0.5 ) * 100 );

	return (
		<span>
			{ sprintf(
				// translators: 1: X percentage coordinate, 2: Y percentage coordinate.
				__( '%1$d%%, %2$d%%' ),
				xPct,
				yPct
			) }
		</span>
	);
}
