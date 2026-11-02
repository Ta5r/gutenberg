import DataForm from '../index';
import type { Field, Form, ComparisonLayout } from '../../types';

type PostRevision = {
	title: string;
	status: string;
	excerpt: string;
	altText?: string;
	featuredImage?: string;
	order: number;
};

const fields: Field< PostRevision >[] = [
	{
		id: 'title',
		label: 'Title',
		type: 'text',
	},
	{
		id: 'status',
		label: 'Status',
		type: 'text',
		elements: [
			{ value: 'draft', label: 'Draft' },
			{ value: 'publish', label: 'Published' },
			{ value: 'pending', label: 'Pending Review' },
		],
	},
	{
		id: 'excerpt',
		label: 'Excerpt',
		type: 'text',
	},
	{
		id: 'altText',
		label: 'Alt Text',
		type: 'text',
	},
	{
		id: 'featuredImage',
		label: 'Featured Image',
		type: 'text',
	},
	{
		id: 'order',
		label: 'Menu Order',
		type: 'integer',
	},
];

const form: Form = {
	layout: { type: 'regular', labelPosition: 'side' },
	fields: [
		'title',
		'status',
		'excerpt',
		'altText',
		'featuredImage',
		'order',
	],
};

const previousRevision: PostRevision = {
	title: 'Original Post Title',
	status: 'draft',
	excerpt: 'This was the previous excerpt text before revision.',
	featuredImage: 'image-1.jpg',
	order: 1,
};

const currentRevision: PostRevision = {
	title: 'Updated Post Title with New Changes', // modified
	status: 'publish', // modified
	excerpt: 'This was the previous excerpt text before revision.', // unchanged
	altText: 'An accessible description of the main hero illustration', // added
	featuredImage: '', // removed
	order: 1, // unchanged
};

export default function CompareComponent( {
	comparisonLayout = 'inline',
}: {
	comparisonLayout?: ComparisonLayout;
} ) {
	return (
		<div style={ { maxWidth: 640, padding: 24 } }>
			<DataForm< PostRevision >
				data={ currentRevision }
				previousData={ previousRevision }
				comparisonLayout={ comparisonLayout }
				fields={ fields }
				form={ form }
			/>
		</div>
	);
}
