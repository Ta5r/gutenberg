import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import type { NormalizedField } from '../types';

/**
 * The diff status of a field when comparing two items:
 *
 * - `added`: The field had no value in previous item, but has a value in the current item.
 * - `removed`: The field had a value in the previous item, but has no value in the current item.
 * - `modified`: The field has different values in previous and current items.
 * - `unchanged`: The field has the same value in both items.
 */
export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

/**
 * Information about how a field's value changed between two revisions/items.
 */
export interface FieldDiff< Value = any > {
	/**
	 * The id of the field.
	 */
	fieldId: string;

	/**
	 * The diff status.
	 */
	status: DiffStatus;

	/**
	 * The value in the current item.
	 */
	currentValue: Value;

	/**
	 * The value in the previous item (undefined if no previous item was provided).
	 */
	previousValue: Value | undefined;

	/**
	 * Whether the field's value has changed.
	 */
	hasChanged: boolean;
}

/**
 * Checks whether a field value is considered empty/absent.
 *
 * @param value The value to check.
 * @return True if the value is empty or absent.
 */
export function isEmptyValue( value: unknown ): boolean {
	if ( value === undefined || value === null || value === '' ) {
		return true;
	}

	if ( Array.isArray( value ) ) {
		return value.length === 0;
	}

	if (
		typeof value === 'object' &&
		! ( value instanceof Date ) &&
		Object.keys( value ).length === 0
	) {
		return true;
	}

	return false;
}

/**
 * Computes the diff between two items for a given field definition.
 *
 * @param field        The normalized field definition.
 * @param currentItem  The current data item.
 * @param previousItem The previous data item to compare against.
 * @return The diff result, or undefined if no previous item is provided.
 */
export function computeFieldDiff< Item >(
	field: NormalizedField< Item >,
	currentItem: Item,
	previousItem?: Item
): FieldDiff | undefined {
	if ( previousItem === undefined ) {
		return undefined;
	}

	const currentValue = field.getValue( { item: currentItem } );
	const previousValue = field.getValue( { item: previousItem } );

	const currentEmpty = isEmptyValue( currentValue );
	const previousEmpty = isEmptyValue( previousValue );

	if ( currentEmpty && previousEmpty ) {
		return {
			fieldId: field.id,
			status: 'unchanged',
			currentValue,
			previousValue,
			hasChanged: false,
		};
	}

	if ( fastDeepEqual( currentValue, previousValue ) ) {
		return {
			fieldId: field.id,
			status: 'unchanged',
			currentValue,
			previousValue,
			hasChanged: false,
		};
	}

	if ( previousEmpty && ! currentEmpty ) {
		return {
			fieldId: field.id,
			status: 'added',
			currentValue,
			previousValue,
			hasChanged: true,
		};
	}

	if ( ! previousEmpty && currentEmpty ) {
		return {
			fieldId: field.id,
			status: 'removed',
			currentValue,
			previousValue,
			hasChanged: true,
		};
	}

	return {
		fieldId: field.id,
		status: 'modified',
		currentValue,
		previousValue,
		hasChanged: true,
	};
}
