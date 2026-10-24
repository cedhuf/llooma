<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { sessionsStore, settingsStore } from '$lib/localStorage';
	import { launchPersona, unbindPersonaSession, type Persona } from '$lib/personas';

	import ContextMenu from './ContextMenu.svelte';
	import PersonaAvatar from './PersonaAvatar.svelte';
	import SessionMenu from './SessionMenu.svelte';

	interface Props {
		personas: Persona[];
	}

	let { personas }: Props = $props();

	const pathname = $derived(page.url.pathname);
	const isActive = (persona: Persona) =>
		!!persona.sessionId && pathname.includes(persona.sessionId);

	async function launch(persona: Persona) {
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

{#if personas.length > 0}
	<!-- One row that scrolls sideways once it is full. The vertical padding leaves
	     room for the ring, drawn outside the avatar, which overflow would clip. -->
	<div class="flex gap-1 overflow-x-auto px-2 pt-1 pb-2" style="scrollbar-width: none">
		{#each personas as persona (persona.id)}
			{@const session = sessionOf(persona)}
			<ContextMenu>
				{#snippet trigger({ props })}
					<button
						{...props}
						type="button"
						onclick={() => launch(persona)}
						title={persona.tagline || persona.name}
						class="persona-launcher group flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 outline-none"
					>
						<span
							class="ring-offset-shade-1 relative inline-flex rounded-full ring-offset-2 transition duration-150 group-hover:scale-105 motion-reduce:transition-none {isActive(
								persona
							)
								? 'ring-accent ring-2'
								: 'group-hover:ring-shade-4 group-focus-visible:ring-accent group-hover:ring-2 group-focus-visible:ring-2'}"
						>
							<PersonaAvatar {persona} size={40} />
						</span>
						<span
							class="w-full truncate text-center text-[11px] transition-colors {isActive(persona)
								? 'text-active font-medium'
								: 'text-muted group-hover:text-active'}"
						>
							{persona.name}
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
