import clsx from 'clsx';
import { useContext, useMemo } from '@wordpress/element';
import {
	__experimentalHeading as Heading,
	BaseControl,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import type {
	FieldLayoutProps,
	NormalizedForm,
	NormalizedRegularLayout,
} from '../../../types';
import DataFormContext from '../../dataform-context';
import { canRenderField } from '../can-render-field';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import { getFieldComparisonStatus } from '../../../dataform/comparison-utils';
import { FieldComparisonBadge } from '../field-comparison-badge';

function Header( { title }: { title: string } ) {
	return (
		<Stack
			direction="column"
			className="dataforms-layouts-regular__header"
			gap="lg"
		>
			<Stack direction="row" align="center">
				<Heading level={ 2 } size={ 13 }>
					{ title }
				</Heading>
			</Stack>
		</Stack>
	);
}

export default function FormRegularField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: FieldLayoutProps< Item > ) {
	const { fields, previousData, compareMode } = useContext( DataFormContext );
	const layout = field.layout as NormalizedRegularLayout;

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT,
			fields: !! field.children ? field.children : [],
		} ),
		[ field ]
	);

	if ( !! field.children ) {
		return (
			<>
				{ ! hideLabelFromVision && field.label && (
					<Header title={ field.label } />
				) }
				<DataFormLayout
					data={ data }
					form={ form }
					onChange={ onChange }
					validity={ validity?.children }
				/>
			</>
		);
	}

	const labelPosition = layout.labelPosition;
	const fieldDefinition = fields.find(
		( fieldDef ) => fieldDef.id === field.id
	);

	if ( ! canRenderField( fieldDefinition ) ) {
		return null;
	}

	const isComparing = previousData !== undefined;
	const comparisonStatus = isComparing
		? getFieldComparisonStatus( fieldDefinition, data, previousData )
		: 'unchanged';

	const renderControl = () => {
		if ( isComparing ) {
			if ( compareMode === 'side-by-side' ) {
				return (
					<div className="dataforms-layouts__comparison-side-by-side">
						<div className="dataforms-layouts__comparison-previous">
							<fieldDefinition.render
								item={ previousData }
								field={ fieldDefinition }
							/>
						</div>
						<div className="dataforms-layouts__comparison-current">
							<fieldDefinition.render
								item={ data }
								field={ fieldDefinition }
							/>
						</div>
					</div>
				);
			}

			if ( compareMode === 'stacked' ) {
				return (
					<div className="dataforms-layouts__comparison-stacked">
						<div className="dataforms-layouts__comparison-previous">
							<fieldDefinition.render
								item={ previousData }
								field={ fieldDefinition }
							/>
						</div>
						<div className="dataforms-layouts__comparison-current">
							<fieldDefinition.render
								item={ data }
								field={ fieldDefinition }
							/>
						</div>
					</div>
				);
			}

			return (
				<fieldDefinition.render
					item={ data }
					field={ fieldDefinition }
				/>
			);
		}

		if ( fieldDefinition.readOnly === true ) {
			return (
				<fieldDefinition.render
					item={ data }
					field={ fieldDefinition }
				/>
			);
		}

		return (
			fieldDefinition.Edit && (
				<fieldDefinition.Edit
					key={ fieldDefinition.id }
					data={ data }
					field={ fieldDefinition }
					onChange={ onChange }
					hideLabelFromVision={ labelPosition === 'side' ? true : ( labelPosition === 'none' ? true : hideLabelFromVision ) }
					markWhenOptional={ markWhenOptional }
					validity={ validity }
				/>
			)
		);
	};

	if ( labelPosition === 'side' ) {
		return (
			<Stack
				direction="row"
				className="dataforms-layouts-regular__field"
				gap="sm"
			>
				<div
					className={ clsx(
						'dataforms-layouts-regular__field-label',
						`dataforms-layouts-regular__field-label--label-position-${ labelPosition }`
					) }
				>
					<BaseControl.VisualLabel>
						{ fieldDefinition.label }
						{ isComparing && (
							<FieldComparisonBadge
								status={ comparisonStatus }
							/>
						) }
					</BaseControl.VisualLabel>
				</div>
				<div className="dataforms-layouts-regular__field-control">
					{ renderControl() }
				</div>
			</Stack>
		);
	}

	return (
		<div className="dataforms-layouts-regular__field">
			{ ! hideLabelFromVision && labelPosition !== 'none' && (
				<BaseControl.VisualLabel>
					{ fieldDefinition.label }
					{ isComparing && (
						<FieldComparisonBadge status={ comparisonStatus } />
					) }
				</BaseControl.VisualLabel>
			) }
			<div className="dataforms-layouts-regular__field-control">
				{ renderControl() }
			</div>
		</div>
	);
}
