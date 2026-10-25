<script lang="ts">
	import { ImageIcon, Library, MessagesSquare, Search, SquarePen } from '@lucide/svelte';

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
		onNewChat: () => void;
		/** The list has moved under New chat, which then draws its edge. */
		scrolled: boolean;
	}

	let { personas, sessions, rail, onNewChat, scrolled }: Props = $props();

	const RECENT_COUNT = 10;
	const recent = $derived(sessions.filter((s) => !s.archived).slice(0, RECENT_COUNT));
	let recentOpen = $state(false);

	const pathname = $derived(page.url.pathname);
	const onLibrary = $derived(pathname.includes('/library') || pathname.includes('/knowledge'));
	const onImages = $derived(pathname.startsWith('/images'));

	// `pl-4` inside `px-2` puts every icon on the folded column's centre line, so
	// folding moves nothing.
	const item = 'flex h-9 w-full items-center gap-3 rounded-lg pr-2 pl-4 text-sm transition-colors';
	const idle = 'text-body hover:bg-shade-0 hover:text-active';
	const current = 'bg-shade-0 text-active';
	const label = $derived(rail ? 'sr-only' : 'truncate');
	const layoutWidth = $derived(
		`w-full shrink-0 max-lg:w-[var(--drawer-w)] ${rail ? 'lg:w-16' : 'lg:w-[var(--sidebar-w)]'}`
	);
</script>

<!-- Two blocks laid straight into the column's scroller: New chat sticks under the
     brand, the rest scrolls. The edge under New chat appears once something has
     passed beneath it. -->
<div
	class="surface-column sticky top-[var(--app-header-h)] z-10 shrink-0 border-b-[0.5px] transition-colors duration-200 max-lg:top-[calc(var(--app-header-h)+var(--safe-top))] {scrolled
		? 'border-shade-3'
		: 'border-transparent'}"
>
	<!-- Full width for the material, fixed width for the layout: see `SidebarBrand`. -->
	<div class={layoutWidth}>
		<div class="px-2 pt-1 pb-1">
			<button
				type="button"
				onclick={onNewChat}
				title={rail ? $LL.newChat() : undefined}
				class="{item} {idle} font-medium"
			>
				<SquarePen class="text-accent h-4 w-4 shrink-0" />
				<span class={label}>{$LL.newChat()}</span>
			</button>
		</div>
	</div>
</div>

<div>
	<div class={layoutWidth}>
		<div class="flex flex-col gap-0.5 px-2 pb-2">
			<!-- Open, both live elsewhere: the search in the brand bar, the conversations
			     in the list below. -->
			{#if rail}
				<button
					type="button"
					onclick={() => openSearch()}
					title={$LL.search()}
					class="{item} {idle}"
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
								class="{item} {recentOpen ? current : idle}"
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
									? current
									: idle}"
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
				class="{item} {onLibrary ? current : idle}"
			>
				<Library class="text-muted h-4 w-4 shrink-0" />
				<span class={label}>{$LL.library()}</span>
			</a>

			{#if $canDrawImages}
				<a
					href={resolve('/images')}
					title={rail ? $LL.images() : undefined}
					class="{item} {onImages ? current : idle}"
				>
					<ImageIcon class="text-muted h-4 w-4 shrink-0" />
					<span class={label}>{$LL.images()}</span>
				</a>
			{/if}
		</div>

		<SidebarPersonas {personas} {rail} />
	</div>
</div>
