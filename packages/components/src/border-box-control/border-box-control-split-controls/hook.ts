import clsx from 'clsx';
import styles from '../style.module.scss';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import type { SplitControlsProps } from '../types';

export function useBorderBoxControlSplitControls(
	props: WordPressComponentProps< SplitControlsProps, 'div' >
) {
	const {
		className,
		colors = [],
		disableCustomWidth = false,
		enableAlpha = false,
		enableStyle = true,
		widthPresets,
		__experimentalIsRenderedInSidebar = false,
		...otherProps
	} = useContextSystem( props, 'BorderBoxControlSplitControls' );

	return {
		...otherProps,
		centeredClassName: clsx(
			styles[ 'centered-border-control' ],
			className
		),
		className: clsx( styles[ 'split-controls' ], className ),
		colors,
		disableCustomWidth,
		enableAlpha,
		enableStyle,
		rightAlignedClassName: clsx(
			styles[ 'right-border-control' ],
			className
		),
		widthPresets,
		__experimentalIsRenderedInSidebar,
	};
}
