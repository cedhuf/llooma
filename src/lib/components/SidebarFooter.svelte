<script lang="ts">
	import { Settings2 } from '@lucide/svelte';

	import LL from '$i18n/i18n-svelte';
	import { serversStore, settingsStore } from '$lib/localStorage';
	import { settingsModalOpen } from '$lib/stores/modal';

	interface Props {
		/** The collapsed desktop rail keeps the avatar and drops the name. */
		rail: boolean;
		/** More of the list lies below, so the footer draws its edge. */
		edge: boolean;
	}

	let { rail, edge }: Props = $props();

	// A connection that is enabled and has answered once. The providers an instance
	// hands out arrive verified, so this reads as "is there anything to talk to".
	const connected = $derived($serversStore.some((s) => s.isEnabled && s.isVerified));
	const hasName = $derived(!!($settingsStore.profileFirstName || $settingsStore.profileLastName));

	function initials(): string {
		const f = $settingsStore.profileFirstName.trim().charAt(0).toUpperCase();
		const l = $settingsStore.profileLastName.trim().charAt(0).toUpperCase();
		return f + l || '?';
	}
</script>

<!-- The same 2rem the mark occupies at the other end of the column. The rail
     centres what it holds and the open column starts it at the gutter, so an
     element only lands in the same place under both when its width matches that
     gutter: the mark never moved, the avatar, four pixels wider, did. -->
{#snippet avatar()}
	{#if hasName}
		<div
			class="flex h-8 w-8 items-center justify-center rounded-full"
			style="background-color:{$settingsStore.profileColor || '#6366f1'}"
		>
			{#if $settingsStore.profileAvatar}
				<img
					src={$settingsStore.profileAvatar}
					alt="Avatar"
					class="h-full w-full rounded-full object-cover"
				/>
			{:else}
				<span class="text-shade-0 text-sm font-bold">{initials()}</span>
			{/if}
		</div>
	{:else}
		<div class="bg-shade-2 text-muted flex h-8 w-8 items-center justify-center rounded-full">
			<Settings2 class="h-4 w-4" />
		</div>
	{/if}
{/snippet}

{#snippet connectionDot()}
	<span
		class="border-shade-1 absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 {connected
			? 'bg-positive'
			: 'bg-shade-5'}"
		title={connected ? $LL.connected() : $LL.noServerConnected()}
	></span>
{/snippet}

<!-- The dot hangs off the avatar's corner, so the avatar has to be the
     positioning context: given to the surrounding button it would sit in the
     corner of whatever that button measures, which differs between the rail and
     the open column. Hence one snippet for the pair. -->
{#snippet identity()}
	<span class="relative shrink-0">
		{@render avatar()}
		{@render connectionDot()}
	</span>
{/snippet}

<div
	class="surface-column flex shrink-0 border-t-[0.5px] transition-colors duration-200 {edge
		? 'border-shade-3'
		: 'border-transparent'}"
>
	<!-- Full width for the material, fixed width for the layout: see `SidebarBrand`. -->
	<div class="w-[var(--column-w)] shrink-0 p-2 max-lg:pb-[max(0.5rem,var(--safe-bottom))]">
		<!-- Labelled explicitly, or the accessible name is whatever its children happen
		     to concatenate to, which announces badly and is unusable as a handle. -->
		<button
			onclick={() => ($settingsModalOpen = true)}
			aria-label={$LL.settings()}
			title={rail ? $LL.settings() : undefined}
			class="group hover:bg-shade-0 flex h-11 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors"
		>
			{@render identity()}
			{#if !rail}
				<span class="min-w-0 flex-1 truncate text-sm font-medium">
					{hasName
						? `${$settingsStore.profileFirstName} ${$settingsStore.profileLastName}`.trim()
						: $LL.settings()}
				</span>
				<Settings2 class="text-muted group-hover:text-active h-4 w-4 shrink-0 transition-colors" />
			{/if}
		</button>
	</div>
</div>
