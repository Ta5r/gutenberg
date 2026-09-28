import clsx from 'clsx';
import type { MouseEventHandler } from 'react';
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';
import { useRegistry } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu, Stack } from '@wordpress/ui';
import { kebabCase } from '@wordpress/kebab-case';
import type { Action, ActionModal as ActionModalType } from '../../types';

export interface ActionTriggerProps< Item > {
	action: Action< Item >;
	onClick: MouseEventHandler;
	isBusy?: boolean;
	items: Item[];
	variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
	actionsLayout?: 'text' | 'button';
}

export interface ActionModalProps< Item > {
	action: ActionModalType< Item >;
	items: Item[];
	closeModal: () => void;
}

interface ActionsMenuGroupProps< Item > {
	actions: Action< Item >[];
	item: Item;
	registry: ReturnType< typeof useRegistry >;
	setActiveModalAction: ( action: ActionModalType< Item > | null ) => void;
}

interface ItemActionsProps< Item > {
	item: Item;
	actions: Action< Item >[];
	isCompact?: boolean;
	actionsLayout?: 'text' | 'button';
}

interface CompactItemActionsProps< Item > {
	item: Item;
	actions: Action< Item >[];
	isSmall?: boolean;
	registry: ReturnType< typeof useRegistry >;
}

interface PrimaryActionsProps< Item > {
	item: Item;
	actions: Action< Item >[];
	registry: ReturnType< typeof useRegistry >;
	buttonVariant?: 'primary' | 'secondary' | 'tertiary' | 'link';
	actionsLayout?: 'text' | 'button';
}

function ButtonTrigger< Item >( {
	action,
	onClick,
	items,
	variant,
	actionsLayout,
}: ActionTriggerProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	let computedVariant = variant;
	if ( actionsLayout === 'button' ) {
		computedVariant =
			action.variant === 'button-outline' ? 'secondary' : 'primary';
	}
	return (
		<Button
			disabled={ !! action.disabled }
			accessibleWhenDisabled
			size="compact"
			variant={ computedVariant }
			onClick={ onClick }
		>
			{ label }
		</Button>
	);
}

function MenuItemTrigger< Item >( {
	action,
	onClick,
	items,
}: ActionTriggerProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Menu.Item disabled={ action.disabled } onClick={ onClick }>
			<Menu.ItemLabel>{ label }</Menu.ItemLabel>
		</Menu.Item>
	);
}

export function ActionModal< Item >( {
	action,
	items,
	closeModal,
}: ActionModalProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );

	const modalHeader =
		typeof action.modalHeader === 'function'
			? action.modalHeader( items )
			: action.modalHeader;
	return (
		<Modal
			title={ modalHeader || label }
			__experimentalHideHeader={ !! action.hideModalHeader }
			onRequestClose={ closeModal }
			focusOnMount={ action.modalFocusOnMount ?? true }
			size={ action.modalSize || 'medium' }
			overlayClassName={ `dataviews-action-modal dataviews-action-modal__${ kebabCase(
				action.id
			) }` }
		>
			<action.RenderModal items={ items } closeModal={ closeModal } />
		</Modal>
	);
}

export function ActionsMenuGroup< Item >( {
	actions,
	item,
	registry,
	setActiveModalAction,
}: ActionsMenuGroupProps< Item > ) {
	const { primaryActions, regularActions } = useMemo( () => {
		return actions.reduce(
			( acc, action ) => {
				( action.isPrimary
					? acc.primaryActions
					: acc.regularActions
				).push( action );
				return acc;
			},
			{
				primaryActions: [] as Action< Item >[],
				regularActions: [] as Action< Item >[],
			}
		);
	}, [ actions ] );

	const renderActionGroup = ( actionList: Action< Item >[] ) =>
		actionList.map( ( action ) => (
			<MenuItemTrigger
				key={ action.id }
				action={ action }
				onClick={ () => {
					if ( 'RenderModal' in action ) {
						setActiveModalAction( action );
						return;
					}
					action.callback( [ item ], { registry } );
				} }
				items={ [ item ] }
			/>
		) );

	return (
		<Menu.Group>
			{ renderActionGroup( primaryActions ) }
			{ renderActionGroup( regularActions ) }
		</Menu.Group>
	);
}

