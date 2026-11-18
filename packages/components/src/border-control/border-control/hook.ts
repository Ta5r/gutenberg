import clsx from 'clsx';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { parseQuantityAndUnitFromRawValue } from '../../unit-control/utils';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import styles from '../style.module.scss';
import type { Border, BorderControlProps, BorderWidthPreset } from '../types';

const BORDER_WIDTH_PRESET_PREFIX = 'var:preset|border-width|';

function findMatchingWidthPreset(
	width: Border[ 'width' ],
	presets: BorderWidthPreset[]
): BorderWidthPreset | undefined {
	if ( width === undefined || width === '' || presets.length === 0 ) {
		return undefined;
	}

	const widthStr = String( width );
	if ( widthStr.startsWith( BORDER_WIDTH_PRESET_PREFIX ) ) {
		const slug = widthStr.slice( BORDER_WIDTH_PRESET_PREFIX.length );
		return presets.findLast( ( preset ) => preset.slug === slug );
	}

	return presets.findLast( ( preset ) => String( preset.size ) === widthStr );
}

// If either width or color are defined, the border is considered valid
// and a border style can be set as well.
const isValidBorder = ( border?: Border ) => {
	const hasWidth = border?.width !== undefined && border.width !== '';
	const hasColor = border?.color !== undefined;
	return hasWidth || hasColor;
};

export function useBorderControl(
	props: WordPressComponentProps< BorderControlProps, 'div' >
) {
	const {
		className,
		colors = [],
		disableCustomWidth = false,
		isCompact,
		onChange,
		enableAlpha = true,
		enableStyle = true,
		placeholder,
		shouldSanitizeBorder = true,
		value: border,
		width,
		widthPresets = [],
		__experimentalIsRenderedInSidebar = false,
		// Deprecated props, no longer used.
		size: _size,
		__next40pxDefaultSize: _next40pxDefaultSize,
		...otherProps
	} = useContextSystem( props, 'BorderControl' );

	const [ widthValue, originalWidthUnit ] = parseQuantityAndUnitFromRawValue(
		border?.width
	);
	const widthUnit = originalWidthUnit || 'px';
	const hadPreviousZeroWidth = widthValue === 0;

	const hasWidthPresets = widthPresets.length > 0;
	const matchedWidthPreset = useMemo(
		() => findMatchingWidthPreset( border?.width, widthPresets ),
		[ border?.width, widthPresets ]
	);
	const isPresetWidthVar =
		typeof border?.width === 'string' &&
		border.width.startsWith( BORDER_WIDTH_PRESET_PREFIX );
	const hasConcreteWidth =
		border?.width !== undefined &&
		border.width !== '' &&
		( isPresetWidthVar || widthValue !== undefined );
	const isCustomWidthValue =
		hasWidthPresets &&
		hasConcreteWidth &&
		border?.width !== '0' &&
		! matchedWidthPreset;

	const [ showCustomWidthState, setShowCustomWidthState ] = useState(
		() => ! disableCustomWidth && isCustomWidthValue
	);
	const showCustomWidth =
		! hasWidthPresets || ( ! disableCustomWidth && showCustomWidthState );

	const toggleCustomWidth = useCallback( () => {
		if ( ! disableCustomWidth ) {
			setShowCustomWidthState( ( prev ) => ! prev );
		}
	}, [ disableCustomWidth ] );

	const selectedWidthPresetValue = useMemo( () => {
		if ( matchedWidthPreset ) {
			return matchedWidthPreset.size;
		}
		if ( isCustomWidthValue ) {
			return String( border?.width );
		}
		return '';
	}, [ matchedWidthPreset, isCustomWidthValue, border?.width ] );

	const widthPresetOptions = useMemo( () => {
		if ( ! hasWidthPresets ) {
			return [];
		}

		const options = [
			{
				label: placeholder || __( 'None' ),
				value: '',
			},
			...widthPresets.map( ( preset ) => ( {
				label: preset.name,
				value: preset.size,
			} ) ),
		];

		if ( isCustomWidthValue && border?.width !== undefined ) {
			options.push( {
				label: sprintf(
					/* translators: %s: A custom border width measurement, e.g. 3px. */
					__( 'Custom (%s)' ),
					String( border.width )
				),
				value: String( border.width ),
			} );
		}

		return options;
	}, [
		hasWidthPresets,
		placeholder,
		widthPresets,
		isCustomWidthValue,
		border?.width,
	] );

	const [ colorSelection, setColorSelection ] = useState< string >();
	const [ styleSelection, setStyleSelection ] = useState< string >();

	const isStyleSettable = shouldSanitizeBorder
		? isValidBorder( border )
		: true;

	const onBorderChange = useCallback(
		( newBorder?: Border ) => {
			if ( shouldSanitizeBorder && ! isValidBorder( newBorder ) ) {
				onChange( undefined );
				return;
			}
			onChange( newBorder );
		},
		[ onChange, shouldSanitizeBorder ]
	);

	const onWidthChange = useCallback(
		( newWidth?: string ) => {
			const newWidthValue = newWidth === '' ? undefined : newWidth;
			const [ parsedValue ] =
				parseQuantityAndUnitFromRawValue( newWidth );
			const hasZeroWidth = parsedValue === 0;
			const updatedBorder = { ...border, width: newWidthValue };

			// Setting the border width explicitly to zero will also set the
			// border style to `none` and clear the border color.
			if ( hasZeroWidth && ! hadPreviousZeroWidth ) {
				// Before clearing the color and style selections, keep track of
				// the current selections so they can be restored when the width
				// changes to a non-zero value.
				setColorSelection( border?.color );
				setStyleSelection( border?.style );

				// Clear the color and style border properties.
				updatedBorder.color = undefined;
				updatedBorder.style = 'none';
			}

			// Selection has changed from zero border width to non-zero width.
			if ( ! hasZeroWidth && hadPreviousZeroWidth ) {
				// Restore previous border color and style selections if width
				// is now not zero.
				if ( updatedBorder.color === undefined ) {
					updatedBorder.color = colorSelection;
				}
				if ( updatedBorder.style === 'none' ) {
					updatedBorder.style = styleSelection;
				}
			}

			onBorderChange( updatedBorder );
		},
		[
			border,
			hadPreviousZeroWidth,
			colorSelection,
			styleSelection,
			onBorderChange,
		]
	);

	const onSliderChange = useCallback(
		( value?: number ) => {
			onWidthChange( `${ value }${ widthUnit }` );
		},
		[ onWidthChange, widthUnit ]
	);

	const classes = clsx( styles[ 'border-control' ], className );

	let wrapperWidth = width;
	if ( isCompact ) {
		// Widths below represent the minimum usable width for compact controls.
		// Taller controls contain greater internal padding, thus greater width.
		wrapperWidth = '116px';
	}
	const innerWrapperClassName = clsx(
		styles[ 'inner-wrapper' ],
		!! wrapperWidth && styles[ 'inner-wrapper-has-width' ]
	);

	const sliderClassName = styles.slider;

	return {
		...otherProps,
		className: classes,
		colors,
		disableCustomWidth,
		enableAlpha,
		enableStyle,
		hasWidthPresets,
		innerWrapperClassName,
		inputWidth: wrapperWidth,
		isStyleSettable,
		onBorderChange,
		onSliderChange,
		onWidthChange,
		placeholder,
		previousStyleSelection: styleSelection,
		selectedWidthPresetValue,
		showCustomWidth,
		sliderClassName,
		toggleCustomWidth,
		value: border,
		widthPresetOptions,
		widthUnit,
		widthValue,
		__experimentalIsRenderedInSidebar,
	};
}
