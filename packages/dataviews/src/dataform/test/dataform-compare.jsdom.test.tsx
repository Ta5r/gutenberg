import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DataForm from '../index';
import type { Field, Form } from '../../types';

describe( 'DataForm comparison / revisions mode', () => {
	type TestItem = {
		title: string;
		author?: string;
		status: string;
		order: number;
		legacyNote?: string;
	};

	const fields: Field< TestItem >[] = [
		{
			id: 'title',
			label: 'Title',
			type: 'text',
		},
		{
			id: 'author',
			label: 'Author',
			type: 'text',
		},
		{
			id: 'status',
			label: 'Status',
			type: 'text',
		},
		{
			id: 'order',
			label: 'Order',
			type: 'integer',
		},
		{
			id: 'legacyNote',
			label: 'Legacy Note',
			type: 'text',
		},
	];

	const form: Form = {
		layout: { type: 'regular', labelPosition: 'side' },
		fields: [ 'title', 'author', 'status', 'order', 'legacyNote' ],
	};

	const previousData: TestItem = {
		title: 'Old Title',
		status: 'draft',
		order: 1,
		legacyNote: 'This note was deleted',
	};

	const currentData: TestItem = {
		title: 'New Title', // modified
		author: 'Alice', // added
		status: 'draft', // unchanged
		order: 1, // unchanged
		legacyNote: '', // removed
	};

	it( 'renders in read-only mode when previousData is provided', () => {
		render(
			<DataForm
				data={ currentData }
				previousData={ previousData }
				fields={ fields }
				form={ form }
			/>
		);

		// In read-only comparison mode, no textboxes (edit controls) should be rendered
		expect( screen.queryByRole( 'textbox' ) ).not.toBeInTheDocument();
	} );

	it( 'displays diff status badges for modified, added, and removed fields', () => {
		render(
			<DataForm
				data={ currentData }
				previousData={ previousData }
				fields={ fields }
				form={ form }
			/>
		);

		const modifiedBadge = screen.getByRole( 'status', {
			name: 'Modified',
		} );
		const addedBadge = screen.getByRole( 'status', { name: 'Added' } );
		const removedBadge = screen.getByRole( 'status', { name: 'Removed' } );

		expect( modifiedBadge ).toBeInTheDocument();
		expect( modifiedBadge ).toHaveClass( 'is-modified' );

		expect( addedBadge ).toBeInTheDocument();
		expect( addedBadge ).toHaveClass( 'is-added' );

		expect( removedBadge ).toBeInTheDocument();
		expect( removedBadge ).toHaveClass( 'is-removed' );
	} );

	it( 'does not display diff status badge for unchanged fields', () => {
		render(
			<DataForm
				data={ currentData }
				previousData={ previousData }
				fields={ fields }
				form={ form }
			/>
		);

		// There are exactly 3 diff status badges: Modified (title), Added (author), Removed (legacyNote)
		const badges = screen.getAllByRole( 'status' );
		expect( badges ).toHaveLength( 3 );
	} );

	it( 'renders inline diff comparison by default', () => {
		render(
			<DataForm
				data={ currentData }
				previousData={ previousData }
				fields={ fields }
				form={ form }
				comparisonLayout="inline"
			/>
		);

		// For modified field 'title': 'Old Title' in del and 'New Title' in ins
		expect( screen.getByText( 'Old Title' ).tagName ).toBe( 'DEL' );
		expect( screen.getByText( 'New Title' ).tagName ).toBe( 'INS' );

		// For removed field 'legacyNote': previous value in del
		expect( screen.getByText( 'This note was deleted' ).tagName ).toBe(
			'DEL'
		);

		// For added field 'author': current value in ins
		expect( screen.getByText( 'Alice' ).tagName ).toBe( 'INS' );
	} );

	it( 'renders stacked diff comparison layout', () => {
		render(
			<DataForm
				data={ currentData }
				previousData={ previousData }
				fields={ fields }
				form={ form }
				comparisonLayout="stacked"
			/>
		);

		expect( screen.getAllByText( /Previous:/i ).length ).toBeGreaterThan(
			0
		);
		expect( screen.getAllByText( /Current:/i ).length ).toBeGreaterThan(
			0
		);
		expect( screen.getByText( 'Old Title' ) ).toBeInTheDocument();
		expect( screen.getByText( 'New Title' ) ).toBeInTheDocument();
	} );

	it( 'renders side-by-side diff comparison layout', () => {
		render(
			<DataForm
				data={ currentData }
				previousData={ previousData }
				fields={ fields }
				form={ form }
				comparisonLayout="side-by-side"
			/>
		);

		expect( screen.getAllByText( 'Previous' ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByText( 'Current' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'Old Title' ) ).toBeInTheDocument();
		expect( screen.getByText( 'New Title' ) ).toBeInTheDocument();
	} );

	it( 'works when onChange is omitted in comparison mode', () => {
		expect( () => {
			render(
				<DataForm
					data={ currentData }
					previousData={ previousData }
					fields={ fields }
					form={ form }
				/>
			);
		} ).not.toThrow();
	} );
} );
