<script lang="ts">
	import type { Snippet } from 'svelte';

	import SidebarToggle from './SidebarToggle.svelte';

	interface Props {
		headline: Snippet;
		nav: Snippet;
	}

	let { headline, nav }: Props = $props();
</script>

<!-- One header bar everywhere: the same design on mobile and desktop, for
     classic conversations and personas alike. It sits at the top of the display,
     so its material passes under the status bar and its height grows by as much,
     rather than the whole thing being pushed down. -->
<header
	class="surface-chrome border-shade-3 flex h-[var(--app-header-h)] shrink-0 items-center justify-between border-b-[0.5px] px-3 text-xs max-lg:h-[calc(var(--app-header-h)+var(--safe-top))] max-lg:pt-[var(--safe-top)]"
>
	<SidebarToggle />
	<div class="flex min-w-0 flex-1 items-center gap-2">
		<div class="flex min-w-0 flex-1 flex-col gap-1">
			{@render headline()}
		</div>
	</div>

	<nav class="flex flex-row items-center">
		{@render nav()}
	</nav>
</header>
