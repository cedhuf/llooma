<script lang="ts">
	import type { Snippet } from 'svelte';

	// The shared shell for every settings tab: the dialog's full width, with one
	// vertical rhythm between sections so every tab lines up.
	let { children }: { children: Snippet } = $props();
</script>

<div class="flex w-full flex-col gap-6">
	{@render children()}
</div>
