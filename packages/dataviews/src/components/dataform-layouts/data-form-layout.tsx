import { useContext, useMemo } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import type {
	ComparisonLayout,
	FieldValidity,
	FormValidity,
	NormalizedForm,
	NormalizedFormField,
} from '../../types';
import type { FieldDiff } from '../../utils/diff';
import { computeFieldDiff } from '../../utils/diff';
import { getFormFieldLayout } from './index';
import DataFormContext from '../dataform-context';

const DEFAULT_WRAPPER = ( { children }: { children: React.ReactNode } ) => (
	<Stack direction="column" className="dataforms-layouts__wrapper" gap="lg">
		{ children }
	</Stack>
);

export function DataFormLayout< Item >( {
	data,
	previousData: previousDataProp,
	comparisonLayout: comparisonLayoutProp,
	form,
	onChange,
	validity,
	children,
	as,
}: {
	data: Item;
	previousData?: Item;
	comparisonLayout?: ComparisonLayout;
	form: NormalizedForm;
	onChange: ( value: any ) => void;
	validity?: FormValidity;
	children?: (
		FieldLayout: ( props: {
			data: Item;
			previousData?: Item;
			diff?: FieldDiff;
			comparisonLayout?: ComparisonLayout;
			field: NormalizedFormField;
			onChange: ( value: any ) => void;
			hideLabelFromVision?: boolean;
			markWhenOptional?: boolean;
			validity?: FieldValidity;
		} ) => React.JSX.Element | null,
		childField: NormalizedFormField,
		childFieldValidity?: FieldValidity,
		markWhenOptional?: boolean
	) => React.JSX.Element;
	as?: React.ComponentType< { children: React.ReactNode } >;
} ) {
	const {
		fields: fieldDefinitions,
		previousData: previousDataContext,
		comparisonLayout: comparisonLayoutContext,
	} = useContext( DataFormContext );

	const previousData = previousDataProp ?? previousDataContext;
	const comparisonLayout = comparisonLayoutProp ?? comparisonLayoutContext;

	// Auto-compute: mark the minority of fields
	// When counts are equal, mark required fields
	const markWhenOptional = useMemo( () => {
		const requiredCount = fieldDefinitions.filter(
			( f ) => !! f.isValid?.required
		).length;
		const optionalCount = fieldDefinitions.length - requiredCount;
		return requiredCount > optionalCount;
	}, [ fieldDefinitions ] );

	function getFieldDefinition( field: NormalizedFormField ) {
		return fieldDefinitions.find(
			( fieldDefinition ) => fieldDefinition.id === field.id
		);
	}

	const Wrapper =
		as ??
		getFormFieldLayout( form.layout.type )?.wrapper ??
		DEFAULT_WRAPPER;

	return (
		<Wrapper layout={ form.layout }>
			{ form.fields.map( ( formField ) => {
				const FieldLayout = getFormFieldLayout(
					formField.layout.type
				)?.component;

				if ( ! FieldLayout ) {
					return null;
				}

				const fieldDefinition = ! formField.children
					? getFieldDefinition( formField )
					: undefined;

				if ( fieldDefinition && fieldDefinition.isVisible ) {
					const isVisibleInCurrent =
						fieldDefinition.isVisible( data );
					const isVisibleInPrevious = previousData
						? fieldDefinition.isVisible( previousData )
						: false;
					if ( ! isVisibleInCurrent && ! isVisibleInPrevious ) {
						return null;
					}
				}

				const fieldDiff =
					fieldDefinition && previousData !== undefined
						? computeFieldDiff(
								fieldDefinition,
								data,
								previousData
							)
						: undefined;

				if ( children ) {
					return children(
						FieldLayout,
						formField,
						validity?.[ formField.id ],
						markWhenOptional
					);
				}

				return (
					<FieldLayout
						key={ formField.id }
						data={ data }
						previousData={ previousData }
						diff={ fieldDiff }
						comparisonLayout={ comparisonLayout }
						field={ formField }
						onChange={ onChange }
						markWhenOptional={ markWhenOptional }
						validity={ validity?.[ formField.id ] }
					/>
				);
			} ) }
		</Wrapper>
	);
}
