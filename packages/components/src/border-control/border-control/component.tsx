import { __ } from '@wordpress/i18n';
import { settings as settingsIcon } from '@wordpress/icons';
import BorderControlDropdown from '../border-control-dropdown';
import Button from '../../button';
import SelectControl from '../../select-control';
import UnitControl from '../../unit-control';
import { CSS_UNITS } from '../../unit-control/utils';
import RangeControl from '../../range-control';
import { HStack } from '../../h-stack';
import { StyledLabel } from '../../base-control/styles/base-control-styles';
import { View } from '../../view';
import { VisuallyHidden } from '../../visually-hidden';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { useBorderControl } from './hook';
import type { BorderControlProps, LabelProps } from '../types';
import { Spacer } from '../../spacer';

// Percentages are not valid `border-width` values.
const BORDER_WIDTH_UNITS = CSS_UNITS.filter( ( unit ) => unit.value !== '%' );

const BorderLabel = ( props: LabelProps ) => {
	const { label, hideLabelFromVision } = props;

	if ( ! label ) {
		return null;
	}

	return hideLabelFromVision ? (
		<VisuallyHidden as="legend">{ label }</VisuallyHidden>
	) : (
		<StyledLabel as="legend">{ label }</StyledLabel>
	);
};

const UnconnectedBorderControl = (
	props: WordPressComponentProps< BorderControlProps, 'div', false >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		colors,
		disableCustomColors,
		disableCustomWidth,
		disableUnits,
		enableAlpha,
		enableStyle,
		hasWidthPresets,
		hideLabelFromVision,
		innerWrapperClassName,
		inputWidth,
		isStyleSettable,
		label,
		onBorderChange,
		onSliderChange,
		onWidthChange,
		placeholder,
		__unstablePopoverProps,
		previousStyleSelection,
		selectedWidthPresetValue,
		showCustomWidth,
		showDropdownHeader,
		sliderClassName,
		toggleCustomWidth,
		value: border,
		widthPresetOptions,
		widthUnit,
		widthValue,
		withSlider,
		__experimentalIsRenderedInSidebar,
		...otherProps
	} = useBorderControl( props );

	const dropdownPrefix = (
		<Spacer marginRight={ 1 } marginBottom={ 0 }>
			<BorderControlDropdown
				border={ border }
				colors={ colors }
				__unstablePopoverProps={ __unstablePopoverProps }
				disableCustomColors={ disableCustomColors }
				enableAlpha={ enableAlpha }
				enableStyle={ enableStyle }
				isStyleSettable={ isStyleSettable }
				onChange={ onBorderChange }
				previousStyleSelection={ previousStyleSelection }
				__experimentalIsRenderedInSidebar={
					__experimentalIsRenderedInSidebar
				}
			/>
		</Spacer>
	);

	return (
		<View as="fieldset" { ...otherProps } ref={ forwardedRef }>
			<BorderLabel
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
			/>
			<HStack spacing={ 4 } className={ innerWrapperClassName }>
				{ showCustomWidth ? (
					<>
						<UnitControl
							prefix={ dropdownPrefix }
							label={ __( 'Border width' ) }
							hideLabelFromVision
							min={ 0 }
							disabled={ disableCustomWidth }
							onChange={ onWidthChange }
							value={ border?.width || '' }
							placeholder={ placeholder }
							units={ BORDER_WIDTH_UNITS }
							disableUnits={ disableUnits }
							__unstableInputWidth={ inputWidth }
						/>
						{ withSlider && ! disableCustomWidth && (
							<RangeControl
								label={ __( 'Border width' ) }
								hideLabelFromVision
								className={ sliderClassName }
								initialPosition={ 0 }
								max={ 100 }
								min={ 0 }
								onChange={ onSliderChange }
								step={ widthUnit === 'px' ? 1 : 0.1 }
								value={ widthValue || undefined }
								withInputField={ false }
							/>
						) }
					</>
				) : (
					<SelectControl
						prefix={ dropdownPrefix }
						label={ __( 'Border width' ) }
						hideLabelFromVision
						options={ widthPresetOptions }
						value={ selectedWidthPresetValue }
						onChange={ onWidthChange }
					/>
				) }
				{ hasWidthPresets && ! disableCustomWidth && (
					<Button
						icon={ settingsIcon }
						iconSize={ 24 }
						isPressed={ showCustomWidth }
						label={
							showCustomWidth
								? __( 'Use preset' )
								: __( 'Set custom value' )
						}
						onClick={ toggleCustomWidth }
						size="small"
					/>
				) }
			</HStack>
		</View>
	);
};

/**
 * The `BorderControl` brings together internal sub-components which allow users to
 * set the various properties of a border. The first sub-component, a
 * `BorderDropdown` contains options representing border color and style. The
 * border width is controlled via a `UnitControl` and an optional `RangeControl`.
 *
 * Border radius is not covered by this control as it may be desired separate to
 * color, style, and width. For example, the border radius may be absorbed under
 * a "shape" abstraction.
 *
 * ```jsx
 * import { BorderControl } from '@wordpress/components';
 * import { __ } from '@wordpress/i18n';
 *
 * const colors = [
 * 	{ name: 'Blue 20', color: '#72aee6' },
 * 	// ...
 * ];
 *
 * const MyBorderControl = () => {
 * 	const [ border, setBorder ] = useState();
 * 	const onChange = ( newBorder ) => setBorder( newBorder );
 *
 * 	return (
 * 		<BorderControl
 * 			colors={ colors }
 * 			label={ __( 'Border' ) }
 * 			onChange={ onChange }
 * 			value={ border }
 * 		/>
 * 	);
 * };
 * ```
 */
export const BorderControl = contextConnect(
	UnconnectedBorderControl,
	'BorderControl'
);

export default BorderControl;
