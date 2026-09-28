import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const SCOPE = 'core/dashboard';
const KEY = 'dashboardLayout';

/**
 * Identifier of a dashboard, structured as `<plugin>_<page>` to mirror
 * the underscore form produced by the wp-build pipeline (see
 * `{{PREFIX}}_{{PAGE_SLUG_UNDERSCORE}}` in the page templates).
 */
export type DashboardName = `${ string }_${ string }`;

export interface DashboardLayoutControls {
	canEditSiteLayout: boolean;
	isSiteLayout: boolean;
	saveSiteLayout: ( newLayout: DashboardWidget[] ) => Promise< void >;
	resetSiteLayout: () => Promise< void >;
}

interface SiteLayoutResponse {
	layout: DashboardWidget[];
	is_site_layout: boolean;
	can_edit_site_layout: boolean;
}

/**
 * Hook for managing dashboard layout preferences and site-level persistence.
 *
 * Returns the active layout (user override or site-level base), a setter
 * that writes to personal preferences, a reset action, and controls for
 * managing the site-level layout when authorized.
 *
 * @param dashboardName Identifier of the dashboard as produced by the
 *                      build pipeline. Used as the `{name}` segment of
 *                      the default-layout and layout routes.
 * @return Tuple `[ layout, setLayout, resetLayout, controls ]`.
 */
export function useDashboardLayout(
	dashboardName: DashboardName
): [
	DashboardWidget[],
	( layout: DashboardWidget[] ) => void,
	() => Promise< void >,
	DashboardLayoutControls,
] {
	const userPreference = useSelect(
		( select ) =>
			select( preferencesStore ).get( SCOPE, KEY ) as
				| DashboardWidget[]
				| undefined,
		[]
	);

	const [ siteLayoutData, setSiteLayoutData ] = useState<{
		layout: DashboardWidget[];
		isSiteLayout: boolean;
		canEditSiteLayout: boolean;
	} | null>( null );

	useEffect( () => {
		let isMounted = true;
		apiFetch< SiteLayoutResponse >( {
			path: `/wp/v2/dashboards/${ dashboardName }/layout`,
		} )
			.then( ( response ) => {
				if ( isMounted && response ) {
					setSiteLayoutData( {
						layout: response.layout ?? [],
						isSiteLayout: Boolean( response.is_site_layout ),
						canEditSiteLayout: Boolean(
							response.can_edit_site_layout
						),
					} );
				}
			} )
			.catch( () => {
				// Silently fall back if the site layout endpoint is unreachable.
			} );
		return () => {
			isMounted = false;
		};
	}, [ dashboardName ] );

	const { set } = useDispatch( preferencesStore );

	const layout = userPreference ?? siteLayoutData?.layout ?? [];

	function setLayout( newLayout: DashboardWidget[] ) {
		void set( SCOPE, KEY, newLayout );
	}

	async function resetLayout() {
		void set( SCOPE, KEY, undefined );

		try {
			const fresh = ( await apiFetch( {
				path: `/wp/v2/dashboards/${ dashboardName }/layout`,
			} ) ) as SiteLayoutResponse;

			if ( fresh?.layout ) {
				setSiteLayoutData( ( prev ) => ( {
					layout: fresh.layout,
					isSiteLayout: Boolean( fresh.is_site_layout ),
					canEditSiteLayout: prev?.canEditSiteLayout ?? false,
				} ) );
			}
		} catch {
			// Fallback to legacy default-layout if layout endpoint fails.
			const fallback = ( await apiFetch( {
				path: `/wp/v2/dashboards/${ dashboardName }/default-layout`,
			} ) ) as DashboardWidget[];
			void set( SCOPE, KEY, fallback );
		}
	}

	async function saveSiteLayout( newLayout: DashboardWidget[] ) {
		const response = await apiFetch< SiteLayoutResponse >( {
			path: `/wp/v2/dashboards/${ dashboardName }/layout`,
			method: 'POST',
			data: { layout: newLayout },
		} );

		setSiteLayoutData( {
			layout: response.layout,
			isSiteLayout: true,
			canEditSiteLayout: true,
		} );
		// Clear personal preference override so the site layout is rendered.
		void set( SCOPE, KEY, undefined );
	}

	async function resetSiteLayout() {
		const response = await apiFetch< SiteLayoutResponse >( {
			path: `/wp/v2/dashboards/${ dashboardName }/layout`,
			method: 'DELETE',
		} );

		setSiteLayoutData( {
			layout: response.layout,
			isSiteLayout: false,
			canEditSiteLayout: Boolean( response.can_edit_site_layout ),
		} );
		void set( SCOPE, KEY, undefined );
	}

	const controls: DashboardLayoutControls = {
		canEditSiteLayout: Boolean( siteLayoutData?.canEditSiteLayout ),
		isSiteLayout: Boolean( siteLayoutData?.isSiteLayout ),
		saveSiteLayout,
		resetSiteLayout,
	};

	return [ layout, setLayout, resetLayout, controls ];
}
