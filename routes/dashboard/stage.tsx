import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as viewportStore } from '@wordpress/viewport';
import {
	WidgetDashboard,
	type DashboardOperationRequest,
	type DashboardWidget,
} from '@wordpress/widget-dashboard';
import {
	useWidgetTypes,
	type WidgetModuleRecord,
} from '@wordpress/widget-primitives';
import { registerDashboardFieldTypes } from './field-types';
import { useDashboardGridSettings, useDashboardLayout } from './hooks';
import { DashboardWidgetHostProvider } from './widget-host';

registerDashboardFieldTypes();

function Dashboard() {
	const [ layout, setLayout, resetLayout, controls ] = useDashboardLayout(
		'gutenberg_dashboard'
	);

	const gridSettings = useDashboardGridSettings();

	const widgetsModules = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'root', 'widgetModule' ) as
				WidgetModuleRecord[] | null,
		[]
	);

	const [ widgetTypes, isResolving ] = useWidgetTypes( widgetsModules );

	const [ editMode, setEditMode ] = useState( false );

	// @TODO: switch to using Admin UI declaratively for mobile viewport support once available.
	// https://github.com/WordPress/gutenberg/issues/77628
	const isMobileViewport = useSelect(
		( select ) => select( viewportStore ).isViewportMatch( '< small' ),
		[]
	);

	const { createSuccessNotice } = useDispatch( noticesStore );

	const handleLayoutChange = async ( next: DashboardWidget[] ) => {
		if ( controls.canEditSiteLayout ) {
			try {
				await controls.saveSiteLayout( next );
				void createSuccessNotice( __( 'Site dashboard saved.' ), {
					type: 'snackbar',
				} );
				return;
			} catch {
				// Fall back to personal layout preference if site update fails.
			}
		}

		setLayout( next );
		void createSuccessNotice( __( 'Dashboard saved.' ), {
			type: 'snackbar',
		} );
	};

	const canPerform = useCallback(
		( request: DashboardOperationRequest ): boolean => {
			if ( 'operation' in request ) {
				if ( request.operation === 'remove' ) {
					// Instance-level lock policy: locked widgets cannot be removed.
					if ( Boolean( request.widget.attributes?.locked ) ) {
						return false;
					}
				}
			}
			return true;
		},
		[]
	);

	const pageTitle = editMode
		? __( 'Customize Dashboard' )
		: __( 'Dashboard' );

	return (
		<DashboardWidgetHostProvider>
			<WidgetDashboard.Policy canPerform={ canPerform }>
				<WidgetDashboard
					widgetTypes={ widgetTypes }
					isResolvingWidgetTypes={ isResolving }
					layout={ layout }
					onLayoutChange={ handleLayoutChange }
					onLayoutReset={
						controls.canEditSiteLayout
							? controls.resetSiteLayout
							: resetLayout
					}
					gridSettings={ gridSettings }
					editMode={ editMode }
					onEditChange={ setEditMode }
				>
					<Page
						breadcrumbs={
							editMode && isMobileViewport ? undefined : (
								<Breadcrumbs items={ [ { label: pageTitle } ] } />
							)
						}
						ariaLabel={ pageTitle }
						actions={ <WidgetDashboard.Actions /> }
						hasPadding
					>
						<WidgetDashboard.NoWidgetsState />
						<WidgetDashboard.Widgets />
					</Page>

					<WidgetDashboard.Commands />
				</WidgetDashboard>
			</WidgetDashboard.Policy>
		</DashboardWidgetHostProvider>
	);
}

export const stage = Dashboard;
