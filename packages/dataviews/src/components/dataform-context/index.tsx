import { createContext } from '@wordpress/element';
import type { NormalizedField, ComparisonLayout } from '../../types';

type DataFormContextType< Item > = {
	fields: NormalizedField< Item >[];
	previousData?: Item;
	isComparison?: boolean;
	comparisonLayout?: ComparisonLayout;
};

const DataFormContext = createContext< DataFormContextType< any > >( {
	fields: [],
} );
DataFormContext.displayName = 'DataFormContext';

export function DataFormProvider< Item >( {
	fields,
	previousData,
	comparisonLayout = 'inline',
	children,
}: React.PropsWithChildren< {
	fields: NormalizedField< Item >[];
	previousData?: Item;
	comparisonLayout?: ComparisonLayout;
} > ) {
	const isComparison = previousData !== undefined;
	return (
		<DataFormContext.Provider
			value={ { fields, previousData, isComparison, comparisonLayout } }
		>
			{ children }
		</DataFormContext.Provider>
	);
}

export default DataFormContext;
