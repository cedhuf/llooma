<script lang="ts">
	import { Archive } from '@lucide/svelte';

	import LL from '$i18n/i18n-svelte';
	import type { Persona } from '$lib/personas';
	import {
		groupSessions,
		resolveSessionTitle,
		type SessionGroupKey,
		type SessionSummary
	} from '$lib/sessions';
	import { Sitemap } from '$lib/sitemap';

	import ArchiveModal from './ArchiveModal.svelte';
	import EmptyMessage from './EmptyMessage.svelte';
	import PersonaAvatar from './PersonaAvatar.svelte';
	import SectionListItem from './SectionListItem.svelte';

	interface Props {
		sessions: SessionSummary[];
		/** A persona's conversation carries its avatar, so it is recognisable as one. */
		personaById: Record<string, Persona>;
	}

	let { sessions, personaById }: Props = $props();

	let archiveOpen = $state(false);
	const archivedCount = $derived(sessions.filter((s) => s.archived).length);

	const groups = $derived(groupSessions(sessions));

	function groupLabel(key: SessionGroupKey): string {
		switch (key) {
			case 'pinned':
				return $LL.groupPinned();
			case 'today':
				return $LL.groupToday();
			case 'yesterday':
				return $LL.groupYesterday();
			case 'previous7Days':
				return $LL.groupPrevious7Days();
			case 'previous30Days':
				return $LL.groupPrevious30Days();
			case 'older':
				return $LL.groupOlder();
		}
	}
</script>

<!-- Inside the actions' scroller: see `SidebarActions`. -->
<div>
	<!-- Full width for the material, fixed width for the layout: see `SidebarBrand`. -->
	<div class="w-full px-2 py-2 max-lg:w-[var(--drawer-w)] lg:w-[var(--sidebar-w)]">
		{#each groups as group (group.key)}
			<div class="mb-2">
				<p class="text-muted px-2.5 pt-2 pb-1 text-xs font-medium">
					{groupLabel(group.key)}
				</p>
				<!-- A hair of space between rows: hovering the neighbour of the active session
				     used to butt two rounded highlights against each other. -->
				<div class="flex flex-col gap-0.5">
					{#each group.sessions as session (session.id)}
						{@const persona = session.personaId ? personaById[session.personaId] : undefined}
						<SectionListItem
							sitemap={Sitemap.SESSIONS}
							id={session.id}
							title={resolveSessionTitle(session)}
							pinned={session.pinned}
							leading={persona ? personaBadge : undefined}
						/>
						{#snippet personaBadge()}
							{#if persona}
								<PersonaAvatar {persona} size={20} />
							{/if}
						{/snippet}
					{/each}
				</div>
			</div>
		{/each}

		{#if groups.length === 0}
			<EmptyMessage>{$LL.emptySessions()}</EmptyMessage>
		{/if}

		<!-- At the foot of the list, where you are once you have scrolled past
		     everything. Absent entirely when there is nothing in it: a permanent link to
		     an empty room teaches nothing. -->
		{#if archivedCount > 0}
			<button
				type="button"
				onclick={() => (archiveOpen = true)}
				class="text-muted hover:bg-shade-0 hover:text-active mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors"
			>
				<Archive class="h-3.5 w-3.5 shrink-0" />
				<span class="truncate">{$LL.archivedSessions()}</span>
				<span class="ml-auto shrink-0">{archivedCount}</span>
			</button>
		{/if}
	</div>
</div>

<ArchiveModal bind:open={archiveOpen} />
