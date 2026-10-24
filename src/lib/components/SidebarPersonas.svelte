<script lang="ts">
	import LL from '$i18n/i18n-svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { sessionsStore, settingsStore } from '$lib/localStorage';
	import { launchPersona, unbindPersonaSession, type Persona } from '$lib/personas';
	import { formatTimestampToNow } from '$lib/utils';

	import ContextMenu from './ContextMenu.svelte';
	import PersonaAvatar from './PersonaAvatar.svelte';
	import Popover from './Popover.svelte';
	import SessionMenu from './SessionMenu.svelte';

	interface Props {
		personas: Persona[];
		/** The folded column: one avatar under the other, names in the tooltip. Open, the shape the settings ask for. */
		rail?: boolean;
	}

	let { personas, rail = false }: Props = $props();

	const pathname = $derived(page.url.pathname);
	const isActive = (persona: Persona) =>
		!!persona.sessionId && pathname.includes(persona.sessionId);

	const stack = $derived($settingsStore.sidebarPersonasStyle !== 'list');

	/** Faces in the stack before it says how many more there are. */
	const STACKED = 5;
	const stacked = $derived(personas.slice(0, STACKED));
	let panelOpen = $state(false);

	/** Rows shown before the group folds the rest behind a toggle. */
	const SHOWN = 5;
	let showAll = $state(false);
	const listed = $derived(showAll ? personas : personas.slice(0, SHOWN));

	async function launch(persona: Persona) {
		panelOpen = false;
		const id = await launchPersona(persona, $settingsStore.models);
		goto(resolve('/sessions/[id]', { id }));
	}

	/**
	 * A launcher is a conversation, so it answers a right-click like one, plus the
	 * one thing only a persona has: ending it. That is not deletion and must not
	 * read as it, so they are separate entries with the destructive one last.
	 *
	 * Drawn only once the persona has a conversation.
	 */
	const sessionOf = (persona: Persona) =>
		persona.sessionId
			? ($sessionsStore ?? []).find((session) => session.id === persona.sessionId)
			: undefined;

	function endConversation(persona: Persona) {
		unbindPersonaSession(persona.sessionId ?? '');
	}

	function deleteConversation(persona: Persona) {
		if (!persona.sessionId) return;
		const isOpen = pathname.includes(persona.sessionId);
		sessionsStore.remove(persona.sessionId);
		unbindPersonaSession(persona.sessionId);
		if (isOpen) void goto(resolve('/sessions'));
	}
</script>

