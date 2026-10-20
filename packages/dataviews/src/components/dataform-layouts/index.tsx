import clsx from 'clsx';
import { Stack } from '@wordpress/ui';
import type { NormalizedLayout, NormalizedRowLayout } from '../../types';
import FormRegularField from './regular';
import FormPanelField from './panel';
import FormCardField from './card';
import FormRowField from './row';
import FormDetailsField from './details';

const FORM_FIELD_LAYOUTS = [
	{
		type: 'regular',
		component: FormRegularField,
		wrapper: ( {
			children,
			className,
		}: {
			children: React.ReactNode;
			className?: string;
		} ) => (
			<Stack
				direction="column"
				className={ clsx( 'dataforms-layouts__wrapper', className ) }
				gap="lg"
			>
				{ children }
			</Stack>
		),
	},
	{
		type: 'panel',
		component: FormPanelField,
		wrapper: ( {
			children,
			className,
		}: {
			children: React.ReactNode;
			className?: string;
		} ) => (
			<Stack
				direction="column"
				className={ clsx( 'dataforms-layouts__wrapper', className ) }
				gap="md"
			>
				{ children }
			</Stack>
		),
	},
	{
		type: 'card',
		component: FormCardField,
		wrapper: ( {
			children,
			className,
		}: {
			children: React.ReactNode;
			className?: string;
		} ) => (
			<Stack
				direction="column"
				className={ clsx( 'dataforms-layouts__wrapper', className ) }
				gap="xl"
			>
				{ children }
			</Stack>
		),
	},
	{
		type: 'row',
		component: FormRowField,
		wrapper: ( {
			children,
			layout,
			className,
		}: {
			children: React.ReactNode;
			layout: NormalizedLayout;
			className?: string;
		} ) => (
			<Stack
				direction="column"
				className={ clsx( 'dataforms-layouts__wrapper', className ) }
				gap="lg"
			>
				<div className="dataforms-layouts-row__field">
					<Stack
						direction="row"
						gap="lg"
						align={ ( layout as NormalizedRowLayout ).alignment }
					>
						{ children }
					</Stack>
				</div>
			</Stack>
		),
	},
	{
		type: 'details',
		component: FormDetailsField,
	},
];

export function getFormFieldLayout( type: string ) {
	return FORM_FIELD_LAYOUTS.find( ( layout ) => layout.type === type );
}
