import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotFillProvider } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import {
	BlockEditContextProvider,
	mayDisplayControlsKey,
} from '../../../../block-editor/src/components/block-edit/context';
import LatestCommentsEdit from '../edit';

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		useBlockProps: Object.assign(
			vi.fn( ( props ) => props ),
			{
				save: actual.useBlockProps.save,
			}
		),
	};
} );

vi.mock( import( '@wordpress/server-side-render' ), () => ( {
	useServerSideRender: vi.fn( () => ( {
		content:
			'<ol class="wp-block-latest-comments"><li>Test comment</li></ol>',
		status: 'success',
	} ) ),
} ) );

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

const defaultAttributes = {
	commentsToShow: 5,
	displayAvatar: true,
	displayDate: true,
	displayContent: 'excerpt',
	excludePostAuthor: false,
};

function TestEditWrapper( {
	attributes = defaultAttributes,
	setAttributes = vi.fn(),
}: {
	attributes?: typeof defaultAttributes;
	setAttributes?: ( attrs: Partial< typeof defaultAttributes > ) => void;
} ) {
	return (
		<SlotFillProvider>
			<BlockEditContextProvider
				value={ {
					name: 'core/latest-comments',
					isSelected: true,
					[ mayDisplayControlsKey ]: true,
				} }
			>
				<LatestCommentsEdit
					attributes={ attributes }
					setAttributes={ setAttributes }
					name="core/latest-comments"
				/>
				<InspectorControls.Slot />
			</BlockEditContextProvider>
		</SlotFillProvider>
	);
}

describe( 'Latest Comments edit component', () => {
	test( 'renders the "Exclude post author" toggle in settings unchecked by default', () => {
		render( <TestEditWrapper /> );

		const toggle = screen.getByRole( 'checkbox', {
			name: 'Exclude post author',
		} );
		expect( toggle ).toBeInTheDocument();
		expect( toggle ).not.toBeChecked();
	} );

	test( 'calls setAttributes with excludePostAuthor: true when toggled on', async () => {
		const user = userEvent.setup();
		const setAttributes = vi.fn();
		render( <TestEditWrapper setAttributes={ setAttributes } /> );

		const toggle = screen.getByRole( 'checkbox', {
			name: 'Exclude post author',
		} );
		await user.click( toggle );

		expect( setAttributes ).toHaveBeenCalledWith( {
			excludePostAuthor: true,
		} );
	} );

	test( 'renders checked when excludePostAuthor is true and calls setAttributes with false when unchecked', async () => {
		const user = userEvent.setup();
		const setAttributes = vi.fn();
		render(
			<TestEditWrapper
				attributes={ {
					...defaultAttributes,
					excludePostAuthor: true,
				} }
				setAttributes={ setAttributes }
			/>
		);

		const toggle = screen.getByRole( 'checkbox', {
			name: 'Exclude post author',
		} );
		expect( toggle ).toBeChecked();

		await user.click( toggle );
		expect( setAttributes ).toHaveBeenCalledWith( {
			excludePostAuthor: false,
		} );
	} );
} );
