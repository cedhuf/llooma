<script lang="ts">
	import {
		ArrowLeft,
		Bot,
		Database,
		Info,
		LogOut,
		MessageSquare,
		MessageSquareQuote,
		Mic,
		Server,
		Settings2,
		Shield,
		User,
		UsersRound,
		Wrench,
		X
	} from '@lucide/svelte';
	import { Tabs } from 'bits-ui';
	import type { Component } from 'svelte';

	import LL from '$i18n/i18n-svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { integrationsConfig } from '$lib/integrationsConfig';
	import { currentUser } from '$lib/stores/auth';
	import { hasAccounts } from '$lib/stores/instance';
	import { settingsBack, settingsModalOpen } from '$lib/stores/modal';

	import Admin from './Admin.svelte';
	import BotIntegrations from './BotIntegrations.svelte';
	import Chat from './Chat.svelte';
	import DataManagement from './DataManagement.svelte';
	import Interface from './Interface.svelte';
	import Profile from './Profile.svelte';
	import Prompts from './Prompts.svelte';
	import ServerConnections from './ServerConnections.svelte';
	import Tools from './Tools.svelte';
	import Users from './Users.svelte';
	import Version from './Version.svelte';
	import Voice from './Voice.svelte';

	const isAdmin = $derived($currentUser?.role === 'admin');

	let activeTab = $state('profile');

	interface Tab {
		id: string;
		label: string;
		icon: Component<{ class?: string }>;
		panel: Component;
		visible?: boolean;
	}

	const tabs = $derived<Tab[]>(
		[
			{ id: 'profile', label: $LL.profile(), icon: User, panel: Profile },
			{ id: 'servers', label: $LL.servers(), icon: Server, panel: ServerConnections },
			{ id: 'admin', label: 'Admin', icon: Shield, panel: Admin, visible: isAdmin },
			// Beside Admin and gated the same way, because it is the other half of running
			// an instance: Admin is how it behaves, this is who is on it. Unlike Admin, it
			// goes away where nobody signs in.
			{
				id: 'users',
				label: $LL.users(),
				icon: UsersRound,
				panel: Users,
				visible: $hasAccounts && isAdmin
			},
			{ id: 'chat', label: 'Chat', icon: MessageSquare, panel: Chat },
			{ id: 'tools', label: 'Tools', icon: Wrench, panel: Tools },
			// Beside Tools rather than inside it: a bot answering on another server is not a
			// capability of a conversation, it is a place this instance answers from.
			//
			// Only where the instance has granted it: a bot answers on its own and spends on
			// every message it is sent.
			{
				id: 'bots',
				label: $LL.botIntegrations(),
				icon: Bot,
				panel: BotIntegrations,
				visible: $integrationsConfig.canManage
			},
			// Its own tab for the same reason Prompts has one: two models, each with a
			// switch and a voice, the language and the parameters still to come, and the
			// loop's own behaviour underneath.
			{ id: 'voice', label: $LL.voiceTab(), icon: Mic, panel: Voice },
			// Its own tab rather than a section of Tools: twenty prompts folded into one
			// dropdown at the bottom of a long scroll is a feature nobody finds.
			{ id: 'prompts', label: $LL.promptsTab(), icon: MessageSquareQuote, panel: Prompts },
			{ id: 'interface', label: $LL.interface(), icon: Settings2, panel: Interface },
			{ id: 'data', label: 'Data', icon: Database, panel: DataManagement },
			{ id: 'version', label: 'About', icon: Info, panel: Version }
		].filter((t) => t.visible !== false)
	);

	const Panel = $derived(tabs.find((tab) => tab.id === activeTab)?.panel);
</script>

<Modal bind:open={$settingsModalOpen} closeButton={false} size="large">
	<Tabs.Root bind:value={activeTab} orientation="vertical" class="flex w-full flex-col sm:flex-row">
		<div
			class="border-shade-2 bg-shade-0 flex shrink-0 flex-col border-b sm:w-48 sm:border-r sm:border-b-0"
		>
			<!-- Title at left, the same height as the panel header on the right. -->
			<div
				class="border-shade-2 flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3"
			>
				<div class="text-muted flex items-center gap-2 text-sm font-semibold">
					<Settings2 class="h-4 w-4" />
					{$LL.settings()}
				</div>
				<!-- The panel-side close is desktop-only, so the mobile close lives here. -->
				<button
					type="button"
					onclick={() => ($settingsModalOpen = false)}
					aria-label="Close"
					class="text-muted hover:bg-shade-2 hover:text-active rounded-md p-1.5 transition-colors sm:hidden"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<Tabs.List
				aria-label={$LL.settings()}
				class="flex touch-pan-x gap-1 overflow-x-auto p-2 sm:flex-1 sm:touch-auto sm:flex-col sm:overflow-visible sm:p-3"
			>
				{#each tabs as tab (tab.id)}
					{@const Icon = tab.icon}
					{@const active = activeTab === tab.id}
					<Tabs.Trigger
						value={tab.id}
						class="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors {active
							? 'bg-accent/10 text-accent font-medium'
							: 'hover:bg-shade-2 text-body'}"
					>
						<Icon class="h-4 w-4 shrink-0" />
						{tab.label}
					</Tabs.Trigger>
				{/each}

				{#if $hasAccounts}
					<form method="POST" action="/auth/signout" class="shrink-0 sm:mt-auto">
						<input type="hidden" name="callbackUrl" value="/login" />
						<button
							type="submit"
							class="text-muted hover:bg-shade-2 hover:text-active flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
						>
							<LogOut class="h-4 w-4 shrink-0" />
							Sign out
						</button>
					</form>
				{/if}
			</Tabs.List>
		</div>

		<!-- Matching-height header carrying the close, aligned with the sidebar title.
		     `min-h-0` so the flex-1 panel stays bounded in the mobile column layout,
		     letting the inner content scroll instead of overflowing. -->
		<div class="flex min-h-0 min-w-0 flex-1 flex-col">
			<!-- Empty on desktop but for the close button, which is why it is hidden on
			     mobile. A sub-view publishing a way back gives it something to hold, so it
			     appears at every width rather than stranding a phone in the sub-view. -->
			<div
				class="border-shade-2 h-12 shrink-0 items-center justify-between border-b px-3 {$settingsBack
					? 'flex'
					: 'hidden sm:flex'}"
			>
				{#if $settingsBack}
					<button
						type="button"
						onclick={$settingsBack.onBack}
						class="text-muted hover:bg-shade-2 hover:text-active flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors"
					>
						<ArrowLeft class="h-4 w-4" />
						{$settingsBack.label}
					</button>
				{:else}
					<span></span>
				{/if}

				<!-- Mobile already has a close in the sidebar header; a second one here would
				     sit a thumb's width from the back button. -->
				<button
					type="button"
					onclick={() => ($settingsModalOpen = false)}
					aria-label="Close"
					class="text-muted hover:bg-shade-2 hover:text-active hidden rounded-md p-1.5 transition-colors sm:block"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
			<Tabs.Content value={activeTab} class="flex-1 overflow-auto p-4 outline-none">
				<Panel />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</Modal>
