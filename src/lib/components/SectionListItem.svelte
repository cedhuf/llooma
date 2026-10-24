<script lang="ts">
	import { Pin, Trash2 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	import LL from '$i18n/i18n-svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { knowledgeStore, sessionsStore, settingsStore } from '$lib/localStorage';
	import { unbindPersonaSession } from '$lib/personas';
	import { toggleSessionPin } from '$lib/sessions';
	import { Sitemap } from '$lib/sitemap';

	import ButtonConfirm from './ButtonConfirm.svelte';
	import { generateNewUrl } from './ButtonNew';
	import ContextMenu from './ContextMenu.svelte';
	import MenuItem from './MenuItem.svelte';
	import SessionMenu from './SessionMenu.svelte';

	interface Props {
		sitemap: Sitemap;
		id: string;
		title: string;
		subtitle?: string;
		pinned?: boolean;
		/** Drawn before the title. A persona's conversation carries its avatar here. */
		leading?: Snippet;
	}

	let { sitemap, id, title, subtitle, pinned = false, leading }: Props = $props();
	let isDeleting = $state(false);

	const isSession = $derived(sitemap === Sitemap.SESSIONS);

	/** Here rather than inside the button: a button that reaches into the stores can only delete the kinds somebody remembered to write into its switch. The row already knows what it is listing. */
	function remove() {
		if (sitemap === Sitemap.KNOWLEDGE) {
			knowledgeStore.remove(id);
			return;
		}
		sessionsStore.remove(id);
		unbindPersonaSession(id);
		void goto(resolve('/sessions'));
	}
	const isActive = $derived(page.url.pathname.includes(id));

	/** Everything they do is in the right-click menu, which does not hover over the title, does not truncate it further, and does not put delete one slip away from the conversation you meant to open. */
	const showQuickActions = $derived($settingsStore.showListQuickActions === true);

	/** The fade that ends a cut title, before the actions or the row's edge. */
	const FADE_PX = 24;
	let hovered = $state(false);
	let boxWidth = $state(0);
	let titleWidth = $state(0);
	let actionsWidth = $state(0);
	const room = $derived(boxWidth - Math.max(0, actionsWidth - 4));
	const overflowing = $derived(titleWidth > room);
	/** Under the pointer, a title too long for the row slides to show its end, at a constant speed. */
	const shift = $derived(hovered && overflowing ? titleWidth - room + FADE_PX : 0);
	const mask = $derived(
		`linear-gradient(to right, ${shift ? 'transparent, #000 16px,' : ''} #000 ${room - FADE_PX}px, transparent ${room}px)`
	);
</script>

<!-- `#key id` re-renders the delete nav after a deletion. -->
{#key id}
	<ContextMenu>
		{#snippet trigger({ props })}
			<div
				{...props}
				class="section-list-item group hover:bg-shade-0 relative flex items-center rounded-lg px-2.5 transition-colors
				{isActive ? 'bg-shade-0' : ''}"
				class:confirm-deletion={isDeleting}
				onmouseenter={() => (hovered = true)}
				onmouseleave={() => (hovered = false)}
			>
				{#if leading}
					<span class="mr-2 shrink-0">{@render leading()}</span>
				{/if}
				<a
					class="relative z-0 min-w-0 flex-1 {subtitle ? 'py-2' : 'py-1.5'} {isActive
						? 'text-active'
						: 'hover:text-active'}"
					data-testid={isSession ? 'session-item' : 'knowledge-item'}
					href={generateNewUrl(sitemap, id)}
				>
					<span
						bind:clientWidth={boxWidth}
						class="block overflow-hidden"
						style:mask-image={overflowing ? mask : null}
					>
						<span
							bind:offsetWidth={titleWidth}
							class="inline-block text-sm whitespace-nowrap {subtitle || isActive
								? 'font-medium'
								: ''}"
							style:transform="translateX(-{shift}px)"
							style:transition={shift
								? `transform ${shift * 20}ms linear 400ms`
								: 'transform 250ms ease-out'}
						>
							{title}
						</span>
					</span>
					{#if subtitle}
						<p class="text-muted truncate text-xs">{subtitle}</p>
					{/if}
				</a>

				<!-- Over the end of the title rather than beside it, so a title has the whole
				     row until the pointer asks for the actions. The title fades out under them
				     instead of sitting on a plate. -->
				<div
					bind:offsetWidth={actionsWidth}
					class="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center"
				>
					{#if isSession && !isDeleting && (pinned || showQuickActions)}
						<button
							type="button"
							onclick={() => void toggleSessionPin(id)}
							title={pinned ? $LL.unpin() : $LL.pin()}
							aria-label={pinned ? $LL.unpin() : $LL.pin()}
							class="px-1.5 py-1 transition-colors {pinned
								? 'text-accent'
								: 'text-muted hover:text-active hidden group-focus-within:block group-hover:block'}"
						>
							<Pin class="base-icon {pinned ? 'fill-accent' : ''}" />
						</button>
					{/if}

					<!-- Shown while a deletion waits to be confirmed whatever the setting says: the
					     confirmation has to appear where the row is, including when it was asked for
					     from the right-click menu. -->
					{#if showQuickActions || isDeleting}
						<div
							class="items-center {isDeleting
								? 'flex'
								: 'hidden group-focus-within:flex group-hover:flex'}"
						>
							<ButtonConfirm
								compact
								bind:armed={isDeleting}
								onConfirm={remove}
								label={sitemap === Sitemap.KNOWLEDGE ? $LL.deleteKnowledge() : $LL.deleteSession()}
							/>
						</div>
					{/if}
				</div>
			</div>
		{/snippet}

		{#if isSession}
			<SessionMenu {id} {pinned} onDelete={() => (isDeleting = true)} />
		{:else}
			<!-- Asks rather than does: the confirmation appears on the row, where it appears
			     when the quick buttons are on. -->
			<MenuItem icon={Trash2} danger onclick={() => (isDeleting = true)}>
				{$LL.deleteKnowledge()}
			</MenuItem>
		{/if}
	</ContextMenu>
{/key}

<style>
	/* iOS answers a long press on a link with its own preview sheet, and on text
	   with the selection magnifier, and either swallows the press before the context
	   menu opens. Both properties inherit, so the row covers its title and its link
	   at once: a sidebar row is a target, not a passage. */
	.section-list-item {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