{#snippet launcher(persona: Persona)}
	{@const session = sessionOf(persona)}
	<ContextMenu>
		{#snippet trigger({ props })}
			<button
				{...props}
				type="button"
				onclick={() => launch(persona)}
				title={persona.name}
				aria-label={persona.name}
				class="persona-launcher group flex rounded-full p-1 outline-none"
			>
				<!-- The vertical padding leaves room for the ring, drawn outside the avatar. -->
				<span
					class="ring-offset-shade-1 relative inline-flex rounded-full ring-offset-2 transition duration-150 group-hover:scale-105 motion-reduce:transition-none {isActive(
						persona
					)
						? 'ring-accent ring-2'
						: 'group-hover:ring-shade-4 group-focus-visible:ring-accent group-hover:ring-2 group-focus-visible:ring-2'}"
				>
					<PersonaAvatar {persona} size={32} />
				</span>
			</button>
		{/snippet}

		{#if session}
			<SessionMenu
				id={session.id}
				pinned={session.pinned}
				archived={session.archived}
				onClose={() => endConversation(persona)}
				onDelete={() => deleteConversation(persona)}
			/>
		{/if}
	</ContextMenu>
{/snippet}

{#if personas.length > 0}
	{#if rail}
		<div class="flex flex-col items-center gap-1 px-2 pt-1 pb-2">
			{#each personas as persona (persona.id)}
				{@render launcher(persona)}
			{/each}
		</div>
	{:else if stack}
		<div class="px-2 pb-2">
			<Popover side="right" align="start" class="w-80 p-1.5" bind:open={panelOpen}>
				{#snippet trigger({ props })}
					<button
						{...props}
						type="button"
						class="flex h-10 w-full items-center gap-3 rounded-lg pr-2 pl-3 text-sm transition-colors {panelOpen
							? 'bg-shade-0 text-active'
							: 'hover:bg-shade-0 hover:text-active'}"
					>
						<!-- Each face is ringed in the column's own colour, which is what separates
						     one from the next where they overlap. -->
						<span class="flex shrink-0 -space-x-2">
							{#each stacked as persona (persona.id)}
								<span
									class="inline-flex rounded-full ring-2 {isActive(persona)
										? 'ring-accent'
										: 'ring-shade-1'}"
								>
									<PersonaAvatar {persona} size={24} />
								</span>
							{/each}
						</span>
						<span class="truncate">{$LL.personas()}</span>
						{#if personas.length > STACKED}
							<span class="text-muted ml-auto shrink-0 text-xs">+{personas.length - STACKED}</span>
						{/if}
					</button>
				{/snippet}

				<p class="text-muted px-2 pt-1 pb-1.5 text-xs font-medium">
					{$LL.personas()} · {personas.length}
				</p>
				<!-- Who they are and when you last spoke, so the panel answers "which one" before
				     the click rather than after. -->
				<div class="flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto">
					{#each personas as persona (persona.id)}
						{@const session = sessionOf(persona)}
						<ContextMenu>
							{#snippet trigger({ props })}
								<button
									{...props}
									type="button"
									onclick={() => launch(persona)}
									class="persona-launcher flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors {isActive(
										persona
									)
										? 'bg-shade-1'
										: 'hover:bg-shade-1'}"
								>
									<PersonaAvatar {persona} size={32} />
									<span class="flex min-w-0 flex-1 flex-col">
										<span class="flex items-baseline gap-2">
											<span class="text-active truncate text-sm font-medium">{persona.name}</span>
											{#if session?.updatedAt}
												<span class="text-muted ml-auto shrink-0 text-[11px]">
													{formatTimestampToNow(session.updatedAt)}
												</span>
											{/if}
										</span>
										{#if persona.tagline}
											<span class="text-muted line-clamp-2 text-xs">{persona.tagline}</span>
										{/if}
									</span>
								</button>
							{/snippet}

							{#if session}
								<SessionMenu
									id={session.id}
									pinned={session.pinned}
									archived={session.archived}
									onClose={() => endConversation(persona)}
									onDelete={() => deleteConversation(persona)}
								/>
							{/if}
						</ContextMenu>
					{/each}
				</div>
			</Popover>
		</div>
	{:else}
		<!-- People you talk to rather than things you launch: one row each, read like
		     the conversations below and scrolled with them. -->
		<div class="px-2 pb-2">
			<p class="text-muted px-2.5 pt-2 pb-1 text-xs font-medium">{$LL.personas()}</p>
			<div class="flex flex-col gap-0.5">
				{#each listed as persona (persona.id)}
					{@const session = sessionOf(persona)}
					<ContextMenu>
						{#snippet trigger({ props })}
							<button
								{...props}
								type="button"
								onclick={() => launch(persona)}
								title={persona.tagline || persona.name}
								class="persona-launcher flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors {isActive(
									persona
								)
									? 'bg-shade-0 text-active'
									: 'hover:bg-shade-0 hover:text-active'}"
							>
								<PersonaAvatar {persona} size={20} />
								<span class="shrink-0 {isActive(persona) ? 'font-medium' : ''}">{persona.name}</span
								>
								{#if persona.tagline}
									<span class="text-muted min-w-0 truncate text-xs">{persona.tagline}</span>
								{/if}
							</button>
						{/snippet}

						{#if session}
							<SessionMenu
								id={session.id}
								pinned={session.pinned}
								archived={session.archived}
								onClose={() => endConversation(persona)}
								onDelete={() => deleteConversation(persona)}
							/>
						{/if}
					</ContextMenu>
				{/each}
			</div>
			{#if personas.length > SHOWN}
				<button
					type="button"
					onclick={() => (showAll = !showAll)}
					class="text-muted hover:text-active px-2.5 py-1 text-xs transition-colors"
				>
					{showAll ? $LL.showLess() : `${$LL.showMore()} (${personas.length - SHOWN})`}
				</button>
			{/if}
		</div>
	{/if}
{/if}

<style>
	/* The same reason the list rows do it: iOS answers a long press on an image
	   with its own preview sheet, which swallows the press before the context menu
	   can open. A launcher is a target, not a passage. */
	.persona-launcher {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
