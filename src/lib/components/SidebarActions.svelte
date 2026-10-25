<script lang="ts" module>
	// `pl-4` inside `px-2` puts every icon on the folded column's centre line, so
	// folding moves nothing. Shared with New chat, in the brand block.
	export const sidebarItem =
		'flex h-9 w-full items-center gap-3 rounded-lg pr-2 pl-4 text-sm transition-colors';
	export const sidebarItemIdle = 'text-body hover:bg-shade-0 hover:text-active';
	export const sidebarItemCurrent = 'bg-shade-0 text-active';
</script>

<script lang="ts">
	import { ImageIcon, Library, MessagesSquare, Search } from '@lucide/svelte';

	import LL from '$i18n/i18n-svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { canDrawImages } from '$lib/images';
	import type { Persona } from '$lib/personas';
	import { resolveSessionTitle, type SessionSummary } from '$lib/sessions';
	import { openSearch } from '$lib/stores/modal';

	import Popover from './Popover.svelte';
	import SidebarPersonas from './SidebarPersonas.svelte';

	interface Props {
		personas: Persona[];
		/** The folded column lists the latest of them in a menu, having no room for the list. */
		sessions: SessionSummary[];
		/** The folded desktop column: the same entries, icons only. */
		rail: boolean;
	}

	let { personas, sessions, rail }: Props = $props();

	const RECENT_COUNT = 10;
	const recent = $derived(sessions.filter((s) => !s.archived).slice(0, RECENT_COUNT));
	let recentOpen = $state(false);

	const pathname = $derived(page.url.pathname);
	const onLibrary = $derived(pathname.includes('/library') || pathname.includes('/knowledge'));
	const onImages = $derived(pathname.startsWith('/images'));

	const label = $derived(rail ? 'sr-only' : 'truncate');
</script>

<div>
	<div class="w-[var(--column-w)] shrink-0">
		<div class="flex flex-col gap-0.5 px-2 pb-2">
			<!-- Open, both live elsewhere: the search in the brand bar, the conversations
			     in the list below. -->
			{#if rail}
				<button
					type="button"
					onclick={() => openSearch()}
					title={$LL.search()}
					class="{sidebarItem} {sidebarItemIdle}"
				>
					<Search class="text-muted h-4 w-4 shrink-0" />
					<span class={label}>{$LL.search()}</span>
				</button>

				{#if recent.length > 0}
					<Popover side="right" align="start" class="w-64 p-1.5" bind:open={recentOpen}>
						{#snippet trigger({ props })}
							<button
								{...props}
								type="button"
								title={$LL.recentSessions()}
								class="{sidebarItem} {recentOpen ? sidebarItemCurrent : sidebarItemIdle}"
							>
								<MessagesSquare class="text-muted h-4 w-4 shrink-0" />
								<span class={label}>{$LL.recentSessions()}</span>
							</button>
						{/snippet}

						<p class="text-muted px-2 pt-1 pb-1.5 text-xs font-medium">
							{$LL.recentSessions()}
						</p>
						{#each recent as session (session.id)}
							<a
								href={resolve('/sessions/[id]', { id: session.id })}
								onclick={() => (recentOpen = false)}
								class="block truncate rounded-lg px-2 py-1.5 text-sm transition-colors {pathname.includes(
									session.id
								)
									? sidebarItemCurrent
									: sidebarItemIdle}"
							>
								{resolveSessionTitle(session) || $LL.untitled()}
							</a>
						{/each}
					</Popover>
				{/if}
			{/if}

			<a
				href={resolve('/library')}
				title={rail ? $LL.library() : undefined}
				class="{sidebarItem} {onLibrary ? sidebarItemCurrent : sidebarItemIdle}"
			>
				<Library class="text-muted h-4 w-4 shrink-0" />
				<span class={label}>{$LL.library()}</span>
			</a>

			{#if $canDrawImages}
				<a
					href={resolve('/images')}
					title={rail ? $LL.images() : undefined}
					class="{sidebarItem} {onImages ? sidebarItemCurrent : sidebarItemIdle}"
				>
					<ImageIcon class="text-muted h-4 w-4 shrink-0" />
					<span class={label}>{$LL.images()}</span>
				</a>
			{/if}
		</div>

		<SidebarPersonas {personas} {rail} />
	</div>
</div>
