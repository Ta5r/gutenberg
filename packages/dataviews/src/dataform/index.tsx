import { useMemo } from '@wordpress/element';
import type { DataFormProps } from '../types';
import normalizeFields from '../field-types';
import { DataFormProvider } from '../components/dataform-context';
import { DataFormLayout } from '../components/dataform-layouts/data-form-layout';
import normalizeForm from '../components/dataform-layouts/normalize-form';

const noop = () => {};

/**
 * `DataForm` renders an auto-generated form for viewing and editing the fields
 * of a data item, driven by a fields and form layout configuration. Use it to
 * edit items of a dataset, often alongside `DataViews`.
 *
 * When `previousData` is provided, `DataForm` operates in revisions/comparison mode,
 * rendering fields in read-only mode and displaying visual change indicators
 * (Added, Modified, Removed).
 */
export default function DataForm< Item >( {
	data,
	previousData,
	comparisonLayout = 'inline',
	form,
	fields,
	onChange = noop,
	validity,
}: DataFormProps< Item > ) {
	const normalizedForm = useMemo( () => normalizeForm( form ), [ form ] );
	const normalizedFields = useMemo(
		() => normalizeFields( fields ),
		[ fields ]
	);

	if ( ! form.fields ) {
		return null;
	}

	return (
		<DataFormProvider
			fields={ normalizedFields }
			previousData={ previousData }
			comparisonLayout={ comparisonLayout }
		>
			<DataFormLayout
				data={ data }
				previousData={ previousData }
				comparisonLayout={ comparisonLayout }
				form={ normalizedForm }
				onChange={ onChange }
				validity={ validity }
			/>
		</DataFormProvider>
	);
}
