<script lang="ts">
	import { PanelLeft, Search } from '@lucide/svelte';

	import LL from '$i18n/i18n-svelte';
	import { resolve } from '$app/paths';
	import { APP_NAME } from '$lib/brand';
	import { modKey } from '$lib/platform';
	import { openSearch } from '$lib/stores/modal';

	import Logo from './Logo.svelte';

	interface Props {
		/** The collapsed desktop rail keeps the mark, which becomes the way back out. */
		rail: boolean;
		onCollapse: () => void;
		onExpand: () => void;
	}

	let { rail, onCollapse, onExpand }: Props = $props();

	const iconButton =
		'text-muted hover:bg-shade-0 hover:text-active rounded-lg p-2 transition-colors';
</script>

<div
	class="surface-column flex h-[var(--app-header-h)] shrink-0 max-lg:h-[calc(var(--app-header-h)+var(--safe-top))]"
>
	<!-- The block paints out to the frame's edge; its contents stop at the width the
	     column is going to. Two jobs that used to be one and had to be separated: laid
	     out at the target width, a block leaves the frame unpainted while the column
	     is still narrowing; laid out at the frame's width, it re-wraps itself sixty
	     times a second on the way there. -->
	<div
		class="flex h-full w-full shrink-0 items-center px-3 max-lg:w-[var(--drawer-w)] max-lg:pt-[var(--safe-top)] {rail
			? 'lg:w-16'
			: 'lg:w-[var(--sidebar-w)]'}"
	>
		{#if rail}
			<!-- The mark until the pointer reaches it, then the sidebar icon it opens with. -->
			<button
				type="button"
				onclick={onExpand}
				aria-label={$LL.expandSidebar()}
				title={$LL.expandSidebar()}
				class="group text-muted hover:bg-shade-0 hover:text-active relative mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
			>
				<Logo
					class="h-8 w-8 shrink-0 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0"
				/>
				<PanelLeft
					class="absolute h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
				/>
			</button>
		{:else}
			<a href={resolve('/sessions')} class="flex min-w-0 items-center gap-2 px-1">
				<Logo class="h-7 w-7 shrink-0" />
				<span class="truncate text-base font-semibold tracking-tight">{APP_NAME}</span>
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
					onclick={onCollapse}
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
