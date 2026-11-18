import { build, defineConfig, parse } from '@terrazzo/parser';
import { describe, expect, it } from 'vitest';
import pluginBreakpoints from '../index.ts';

describe( '@wordpress/terrazzo-plugin-breakpoints', () => {
	it( 'generates sorted TypeScript constants and CSS @custom-media queries from breakpoint tokens', async () => {
		const cwd = new URL( 'file:///virtual/' );
		const config = defineConfig(
			{
				lint: { rules: { 'core/consistent-naming': [ 'off', {} ] } },
				plugins: [ pluginBreakpoints() ],
			},
			{ cwd }
		);
		const tokenSource = {
			'wpds-breakpoint': {
				$type: 'dimension',
				lg: { $value: { value: 960, unit: 'px' } },
				xs: { $value: { value: 480, unit: 'px' } },
				md: { $value: { value: 782, unit: 'px' } },
			},
		};

		const { tokens, sources, resolver } = await parse(
			[
				{
					filename: new URL( 'breakpoint.json', cwd ),
					src: JSON.stringify( tokenSource ),
				},
			],
			{ config }
		);
		const { outputFiles } = await build( tokens, {
			sources,
			resolver,
			config,
		} );

		const tsFile = outputFiles.find(
			( file ) => file.filename === 'src/prebuilt/ts/breakpoints.ts'
		);
		const cssFile = outputFiles.find(
			( file ) => file.filename === 'prebuilt/css/breakpoints.css'
		);

		expect( tsFile?.contents ).toContain( '"xs": 480,' );
		expect( tsFile?.contents ).toContain( '"md": 782,' );
		expect( tsFile?.contents ).toContain( '"lg": 960,' );
		expect( tsFile?.contents ).toContain(
			'export const BREAKPOINT_ORDER: readonly Breakpoint[] = [ "xs", "md", "lg" ];'
		);

		expect( cssFile?.contents ).toContain(
			'@custom-media --wpds-breakpoint-xs (min-width: 480px);'
		);
		expect( cssFile?.contents ).toContain(
			'@custom-media --wpds-breakpoint-md (min-width: 782px);'
		);
		expect( cssFile?.contents ).toContain(
			'@custom-media --wpds-breakpoint-lg (min-width: 960px);'
		);
	} );
} );
