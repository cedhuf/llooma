<script lang="ts">
	import LL from '$i18n/i18n-svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { chatDefaultsConfig } from '$lib/chatDefaults';
	import ButtonCopy from '$lib/components/ButtonCopy.svelte';
	import Kbd from '$lib/components/Kbd.svelte';
	import ModelSelect from '$lib/components/ModelSelect.svelte';
	import { modKey } from '$lib/platform';

	import SettingsField from './SettingsField.svelte';
	import SettingsHint from './SettingsHint.svelte';
	import SettingsSection from './SettingsSection.svelte';

	/** Read-only, and written from the handlers rather than from memory: a shortcut list that drifts from the code teaches the wrong thing. Each group names where its keys are handled. */

	const mod = $derived(modKey());

	let searchModel = $state($chatDefaultsConfig.defaultModel.value);

	/** `%s` stays as typed: it is where the browser puts the words. */
	const searchLink = $derived(
		searchModel
			? `${page.url.origin}${resolve('/sessions')}?q=%s` +
					`&model=${encodeURIComponent(searchModel.name)}` +
					`&server=${encodeURIComponent(searchModel.serverId)}`
			: ''
	);

	interface Shortcut {
		keys: string[];
		label: string;
	}

	const groups = $derived<{ title: string; shortcuts: Shortcut[]; note?: string }[]>([
		{
			// src/routes/+layout.svelte
			title: $LL.shortcutsGlobal(),
			shortcuts: [{ keys: [mod, 'K'], label: $LL.searchConversations() }]
		},
		{
			// src/routes/sessions/[id]/Prompt.svelte
			title: $LL.shortcutsComposer(),
			shortcuts: [
				{ keys: ['↵'], label: $LL.shortcutSendMessage() },
				{ keys: ['⇧', '↵'], label: $LL.shortcutNewLine() }
			],
			note: $LL.shortcutExpandedNote({ mod })
		},
		{
			// src/routes/sessions/[id]/Prompt.svelte + SlashMenu.svelte
			title: $LL.shortcutsCommands(),
			shortcuts: [
				{ keys: ['↑', '↓'], label: $LL.searchNavigate() },
				{ keys: ['⇥'], label: $LL.shortcutCompleteCommand() },
				{ keys: ['↵'], label: $LL.slashRun() },
				{ keys: ['esc'], label: $LL.searchClose() }
			],
			note: $LL.shortcutCommandsNote()
		},
		{
			// src/lib/components/SearchModal.svelte
			title: $LL.shortcutsSearch(),
			shortcuts: [
				{ keys: ['↑', '↓'], label: $LL.searchNavigate() },
				{ keys: ['↵'], label: $LL.searchOpen() },
				{ keys: ['esc'], label: $LL.searchClose() }
			]
		},
		{
			// src/routes/settings/SettingsModal.svelte
			title: $LL.shortcutsDialogs(),
			shortcuts: [
				{ keys: ['↑', '↓'], label: $LL.shortcutMoveBetweenTabs() },
				{ keys: ['esc'], label: $LL.searchClose() }
			]
		}
	]);
</script>

<SettingsSection
	title={$LL.keyboardShortcuts()}
	description={$LL.keyboardShortcutsDescription()}
	card
>
	<div class="flex flex-col gap-4">
		{#each groups as group (group.title)}
			<div class="flex flex-col gap-1.5">
				<h4 class="text-muted text-xs font-medium tracking-wide uppercase">{group.title}</h4>

				{#each group.shortcuts as shortcut (shortcut.label)}
					<!-- Label left, keys right: the eye scans the actions, and only stops on the
					     keys for the one it wants. -->
					<div class="flex items-baseline gap-3 text-sm">
						<span class="min-w-0 flex-1 truncate">{shortcut.label}</span>
						<span class="flex shrink-0 items-center gap-1">
							{#each shortcut.keys as key (key)}
								<Kbd>{key}</Kbd>
							{/each}
						</span>
					</div>
				{/each}

				{#if group.note}
					<p class="text-muted text-xs leading-snug">{group.note}</p>
				{/if}
			</div>
		{/each}
	</div>
</SettingsSection>

<SettingsSection
	title={$LL.searchShortcutTitle()}
	description={$LL.searchShortcutDescription()}
	card
>
	<SettingsField label={$LL.model()}>
		<ModelSelect bind:value={searchModel} />
	</SettingsField>
	{#if searchLink}
		<div class="flex items-center gap-2">
			<input
				class="settings-field min-w-0 flex-1 font-mono text-xs"
				readonly
				value={searchLink}
				aria-label={$LL.searchShortcutTitle()}
			/>
			<ButtonCopy content={searchLink} />
		</div>
	{/if}
	<SettingsHint>{$LL.searchShortcutHint()}</SettingsHint>
</SettingsSection>
