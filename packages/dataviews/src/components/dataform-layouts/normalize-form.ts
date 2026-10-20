import { __ } from '@wordpress/i18n';
import type {
	Form,
	Layout,
	NormalizedForm,
	NormalizedFormField,
	NormalizedLayout,
	NormalizedRegularLayout,
	NormalizedPanelLayout,
	NormalizedCardLayout,
	NormalizedRowLayout,
	NormalizedDetailsLayout,
	NormalizedCardSummaryField,
	CardSummaryField,
} from '../../types';

export const DEFAULT_LAYOUT: NormalizedLayout = {
	type: 'regular',
	labelPosition: 'top',
} as NormalizedRegularLayout;

const normalizeCardSummaryField = (
	sum: CardSummaryField
): NormalizedCardSummaryField => {
	if ( typeof sum === 'string' ) {
		return [ { id: sum, visibility: 'when-collapsed' } ];
	}
	return sum.map( ( item ) => {
		if ( typeof item === 'string' ) {
			return { id: item, visibility: 'when-collapsed' };
		}
		return { id: item.id, visibility: item.visibility };
	} );
};

/**
 * Normalizes a layout configuration based on its type.
 *
 * @param layout      The layout object to normalize.
 * @param defaultGrow Optional default grow value when layout is regular.
 * @return The normalized layout object.
 */
function normalizeLayout(
	layout?: Layout,
	defaultGrow?: boolean
): NormalizedLayout {
	let normalizedLayout = DEFAULT_LAYOUT;

	if ( layout?.type === 'regular' ) {
		const grow = layout?.grow ?? defaultGrow;
		normalizedLayout = {
			type: 'regular',
			labelPosition: layout?.labelPosition ?? 'top',
			...( grow !== undefined && { grow } ),
		} satisfies NormalizedRegularLayout;
	} else if ( layout?.type === 'panel' ) {
		const summary = layout.summary ?? [];
		const normalizedSummary = Array.isArray( summary )
			? summary
			: [ summary ];

		const openAs = layout?.openAs;
		let normalizedOpenAs: NormalizedPanelLayout[ 'openAs' ];
		if ( typeof openAs === 'object' && openAs.type === 'modal' ) {
			normalizedOpenAs = {
				type: 'modal',
				applyLabel: openAs.applyLabel?.trim() || __( 'Apply' ),
				cancelLabel: openAs.cancelLabel?.trim() || __( 'Cancel' ),
			};
		} else if ( openAs === 'modal' ) {
			normalizedOpenAs = {
				type: 'modal',
				applyLabel: __( 'Apply' ),
				cancelLabel: __( 'Cancel' ),
			};
		} else {
			normalizedOpenAs = { type: 'dropdown' };
		}

		normalizedLayout = {
			type: 'panel',
			labelPosition: layout?.labelPosition ?? 'side',
			openAs: normalizedOpenAs,
			summary: normalizedSummary,
			editVisibility: layout?.editVisibility ?? 'on-hover',
			showPlaceholderIfEmpty: layout?.showPlaceholderIfEmpty ?? false,
		} satisfies NormalizedPanelLayout;
	} else if ( layout?.type === 'card' ) {
		if ( layout.withHeader === false ) {
			// Don't let isOpened be false if withHeader is false.
			// Otherwise, the card will not be visible.
			normalizedLayout = {
				type: 'card',
				withHeader: false,
				isOpened: true,
				summary: [],
				isCollapsible: false,
			} satisfies NormalizedCardLayout;
		} else {
			const summary = layout.summary ?? [];

			normalizedLayout = {
				type: 'card',
				withHeader: true,
				isOpened:
					typeof layout.isOpened === 'boolean'
						? layout.isOpened
						: true,
				summary: normalizeCardSummaryField( summary ),
				isCollapsible:
					layout.isCollapsible === undefined
						? true
						: layout.isCollapsible,
			} satisfies NormalizedCardLayout;
		}
	} else if ( layout?.type === 'row' ) {
		normalizedLayout = {
			type: 'row',
			alignment: layout?.alignment ?? 'center',
			styles: layout?.styles ?? {},
		} satisfies NormalizedRowLayout;
	} else if ( layout?.type === 'details' ) {
		normalizedLayout = {
			type: 'details',
			summary: layout?.summary ?? '',
		} satisfies NormalizedDetailsLayout;
	}

	return normalizedLayout;
}

function normalizeForm( form: Form ): NormalizedForm {
	const normalizedFormLayout = normalizeLayout( form?.layout );

	const normalizedFields: NormalizedFormField[] = ( form.fields ?? [] ).map(
		( field ) => {
			if ( typeof field === 'string' ) {
				return {
					id: field,
					layout: normalizedFormLayout,
				} satisfies NormalizedFormField;
			}

			const defaultFieldGrow =
				field.grow ??
				( normalizedFormLayout.type === 'regular'
					? normalizedFormLayout.grow
					: undefined );

			let fieldLayout: NormalizedLayout;
			if ( field.layout ) {
				fieldLayout = normalizeLayout( field.layout, defaultFieldGrow );
			} else if (
				field.grow !== undefined &&
				normalizedFormLayout.type === 'regular'
			) {
				fieldLayout = {
					...normalizedFormLayout,
					grow: field.grow,
				};
			} else {
				fieldLayout = normalizedFormLayout;
			}

			let isGrow: boolean | undefined = field.grow;
			if ( isGrow === undefined && fieldLayout.type === 'regular' ) {
				isGrow = fieldLayout.grow;
			}

			return {
				id: field.id,
				layout: fieldLayout,
				...( isGrow !== undefined && { grow: isGrow } ),
				...( !! field.className && { className: field.className } ),
				...( !! field.label && { label: field.label } ),
				...( !! field.description && {
					description: field.description,
				} ),
				...( 'children' in field &&
					Array.isArray( field.children ) && {
						children: normalizeForm( {
							fields: field.children,
							layout: DEFAULT_LAYOUT,
						} ).fields,
					} ),
			} satisfies NormalizedFormField;
		}
	);

	return {
		layout: normalizedFormLayout,
		fields: normalizedFields,
	};
}

export default normalizeForm;
