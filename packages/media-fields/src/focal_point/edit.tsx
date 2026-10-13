import { FocalPointPicker, Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import type { DataFormControlProps } from '@wordpress/dataviews';
import type { MediaItem } from '../types';

const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };

export default function MediaFocalPointEdit( {
	data,
	field,
	onChange,
}: DataFormControlProps< MediaItem > ) {
	const focalPoint = data.focal_point ?? DEFAULT_FOCAL_POINT;
	const imageUrl = data.source_url;

	const handleReset = () => {
		onChange( {
			focal_point: null,
		} );
	};

	const handleChange = ( nextPoint: { x: number; y: number } ) => {
		onChange( {
			focal_point: nextPoint,
		} );
	};

	if ( ! imageUrl ) {
		return null;
	}

	const isCustom =
		data.focal_point &&
		( data.focal_point.x !== 0.5 || data.focal_point.y !== 0.5 );

	return (
		<Stack
			direction="column"
			gap="md"
			className="media-fields-focal-point-control"
		>
			<FocalPointPicker
				label={ field.label ?? __( 'Focal point' ) }
				url={ imageUrl }
				value={ focalPoint }
				onChange={ handleChange }
			/>
			{ isCustom && (
				<Stack direction="row" justify="flex-end">
					<Button
						variant="tertiary"
						size="small"
						onClick={ handleReset }
					>
						{ __( 'Reset to center' ) }
					</Button>
				</Stack>
			) }
		</Stack>
	);
}
