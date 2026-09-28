import fastDeepEqual from 'fast-deep-equal';
import type { Field, FieldComparisonStatus, NormalizedField } from '../types';

/**
 * Checks if a field value is effectively empty.
 */
function isValueEmpty( value: unknown ): boolean {
	if ( value === null || value === undefined || value === '' ) {
		return true;
	}
	if ( Array.isArray( value ) && value.length === 0 ) {
		return true;
	}
	if (
		typeof value === 'object' &&
		Object.keys( value as Record< string, unknown > ).length === 0
	) {
		return true;
	}
	return false;
}

/**
 * Computes the comparison status of a field between current and previous items.
 *
 * @param fieldDefinition The field definition.
 * @param data            The current data item.
 * @param previousData    The previous data item to compare against.
 * @return The comparison status: 'added', 'removed', 'modified', or 'unchanged'.
 */
export function getFieldComparisonStatus< Item >(
	fieldDefinition: Field< Item > | NormalizedField< Item >,
	data: Item,
	previousData?: Item
): FieldComparisonStatus {
	if ( ! previousData ) {
		return 'unchanged';
	}

	const currentValue = fieldDefinition.getValue( { item: data } );
	const previousValue = fieldDefinition.getValue( { item: previousData } );

	const currentEmpty = isValueEmpty( currentValue );
	const prevEmpty = isValueEmpty( previousValue );

	if ( prevEmpty && currentEmpty ) {
		return 'unchanged';
	}

	if ( prevEmpty && ! currentEmpty ) {
		return 'added';
	}

	if ( ! prevEmpty && currentEmpty ) {
		return 'removed';
	}

	if ( ! fastDeepEqual( currentValue, previousValue ) ) {
		return 'modified';
	}

	return 'unchanged';
}
