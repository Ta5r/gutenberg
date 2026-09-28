import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import TemplateAuthorView from '../template-author/view';
import type { Pattern } from '../../types';

async function getPatternAuthorElements() {
	const users = ( await resolveSelect( coreStore ).getEntityRecords(
		'root',
		'user',
		{ per_page: -1, who: 'authors', _fields: 'id,name', context: 'view' }
	) ) as { id: number; name: string }[] | null;

	const elements: { value: string; label: string }[] = [];
	const seen = new Set< string >();

	// Add authors from WordPress users (for user patterns).
	for ( const user of users ?? [] ) {
		if ( user.name && ! seen.has( user.name ) ) {
			seen.add( user.name );
			elements.push( { value: user.name, label: user.name } );
		}
	}

	// Add theme author if available.
	const currentTheme = ( await resolveSelect( coreStore ).getCurrentTheme() ) as {
		name?: string;
		title?: { rendered?: string };
	} | null;
	const themeName =
		currentTheme?.title?.rendered || currentTheme?.name || __( 'Theme' );
	if ( themeName && ! seen.has( themeName ) ) {
		seen.add( themeName );
		elements.push( { value: themeName, label: themeName } );
	}

	return elements;
}

const patternAuthorField: Field< Pattern > = {
	label: __( 'Author' ),
	id: 'author',
	type: 'text',
	getValue: ( { item } ) => item.author_text,
	render: TemplateAuthorView,
	enableSorting: false,
	filterBy: {
		operators: [ 'isAny', 'isNone' ],
		isPrimary: true,
	},
	getElements: getPatternAuthorElements,
};

/**
 * Author field for patterns.
 */
export default patternAuthorField;
