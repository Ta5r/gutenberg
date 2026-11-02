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
import DiffBadge from '../diff-badge';
import FieldDiffRender from '../field-diff-render';

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
	previousData: previousDataProp,
	diff,
	comparisonLayout: comparisonLayoutProp,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: FieldLayoutProps< Item > ) {
	const {
		fields,
		previousData: previousDataContext,
		comparisonLayout: comparisonLayoutContext,
	} = useContext( DataFormContext );

	const previousData = previousDataProp ?? previousDataContext;
	const comparisonLayout = comparisonLayoutProp ?? comparisonLayoutContext;
	const isComparison = previousData !== undefined;

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
					previousData={ previousData }
					comparisonLayout={ comparisonLayout }
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

	const isReadOnly = isComparison || fieldDefinition.readOnly === true;

	const labelWithDiff = (
		<span className="dataforms-layouts-regular__field-label-wrapper">
			<span>{ fieldDefinition.label }</span>
			{ isComparison && <DiffBadge status={ diff?.status } /> }
		</span>
	);

	if ( labelPosition === 'side' ) {
		return (
			<Stack
				direction="row"
				className={ clsx(
					'dataforms-layouts-regular__field',
					isComparison && 'is-comparison',
					diff?.status && `is-diff-${ diff.status }`
				) }
				gap="sm"
			>
				<div
					className={ clsx(
						'dataforms-layouts-regular__field-label',
						`dataforms-layouts-regular__field-label--label-position-${ labelPosition }`
					) }
				>
					<BaseControl.VisualLabel>
						{ labelWithDiff }
					</BaseControl.VisualLabel>
				</div>
				<div className="dataforms-layouts-regular__field-control">
					{ isReadOnly ? (
						<FieldDiffRender
							data={ data }
							previousData={ previousData }
							field={ fieldDefinition }
							diff={ diff }
							comparisonLayout={ comparisonLayout }
						/>
					) : (
						fieldDefinition.Edit && (
							<fieldDefinition.Edit
								key={ fieldDefinition.id }
								data={ data }
								field={ fieldDefinition }
								onChange={ onChange }
								hideLabelFromVision
								markWhenOptional={ markWhenOptional }
								validity={ validity }
							/>
						)
					) }
				</div>
			</Stack>
		);
	}

	return (
		<div
			className={ clsx(
				'dataforms-layouts-regular__field',
				isComparison && 'is-comparison',
				diff?.status && `is-diff-${ diff.status }`
			) }
		>
			{ isReadOnly ? (
				<>
					{ ! hideLabelFromVision && labelPosition !== 'none' && (
						<BaseControl.VisualLabel>
							{ labelWithDiff }
						</BaseControl.VisualLabel>
					) }
					<FieldDiffRender
						data={ data }
						previousData={ previousData }
						field={ fieldDefinition }
						diff={ diff }
						comparisonLayout={ comparisonLayout }
					/>
				</>
			) : (
				fieldDefinition.Edit && (
					<fieldDefinition.Edit
						data={ data }
						field={ fieldDefinition }
						onChange={ onChange }
						hideLabelFromVision={
							labelPosition === 'none'
								? true
								: hideLabelFromVision
						}
						markWhenOptional={ markWhenOptional }
						validity={ validity }
					/>
				)
			) }
		</div>
	);
}
