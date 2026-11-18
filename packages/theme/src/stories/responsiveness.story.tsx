import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import { ThemeProvider } from '../theme-provider';
import {
	BREAKPOINTS,
	BREAKPOINT_ORDER,
	resolveResponsiveValue,
	useContainerBreakpoint,
	useViewportBreakpoint,
} from '../responsive';

const meta: Meta = {
	title: 'Design System/Theme/Responsiveness',
	parameters: {
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Badge = ( {
	label,
	value,
}: {
	label: string;
	value: string | number;
} ) => (
	<span
		style={ {
			display: 'inline-flex',
			alignItems: 'center',
			gap: 'var(--wpds-dimension-gap-xs)',
			padding:
				'var(--wpds-dimension-padding-xs) var(--wpds-dimension-padding-sm)',
			borderRadius: 'var(--wpds-border-radius-sm)',
			backgroundColor:
				'var(--wpds-color-background-surface-neutral-weak)',
			border: '1px solid var(--wpds-color-stroke-surface-neutral)',
			fontSize: 'var(--wpds-typography-font-size-sm)',
		} }
	>
		<span>{ label }:</span>
		<strong>{ value }</strong>
	</span>
);

const ResponsiveContainerDemo = ( {
	title,
	width,
	children,
}: {
	title: string;
	width: number;
	children?: React.ReactNode;
} ) => {
	const { ref, breakpoint } = useContainerBreakpoint< HTMLDivElement >();
	const columns = resolveResponsiveValue(
		{ default: 1, xs: 2, md: 3, lg: 4 },
		breakpoint
	);

	return (
		<div
			ref={ ref }
			style={ {
				width: `${ width }px`,
				maxWidth: '100%',
				padding: 'var(--wpds-dimension-padding-md)',
				borderRadius: 'var(--wpds-border-radius-lg)',
				border: '1px solid var(--wpds-color-stroke-surface-neutral-strong)',
				backgroundColor: 'var(--wpds-color-background-surface-neutral)',
				display: 'flex',
				flexDirection: 'column',
				gap: 'var(--wpds-dimension-gap-md)',
				boxSizing: 'border-box',
			} }
		>
			<div
				style={ {
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'center',
					gap: 'var(--wpds-dimension-gap-sm)',
				} }
			>
				<strong>{ title }</strong>
				<Badge label="Container breakpoint" value={ breakpoint } />
				<Badge label="Resolved columns" value={ columns } />
			</div>
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: `repeat(${ columns }, minmax(0, 1fr))`,
					gap: 'var(--wpds-dimension-gap-sm)',
				} }
			>
				{ [ 1, 2, 3, 4 ].map( ( item ) => (
					<div
						key={ item }
						style={ {
							padding: 'var(--wpds-dimension-padding-sm)',
							borderRadius: 'var(--wpds-border-radius-sm)',
							backgroundColor:
								'var(--wpds-color-background-surface-brand)',
							color: 'var(--wpds-color-foreground-content-neutral)',
							textAlign: 'center',
						} }
					>
						Card { item }
					</div>
				) ) }
			</div>
			{ children }
		</div>
	);
};

export const ViewportAndContainer: StoryObj = {
	render: () => {
		const viewportBreakpoint = useViewportBreakpoint();
		const viewportLayout = resolveResponsiveValue(
			{
				default: 'compact',
				md: 'standard',
				xl: 'expanded',
			},
			viewportBreakpoint
		);

		const [ outerWidth, setOuterWidth ] = useState( 820 );
		const [ innerWidth, setInnerWidth ] = useState( 500 );
		const outerWidthId = useId();
		const innerWidthId = useId();

		return (
			<ThemeProvider>
				<div
					style={ {
						display: 'flex',
						flexDirection: 'column',
						gap: 'var(--wpds-dimension-gap-lg)',
						color: 'var(--wpds-color-foreground-content-neutral)',
						fontFamily: 'var(--wpds-typography-font-family-body)',
					} }
				>
					<section
						style={ {
							padding: 'var(--wpds-dimension-padding-md)',
							borderRadius: 'var(--wpds-border-radius-lg)',
							border: '1px solid var(--wpds-color-stroke-surface-neutral)',
							backgroundColor:
								'var(--wpds-color-background-surface-neutral)',
							display: 'flex',
							flexDirection: 'column',
							gap: 'var(--wpds-dimension-gap-sm)',
						} }
					>
						<h3 style={ { margin: 0 } }>
							Viewport Query (<code>useViewportBreakpoint</code>)
						</h3>
						<div
							style={ {
								display: 'flex',
								flexWrap: 'wrap',
								gap: 'var(--wpds-dimension-gap-sm)',
							} }
						>
							<Badge
								label="Active viewport"
								value={ viewportBreakpoint }
							/>
							<Badge
								label="Resolved layout"
								value={ viewportLayout }
							/>
						</div>
						<p style={ { margin: 0 } }>
							Resize the browser window to see viewport tokens
							resolve:{ ' ' }
							{ BREAKPOINT_ORDER.map(
								( bp ) => `${ bp } (${ BREAKPOINTS[ bp ] }px)`
							).join( ', ' ) }
							.
						</p>
					</section>

					<section
						style={ {
							display: 'flex',
							flexDirection: 'column',
							gap: 'var(--wpds-dimension-gap-sm)',
						} }
					>
						<h3 style={ { margin: 0 } }>
							Container Queries ({ ' ' }
							<code>useContainerBreakpoint</code> )
						</h3>
						<div
							style={ {
								display: 'flex',
								flexWrap: 'wrap',
								gap: 'var(--wpds-dimension-gap-lg)',
							} }
						>
							<label
								htmlFor={ outerWidthId }
								style={ {
									display: 'inline-flex',
									alignItems: 'center',
									gap: 'var(--wpds-dimension-gap-sm)',
								} }
							>
								<span>Outer width ({ outerWidth }px)</span>
								<input
									id={ outerWidthId }
									type="range"
									min={ 320 }
									max={ 1100 }
									value={ outerWidth }
									onChange={ ( e ) =>
										setOuterWidth(
											Number( e.target.value )
										)
									}
								/>
							</label>
							<label
								htmlFor={ innerWidthId }
								style={ {
									display: 'inline-flex',
									alignItems: 'center',
									gap: 'var(--wpds-dimension-gap-sm)',
								} }
							>
								<span>Nested width ({ innerWidth }px)</span>
								<input
									id={ innerWidthId }
									type="range"
									min={ 280 }
									max={ 850 }
									value={ innerWidth }
									onChange={ ( e ) =>
										setInnerWidth(
											Number( e.target.value )
										)
									}
								/>
							</label>
						</div>

						<ResponsiveContainerDemo
							title="Outer Container"
							width={ outerWidth }
						>
							<ResponsiveContainerDemo
								title="Nested Container"
								width={ innerWidth }
							/>
						</ResponsiveContainerDemo>
					</section>
				</div>
			</ThemeProvider>
		);
	},
};
