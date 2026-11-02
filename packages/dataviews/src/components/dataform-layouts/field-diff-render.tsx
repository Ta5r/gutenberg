import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import type { ComparisonLayout, NormalizedField } from '../../types';
import type { FieldDiff } from '../../utils/diff';

export interface FieldDiffRenderProps< Item > {
	data: Item;
	previousData?: Item;
	field: NormalizedField< Item >;
	diff?: FieldDiff;
	comparisonLayout?: ComparisonLayout;
}

/**
 * Renders the value of a field in revisions/comparison mode based on its diff status
 * and the configured comparison layout ('inline', 'stacked', or 'side-by-side').
 */
export default function FieldDiffRender< Item >( {
	data,
	previousData,
	field,
	diff,
	comparisonLayout = 'inline',
}: FieldDiffRenderProps< Item > ) {
	const status = diff?.status ?? 'unchanged';

	if ( status === 'modified' && previousData !== undefined ) {
		if ( comparisonLayout === 'stacked' ) {
			return (
				<Stack
					direction="column"
					gap="xs"
					className="dataforms-field-diff-stacked"
				>
					<div className="dataforms-field-diff-previous">
						<span className="dataforms-field-diff-sublabel">
							{ __( 'Previous:' ) }
						</span>{ ' ' }
						<del>
							<field.render
								item={ previousData }
								field={ field }
							/>
						</del>
					</div>
					<div className="dataforms-field-diff-current">
						<span className="dataforms-field-diff-sublabel">
							{ __( 'Current:' ) }
						</span>{ ' ' }
						<ins>
							<field.render item={ data } field={ field } />
						</ins>
					</div>
				</Stack>
			);
		}

		if ( comparisonLayout === 'side-by-side' ) {
			return (
				<div className="dataforms-field-diff-side-by-side">
					<div className="dataforms-field-diff-side-by-side__col is-previous">
						<div className="dataforms-field-diff-sublabel">
							{ __( 'Previous' ) }
						</div>
						<div className="dataforms-field-diff-col-value">
							<del>
								<field.render
									item={ previousData }
									field={ field }
								/>
							</del>
						</div>
					</div>
					<div className="dataforms-field-diff-side-by-side__col is-current">
						<div className="dataforms-field-diff-sublabel">
							{ __( 'Current' ) }
						</div>
						<div className="dataforms-field-diff-col-value">
							<ins>
								<field.render item={ data } field={ field } />
							</ins>
						</div>
					</div>
				</div>
			);
		}

		// 'inline' layout
		return (
			<div className="dataforms-field-diff-inline">
				<del className="dataforms-field-diff-previous">
					<field.render item={ previousData } field={ field } />
				</del>
				<span className="dataforms-field-diff-arrow" aria-hidden="true">
					{ ' → ' }
				</span>
				<ins className="dataforms-field-diff-current">
					<field.render item={ data } field={ field } />
				</ins>
			</div>
		);
	}

	if ( status === 'removed' && previousData !== undefined ) {
		return (
			<del className="dataforms-field-diff-removed">
				<field.render item={ previousData } field={ field } />
			</del>
		);
	}

	if ( status === 'added' ) {
		return (
			<ins className="dataforms-field-diff-added">
				<field.render item={ data } field={ field } />
			</ins>
		);
	}

	// 'unchanged' or fallback
	return <field.render item={ data } field={ field } />;
}
