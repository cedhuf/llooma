<script lang="ts">
	import LL from '$i18n/i18n-svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { sessionsStore, settingsStore } from '$lib/localStorage';
	import { launchPersona, unbindPersonaSession, type Persona } from '$lib/personas';

	import ContextMenu from './ContextMenu.svelte';
	import PersonaAvatar from './PersonaAvatar.svelte';
	import Popover from './Popover.svelte';
	import SessionMenu from './SessionMenu.svelte';

	interface Props {
		personas: Persona[];
		/** The folded column: one avatar under the other, names in the tooltip. Open, a stack of faces that opens them all. */
		rail?: boolean;
	}

	let { personas, rail = false }: Props = $props();

	const pathname = $derived(page.url.pathname);
	const isActive = (persona: Persona) =>
		!!persona.sessionId && pathname.includes(persona.sessionId);

	/** Faces shown in the stack before it says how many more there are. */
	const STACK = 5;
	const stacked = $derived(personas.slice(0, STACK));
	const hidden = $derived(personas.length - stacked.length);
	let open = $state(false);

	async function launch(persona: Persona) {
		open = false;
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

{#snippet launcher(persona: Persona, size: number, named: boolean)}
	{@const session = sessionOf(persona)}
	<ContextMenu>
		{#snippet trigger({ props })}
			<button
				{...props}
				type="button"
				onclick={() => launch(persona)}
				title={named ? persona.tagline || persona.name : persona.name}
				aria-label={persona.name}
				class="persona-launcher group flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 outline-none"
			>
				<!-- The vertical padding leaves room for the ring, drawn outside the avatar. -->
				<span
					class="ring-offset-shade-1 relative inline-flex rounded-full ring-offset-2 transition duration-150 group-hover:scale-105 motion-reduce:transition-none {isActive(
						persona
					)
						? 'ring-accent ring-2'
						: 'group-hover:ring-shade-4 group-focus-visible:ring-accent group-hover:ring-2 group-focus-visible:ring-2'}"
				>
					<PersonaAvatar {persona} {size} />
				</span>
				{#if named}
					<span
						class="w-full truncate text-center text-[11px] transition-colors {isActive(persona)
							? 'text-active font-medium'
							: 'text-muted group-hover:text-active'}"
					>
						{persona.name}
					</span>
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
{/snippet}

{#if personas.length > 0}
	{#if rail}
		<div class="flex flex-col items-center gap-1 px-2 pt-1 pb-2">
			{#each personas as persona (persona.id)}
				{@render launcher(persona, 32, false)}
			{/each}
		</div>
	{:else}
		<div class="px-2 pb-2">
			<Popover side="right" align="start" class="w-80 p-2" bind:open>
				{#snippet trigger({ props })}
					<button
						{...props}
						type="button"
						class="flex h-10 w-full items-center gap-3 rounded-lg pr-2 pl-3 text-sm transition-colors {open
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
						{#if hidden > 0}
							<span class="text-muted ml-auto shrink-0 text-xs">+{hidden}</span>
						{/if}
					</button>
				{/snippet}

				<div class="grid grid-cols-4 gap-1">
					{#each personas as persona (persona.id)}
						{@render launcher(persona, 40, true)}
					{/each}
				</div>
			</Popover>
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
