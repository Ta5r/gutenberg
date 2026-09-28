import { createContext } from '@wordpress/element';
import type { CompareMode, NormalizedField } from '../../types';

type DataFormContextType< Item > = {
	fields: NormalizedField< Item >[];
	previousData?: Item;
	compareMode?: CompareMode;
};

const DataFormContext = createContext< DataFormContextType< any > >( {
	fields: [],
} );
DataFormContext.displayName = 'DataFormContext';

export function DataFormProvider< Item >( {
	fields,
	previousData,
	compareMode,
	children,
}: React.PropsWithChildren< {
	fields: NormalizedField< Item >[];
	previousData?: Item;
	compareMode?: CompareMode;
} > ) {
	return (
		<DataFormContext.Provider
			value={ { fields, previousData, compareMode } }
		>
			{ children }
		</DataFormContext.Provider>
	);
}

export default DataFormContext;
