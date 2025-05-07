/**
 * WordPress dependencies
 */
import { Icon, menu, arrowRight } from '@wordpress/icons';

const ICONS = {
	menu,
	arrowRight,
};

export default function OverlayMenuIcon( { icon = menu } ) {
	const SelectedIcon = ICONS[ icon ] || menu;
	return <Icon icon={ SelectedIcon } />;
}