export default function ItemActions< Item >( {
	item,
	actions,
	isCompact,
	actionsLayout = 'text',
}: ItemActionsProps< Item > ) {
	const registry = useRegistry();
	const { primaryActions, eligibleActions } = useMemo( () => {
		// If an action is eligible for all items, doesn't need
		// to provide the `isEligible` function.
		const _eligibleActions = actions.filter(
			( action ) => ! action.isEligible || action.isEligible( item )
		);
		const _primaryActions = _eligibleActions.filter(
			( action ) => action.isPrimary
		);
		return {
			primaryActions: _primaryActions,
			eligibleActions: _eligibleActions,
		};
	}, [ actions, item ] );

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( isCompact ) {
		return (
			<CompactItemActions
				item={ item }
				actions={ eligibleActions }
				isSmall
				registry={ registry }
			/>
		);
	}

	return (
		<Stack
			direction="row"
			justify="flex-end"
			className={ clsx( 'dataviews-item-actions', {
				'has-button-actions': actionsLayout === 'button',
			} ) }
			style={ {
				flexShrink: 0,
				width: 'auto',
			} }
		>
			<PrimaryActions
				item={ item }
				actions={ primaryActions }
				registry={ registry }
				actionsLayout={ actionsLayout }
			/>
			{ ( primaryActions.length < eligibleActions.length ||
				// Since we hide primary actions on mobile, we need to show the menu
				// there if there are any actions at all.
				( actionsLayout !== 'button' && isMobileViewport ) ) && (
				<CompactItemActions
					item={ item }
					actions={ eligibleActions }
					registry={ registry }
				/>
			) }
		</Stack>
	);
}

function CompactItemActions< Item >( {
	item,
	actions,
	isSmall,
	registry,
}: CompactItemActionsProps< Item > ) {
	const [ activeModalAction, setActiveModalAction ] = useState(
		null as ActionModalType< Item > | null
	);
	return (
		<>
			{ /* The `disabled` prop on `Menu.Root` (rather than on the trigger)
			     keeps the menu from opening while letting the trigger button
			     stay focusable via its own `accessibleWhenDisabled`. */ }
			<Menu.Root disabled={ ! actions.length }>
				<Menu.Trigger
					render={
						<Button
							size={ isSmall ? 'small' : 'compact' }
							icon={ moreVertical }
							label={ __( 'Actions' ) }
							accessibleWhenDisabled
							disabled={ ! actions.length }
							className="dataviews-all-actions-button"
						/>
					}
				/>
				<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
					<ActionsMenuGroup
						actions={ actions }
						item={ item }
						registry={ registry }
						setActiveModalAction={ setActiveModalAction }
					/>
				</Menu.Popup>
			</Menu.Root>
			{ !! activeModalAction && (
				<ActionModal
					action={ activeModalAction }
					items={ [ item ] }
					closeModal={ () => setActiveModalAction( null ) }
				/>
			) }
		</>
	);
}

export function PrimaryActions< Item >( {
	item,
	actions,
	registry,
	buttonVariant,
	actionsLayout = 'text',
}: PrimaryActionsProps< Item > ) {
	const [ activeModalAction, setActiveModalAction ] = useState( null as any );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( actionsLayout !== 'button' && isMobileViewport ) {
		return null;
	}

	if ( ! Array.isArray( actions ) || actions.length === 0 ) {
		return null;
	}
	return (
		<>
			{ actions.map( ( action ) => (
				<ButtonTrigger
					key={ action.id }
					action={ action }
					onClick={ () => {
						if ( 'RenderModal' in action ) {
							setActiveModalAction( action );
							return;
						}
						action.callback( [ item ], { registry } );
					} }
					items={ [ item ] }
					variant={ buttonVariant }
					actionsLayout={ actionsLayout }
				/>
			) ) }
			{ !! activeModalAction && (
				<ActionModal
					action={ activeModalAction }
					items={ [ item ] }
					closeModal={ () => setActiveModalAction( null ) }
				/>
			) }
		</>
	);
}
