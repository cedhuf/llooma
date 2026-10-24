<script lang="ts">
	import { ImageIcon, Library, SquarePen } from '@lucide/svelte';

	import LL from '$i18n/i18n-svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { canDrawImages } from '$lib/images';
	import type { Persona } from '$lib/personas';

	import SidebarPersonas from './SidebarPersonas.svelte';

	interface Props {
		personas: Persona[];
		/** The folded desktop column: the same entries, icons only. */
		rail: boolean;
		onNewChat: () => void;
	}

	let { personas, rail, onNewChat }: Props = $props();

	const pathname = $derived(page.url.pathname);
	const onLibrary = $derived(pathname.includes('/library') || pathname.includes('/knowledge'));
	const onImages = $derived(pathname.startsWith('/images'));

	// `pl-4` inside `px-2` puts every icon on the folded column's centre line, so
	// folding moves nothing.
	const item = 'flex h-9 w-full items-center gap-3 rounded-lg pr-2 pl-4 text-sm transition-colors';
	const idle = 'text-base hover:bg-shade-0 hover:text-active';
	const current = 'bg-shade-0 text-active';
	const label = $derived(rail ? 'sr-only' : 'truncate');
</script>

<div class="surface-column shrink-0">
	<!-- Full width for the material, fixed width for the layout: see `SidebarBrand`. -->
	<div
		class="w-full shrink-0 max-lg:w-[var(--drawer-w)] {rail
			? 'lg:w-16'
			: 'lg:w-[var(--sidebar-w)]'}"
	>
		<div class="flex flex-col gap-0.5 px-2 pt-1 pb-2">
			<button
				type="button"
				onclick={onNewChat}
				title={rail ? $LL.newChat() : undefined}
				class="{item} {idle} font-medium"
			>
				<SquarePen class="text-accent h-4 w-4 shrink-0" />
				<span class={label}>{$LL.newChat()}</span>
			</button>

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
