import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment } from '@wordpress/element';
import { Badge } from '../index';

const meta: Meta< typeof Badge > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Badge',
	id: 'design-system-components-badge',
	component: Badge,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Badge >;

export const Default: Story = {
	args: {
		children: 'Badge',
	},
};

export const Error: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'error',
	},
};

export const Warning: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'warning',
	},
};

export const Caution: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'caution',
	},
};

export const Success: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'success',
	},
};

export const Info: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'info',
	},
};

export const Neutral: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'neutral',
	},
};

export const High: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'high',
	},
};

export const Medium: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'medium',
	},
};

export const Low: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'low',
	},
};

export const Stable: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'stable',
	},
};

export const Informational: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'informational',
	},
};

export const Draft: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'draft',
	},
};

export const None: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'none',
	},
};

export const AllIntents: Story = {
	...Default,
	render: ( args ) => (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'max-content min-content',
				gap: '1rem',
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			{ (
				[
					'neutral',
					'info',
					'caution',
					'warning',
					'success',
					'error',
					'draft',
					'none',
					'informational',
					'low',
					'medium',
					'stable',
					'high',
				] as const
			 ).map( ( intent ) => (
				<Fragment key={ intent }>
					<div
						style={ {
							paddingInlineEnd: '1rem',
							display: 'flex',
							alignItems: 'center',
						} }
					>
						{ intent }
					</div>
					<div
						style={ {
							padding: '0.5rem 1rem',
							display: 'flex',
							alignItems: 'center',
						} }
					>
						<Badge { ...args } intent={ intent } />
					</div>
				</Fragment>
			) ) }
		</div>
	),
};
