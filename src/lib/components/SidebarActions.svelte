<script lang="ts">
	import { ImageIcon, Library, Search, SquarePen } from '@lucide/svelte';

	import LL from '$i18n/i18n-svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { canDrawImages } from '$lib/images';
	import type { Persona } from '$lib/personas';
	import { modKey } from '$lib/platform';
	import { openSearch } from '$lib/stores/modal';

	import Kbd from './Kbd.svelte';
	import SidebarPersonas from './SidebarPersonas.svelte';

	interface Props {
		personas: Persona[];
		onNewChat: () => void;
	}

	let { personas, onNewChat }: Props = $props();

	const mod = $derived(modKey());
	const pathname = $derived(page.url.pathname);
	const onLibrary = $derived(pathname.includes('/library') || pathname.includes('/knowledge'));
	const onImages = $derived(pathname.startsWith('/images'));

	const item = 'flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm transition-colors';
	const idle = 'text-base hover:bg-shade-0 hover:text-active';
	const current = 'bg-shade-0 text-active';
</script>

<div class="surface-column shrink-0">
	<!-- Full width for the material, fixed width for the layout: see `SidebarBrand`. -->
	<div class="w-full shrink-0 max-lg:w-[var(--drawer-w)] lg:w-[var(--sidebar-w)]">
		<div class="flex flex-col gap-0.5 px-2 pt-1 pb-2">
			<button type="button" onclick={onNewChat} class="{item} {idle} font-medium">
				<SquarePen class="text-accent h-4 w-4 shrink-0" />
				{$LL.newChat()}
			</button>

			<button type="button" onclick={() => openSearch()} class="group {item} {idle}">
				<Search class="text-muted h-4 w-4 shrink-0" />
				<span class="flex-1 text-left">{$LL.search()}</span>
				<span
					class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
				>
					<Kbd>{mod}</Kbd><Kbd>K</Kbd>
				</span>
			</button>

			<a href={resolve('/library')} class="{item} {onLibrary ? current : idle}">
				<Library class="text-muted h-4 w-4 shrink-0" />
				{$LL.library()}
			</a>

			{#if $canDrawImages}
				<a href={resolve('/images')} class="{item} {onImages ? current : idle}">
					<ImageIcon class="text-muted h-4 w-4 shrink-0" />
					{$LL.images()}
				</a>
			{/if}
		</div>

		<SidebarPersonas {personas} />
	</div>
</div>
