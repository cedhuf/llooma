<script lang="ts">
	import { PanelLeft, Search, SquarePen } from '@lucide/svelte';

	import LL from '$i18n/i18n-svelte';
	import { resolve } from '$app/paths';
	import { APP_NAME } from '$lib/brand';
	import { modKey } from '$lib/platform';
	import { openSearch } from '$lib/stores/modal';
	import { setSidebarOpen } from '$lib/stores/sidebar';

	import Logo from './Logo.svelte';
	import { sidebarItem, sidebarItemIdle } from './SidebarActions.svelte';

	interface Props {
		/** The collapsed desktop rail keeps the mark, which becomes the way back out. */
		rail: boolean;
		onNewChat: () => void;
		/** The list below has scrolled, so this block draws its lower edge. */
		scrolled: boolean;
	}

	let { rail, onNewChat, scrolled }: Props = $props();

	const iconButton =
		'text-muted hover:bg-shade-0 hover:text-active flex h-10 w-10 items-center justify-center rounded-lg transition-colors';
</script>

<!-- The column's fixed head: the brand bar, then New chat. The list scrolls below
     it, never under it, and its edge appears once the list has moved. -->
<div
	class="surface-column shrink-0 border-b-[0.5px] transition-colors duration-200 {scrolled
		? 'border-shade-3'
		: 'border-transparent'}"
>
	<div class="flex h-[var(--app-header-h)] max-lg:h-[calc(var(--app-header-h)+var(--safe-top))]">
		<!-- The block paints out to the frame's edge; its contents stop at the width the
	     column is going to. Two jobs that used to be one and had to be separated: laid
	     out at the target width, a block leaves the frame unpainted while the column
	     is still narrowing; laid out at the frame's width, it re-wraps itself sixty
	     times a second on the way there. -->
		<div
			class="flex h-full w-[var(--column-w)] shrink-0 items-center px-3 max-lg:pt-[var(--safe-top)]"
		>
			<!-- The mark keeps one box, size and colour in both states. Folded, it gives way
		     to the sidebar icon under the pointer and opens the column, in the same 40px
		     box and at the same size as the button that folds it. -->
			{#if rail}
				<button
					type="button"
					onclick={() => setSidebarOpen(true)}
					aria-label={$LL.expandSidebar()}
					title={$LL.expandSidebar()}
					class="group hover:bg-shade-0 relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
				>
					<Logo
						class="h-8 w-8 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0"
					/>
					<PanelLeft
						class="text-muted group-hover:text-active absolute h-[18px] w-[18px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
					/>
				</button>
			{:else}
				<a href={resolve('/sessions')} class="flex min-w-0 items-center">
					<span class="flex h-10 w-10 shrink-0 items-center justify-center">
						<Logo class="h-8 w-8" />
					</span>
					<span class="truncate text-lg font-semibold tracking-tight">{APP_NAME}</span>
				</a>
				<div class="ml-auto flex shrink-0 items-center">
					<button
						type="button"
						onclick={() => openSearch()}
						class={iconButton}
						aria-label={$LL.search()}
						title="{$LL.search()} ({modKey()} K)"
					>
						<Search class="h-[18px] w-[18px]" />
					</button>
					<button
						type="button"
						onclick={() => setSidebarOpen(false)}
						class={iconButton}
						aria-label={$LL.collapseSidebar()}
						title={$LL.collapseSidebar()}
					>
						<PanelLeft class="h-[18px] w-[18px]" />
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="w-[var(--column-w)] px-2 pt-1 pb-1">
		<button
			type="button"
			onclick={onNewChat}
			title={rail ? $LL.newChat() : undefined}
			class="{sidebarItem} {sidebarItemIdle} font-medium"
		>
			<SquarePen class="text-accent h-4 w-4 shrink-0" />
			<span class={rail ? 'sr-only' : 'truncate'}>{$LL.newChat()}</span>
		</button>
	</div>
</div>
