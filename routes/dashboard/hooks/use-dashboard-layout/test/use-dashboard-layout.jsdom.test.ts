import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import type { DashboardWidget } from '@wordpress/widget-dashboard';
import { useDashboardLayout } from '../';

vi.mock( import( '@wordpress/api-fetch' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn(),
	} as unknown as typeof original;
} );

const mockedApiFetch = vi.mocked( apiFetch );

const SCOPE = 'core/dashboard';
const KEY = 'dashboardLayout';
const DASHBOARD_NAME = 'gutenberg_dashboard';

const SAMPLE_LAYOUT: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/quick-draft' },
	{ uuid: 'b', type: 'core/at-a-glance' },
];

const DEFAULT_LAYOUT: DashboardWidget[] = [
	{ uuid: 'default-hello-world-widget-instance', type: 'core/hello-world' },
];

describe( 'useDashboardLayout', () => {
	beforeEach( () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, undefined );
		mockedApiFetch.mockReset();
	} );

	it( 'returns an empty array when nothing is persisted', () => {
		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);
		const [ layout ] = result.current;
		expect( layout ).toEqual( [] );
	} );

	it( 'persists updates written through setLayout', () => {
		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);

		act( () => {
			const [ , setLayout ] = result.current;
			setLayout( SAMPLE_LAYOUT );
		} );

		const [ layout ] = result.current;
		expect( layout ).toEqual( SAMPLE_LAYOUT );
	} );

	it( 'reads the layout written from outside the hook', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, SAMPLE_LAYOUT );

		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);
		const [ layout ] = result.current;
		expect( layout ).toEqual( SAMPLE_LAYOUT );
	} );

	it( 'restores the layout via resetLayout', async () => {
		mockedApiFetch.mockResolvedValueOnce( {
			layout: DEFAULT_LAYOUT,
			is_site_layout: false,
			can_edit_site_layout: false,
		} );

		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);

		act( () => {
			const [ , setLayout ] = result.current;
			setLayout( SAMPLE_LAYOUT );
		} );

		await act( async () => {
			const [ , , resetLayout ] = result.current;
			await resetLayout();
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: `/wp/v2/dashboards/${ DASHBOARD_NAME }/layout`,
		} );

		const [ layout ] = result.current;
		expect( layout ).toEqual( DEFAULT_LAYOUT );
	} );

	it( 'saves site-level layout via saveSiteLayout', async () => {
		mockedApiFetch.mockResolvedValueOnce( {
			layout: SAMPLE_LAYOUT,
			is_site_layout: true,
			can_edit_site_layout: true,
		} );

		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);

		await act( async () => {
			const [ , , , controls ] = result.current;
			await controls.saveSiteLayout( SAMPLE_LAYOUT );
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: `/wp/v2/dashboards/${ DASHBOARD_NAME }/layout`,
			method: 'POST',
			data: { layout: SAMPLE_LAYOUT },
		} );

		const [ layout, , , controls ] = result.current;
		expect( layout ).toEqual( SAMPLE_LAYOUT );
		expect( controls.isSiteLayout ).toBe( true );
	} );

	it( 'resets site-level layout via resetSiteLayout', async () => {
		mockedApiFetch.mockResolvedValueOnce( {
			layout: DEFAULT_LAYOUT,
			is_site_layout: false,
			can_edit_site_layout: true,
		} );

		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);

		await act( async () => {
			const [ , , , controls ] = result.current;
			await controls.resetSiteLayout();
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: `/wp/v2/dashboards/${ DASHBOARD_NAME }/layout`,
			method: 'DELETE',
		} );

		const [ layout, , , controls ] = result.current;
		expect( layout ).toEqual( DEFAULT_LAYOUT );
		expect( controls.isSiteLayout ).toBe( false );
	} );
} );
