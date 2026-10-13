import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';
import type { MediaItem } from '../types';
import MediaFocalPointView from './view';
import MediaFocalPointEdit from './edit';

const focalPointField: Partial< Field< MediaItem > > = {
	id: 'focal_point',
	type: 'text',
	label: __( 'Focal point' ),
	Edit: MediaFocalPointEdit,
	render: MediaFocalPointView,
	isVisible: ( item ) =>
		item?.media_type === 'image' ||
		Boolean( item?.mime_type?.startsWith( 'image/' ) ),
	enableSorting: false,
	filterBy: false,
};

export default focalPointField;
