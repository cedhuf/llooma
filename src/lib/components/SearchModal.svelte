<script lang="ts">
	import { CornerDownLeft, Layers, Search, X } from '@lucide/svelte';
	import { Command } from 'bits-ui';
	import { tick } from 'svelte';

	import LL from '$i18n/i18n-svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Kbd from '$lib/components/Kbd.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { splitExcerpt, type ConversationResult } from '$lib/conversationSearch';
	import { repository } from '$lib/data';
	import { formatTimestampToNow } from '$lib/utils';

	/** Distinct from the sidebar field, which filters the visible list by title: this queries the whole corpus and answers with the passages, so a result is somewhere to read. */
	interface Props {
		open: boolean;
		/** Seeded from the sidebar when arriving through "search everywhere". */
		initialQuery?: string;
	}

	let { open = $bindable(false), initialQuery = '' }: Props = $props();

	const DEBOUNCE_MS = 200;

	let query = $state('');
	let results = $state<ConversationResult[]>([]);
	let loading = $state(false);
	let failed = $state(false);
	let input = $state<HTMLInputElement | null>(null);

	// Opening seeds from the sidebar and focuses; closing forgets, so the next open
	// is a fresh search rather than a stale answer.
	$effect(() => {
		if (!open) return;
		query = initialQuery;
		void tick().then(() => input?.focus());
	});

	$effect(() => {
		if (!open) {
			results = [];
			failed = false;
			loading = false;
		}
	});

	/** Off by default: a compaction summary doubles every result it touches, and a conversation you cleared is one you set aside. Until it is what you are looking for. */
	let everything = $state(false);

	let timer: ReturnType<typeof setTimeout>;
	$effect(() => {
		const current = query.trim();
		// Read so the search re-runs when the switch moves, not only when typing.
		const all = everything;
		clearTimeout(timer);

		if (!current) {
			results = [];
			loading = false;
			failed = false;
			return;
		}

		loading = true;
		timer = setTimeout(async () => {
			try {
				results = await repository.searchSessions(current, all);
				failed = false;
			} catch {
				results = [];
				failed = true;
			} finally {
				loading = false;
			}
		}, DEBOUNCE_MS);

		return () => clearTimeout(timer);
	});

	/** The arrows move between passages rather than conversations: the heading is a grouping, not a stop. */
	function openMatch(sessionId: string, messageIndex: number) {
		open = false;
		// The message index rides in the URL, so the conversation scrolls to the passage
		// that was chosen rather than to the conversation.
		const target = new URL(resolve('/sessions/[id]', { id: sessionId }), window.location.origin);
		target.searchParams.set('m', String(messageIndex));
		// The route is resolved above; the rule only sees that in a literal argument and
		// cannot follow a URL carrying a query parameter.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(target);
	}
</script>

<Modal bind:open closeButton={false}>
	<!-- The search runs on the server, so Command only keeps the keyboard and the
	     highlight: `shouldFilter` off, the results arrive already chosen. -->
	<Command.Root shouldFilter={false} loop class="flex h-full w-full flex-col">
		<!-- The field is the title: a search dialog opening with anything else at the
		     top makes you look for where to type. -->
		<div class="border-shade-3 flex items-center gap-3 border-b px-4 py-3">
			<Search class="text-muted h-4 w-4 shrink-0" />
			<Command.Input
				bind:ref={input}
				bind:value={query}
				type="text"
				autocomplete="off"
				spellcheck="false"
				aria-label={$LL.searchConversations()}
				placeholder={$LL.searchConversationsPlaceholder()}
				class="placeholder:text-muted w-full bg-transparent text-base outline-none"
			/>
			{#if loading}
				<div
					class="border-shade-3 border-t-active h-3.5 w-3.5 shrink-0 animate-spin rounded-full border"
				></div>
			{/if}

			<!-- Beside the field rather than under the results: it changes what is being
			     searched, so it belongs with the question. -->
			<button
				type="button"
				onclick={() => (everything = !everything)}
				aria-pressed={everything}
				title={$LL.searchEverything()}
				class="shrink-0 rounded-lg px-2 py-1 text-[11px] transition-colors {everything
					? 'bg-accent/10 text-accent'
					: 'text-muted hover:bg-shade-2 hover:text-active'}"
			>
				<Layers class="h-3.5 w-3.5" />
			</button>

			<!-- The way out, here rather than in the dialog's own corner: this content fills
			     the frame from the top edge, so the built-in close would land on the field. -->
			<button
				type="button"
				onclick={() => (open = false)}
				aria-label={$LL.close()}
				class="text-muted hover:bg-shade-2 hover:text-active shrink-0 rounded-lg p-1.5 transition-colors"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<Command.List class="flex-1 overflow-y-auto px-2 py-2">
			{#if !query.trim()}
				<p class="text-muted px-3 py-8 text-center text-sm">{$LL.searchStart()}</p>
			{:else if failed}
				<p class="text-muted px-3 py-8 text-center text-sm">{$LL.genericError()}</p>
			{:else if !loading && !results.length}
				<p class="text-muted px-3 py-8 text-center text-sm">{$LL.searchEmpty()}</p>
			{:else}
				{#each results as result (result.sessionId)}
					<Command.Group value={result.sessionId} class="mt-3 first:mt-0">
						<!-- Heading, then its passages: title and date on one line, so "which
					     conversation, and when" is answered before the eye reaches the excerpts. -->
						<Command.GroupHeading class="mb-1 flex items-baseline gap-3 px-3">
							<span class="truncate text-sm font-semibold">
								{result.title || $LL.untitled()}
							</span>
							<span class="text-muted ml-auto shrink-0 text-xs tabular-nums">
								{result.updatedAt ? formatTimestampToNow(result.updatedAt) : ''}
							</span>
							<span class="text-muted shrink-0 text-xs">
								{$LL.searchMatches({ count: result.matches.length })}
							</span>
						</Command.GroupHeading>

						<Command.GroupItems>
							{#each result.matches as match (match.messageIndex)}
								<Command.Item
									value="{result.sessionId}:{match.messageIndex}"
									onSelect={() => openMatch(result.sessionId, match.messageIndex)}
									class="data-selected:bg-shade-2 flex w-full cursor-pointer gap-2 rounded-md px-3 py-1.5 text-left text-sm leading-relaxed transition-colors"
								>
									<span class="text-muted w-16 shrink-0 truncate pt-0.5 text-[11px] uppercase">
										{match.role === 'user' ? $LL.you() : $LL.assistant()}
									</span>
									<span class="text-muted line-clamp-2 min-w-0 flex-1">
										<!-- The excerpt is message content, so it is only ever text nodes; the marks
								     come from the split, never from parsed markup. -->
										{#each splitExcerpt(match.excerpt) as segment, segmentIndex (segmentIndex)}
											{#if segment.match}
												<mark class="text-active rounded-sm bg-yellow-400/30">{segment.text}</mark>
											{:else}{segment.text}{/if}
										{/each}
									</span>
								</Command.Item>
							{/each}
						</Command.GroupItems>
					</Command.Group>
				{/each}
			{/if}
		</Command.List>

		<div
			class="border-shade-3 text-muted flex items-center gap-4 border-t px-4 py-2 text-[11px]"
			aria-hidden="true"
		>
			<span class="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd>{$LL.searchNavigate()}</span>
			<span class="flex items-center gap-1">
				<Kbd><CornerDownLeft class="h-3 w-3" /></Kbd>
				{$LL.searchOpen()}
			</span>
			<span class="flex items-center gap-1"><Kbd>esc</Kbd>{$LL.searchClose()}</span>
		</div>
	</Command.Root>
</Modal>
