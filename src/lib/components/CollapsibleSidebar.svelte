<script lang="ts">
	import LL from '$i18n/i18n-svelte';
	import { goto } from '$app/navigation';
	import { personasStore, sessionsStore, settingsStore } from '$lib/localStorage';
	import { conversedPersonas } from '$lib/personas';
	import { SIDEBAR_WIDTH } from '$lib/settings';
	import { Sitemap } from '$lib/sitemap';
	import { isDesktop, mobileDrawerOpen, setSidebarOpen } from '$lib/stores/sidebar';

	import { generateNewUrl } from './ButtonNew';
	import SidebarActions from './SidebarActions.svelte';
	import SidebarBrand from './SidebarBrand.svelte';
	import SidebarFooter from './SidebarFooter.svelte';
	import SidebarSessions from './SidebarSessions.svelte';

	// Personas you have talked to, above the list unless disabled. Their raw session
	// row is dropped to avoid showing them twice.
	const personaLaunchers = $derived(
		$settingsStore.showPinnedPersonas ? conversedPersonas($personasStore, $sessionsStore ?? []) : []
	);
	const launcherSessionIds = $derived(
		personaLaunchers.map((p) => p.sessionId).filter((id): id is string => !!id)
	);
	const visibleSessions = $derived(
		($sessionsStore ?? []).filter((s) => !launcherSessionIds.includes(s.id))
	);
	// A persona's conversation is not obviously one when its launcher is off: it
	// lands among the others with nothing to tell it apart, and its avatar is what
	// says so.
	const personaById = $derived(
		Object.fromEntries(($personasStore ?? []).map((persona) => [persona.id, persona]))
	);

	// The desktop icon rail only exists when collapsed on desktop; mobile is always the full drawer.
	const showRail = $derived($isDesktop && !$settingsStore.sidebarExpanded);
	// Followed locally while dragging and saved once on release: the settings go to
	// the server, which should not hear about every pixel.
	let dragWidth = $state<number | null>(null);
	const width = $derived(dragWidth ?? $settingsStore.sidebarWidth ?? SIDEBAR_WIDTH.default);
	const clampWidth = (px: number) =>
		Math.round(Math.min(SIDEBAR_WIDTH.max, Math.max(SIDEBAR_WIDTH.min, px)));

	let navEl: HTMLElement | undefined = $state();
	function startResize(event: PointerEvent) {
		if (event.button !== 0 || !navEl) return;
		const handle = event.currentTarget as HTMLElement;
		handle.setPointerCapture(event.pointerId);
		const left = navEl.getBoundingClientRect().left;
		dragWidth = width;
		const move = (e: PointerEvent) => (dragWidth = clampWidth(e.clientX - left));
		const end = () => {
			handle.removeEventListener('pointermove', move);
			if (dragWidth !== null) $settingsStore.sidebarWidth = dragWidth;
			dragWidth = null;
		};
		handle.addEventListener('pointermove', move);
		handle.addEventListener('lostpointercapture', end, { once: true });
	}
	function resizeByKey(event: KeyboardEvent) {
		const step = event.key === 'ArrowLeft' ? -16 : event.key === 'ArrowRight' ? 16 : 0;
		if (!step) return;
		event.preventDefault();
		$settingsStore.sidebarWidth = clampWidth(width + step);
	}

	// Where the list stands, for the edges above and below it: each shows only while
	// something is hidden on its side.
	let scroller: HTMLDivElement | undefined = $state();
	let scrollContent: HTMLDivElement | undefined = $state();
	let scrolledFromTop = $state(false);
	let scrolledFromEnd = $state(false);
	function measureScroll() {
		if (!scroller) return;
		const { scrollTop, scrollHeight, clientHeight } = scroller;
		scrolledFromTop = scrollTop > 0;
		scrolledFromEnd = scrollTop + clientHeight < scrollHeight - 1;
	}
	// The list grows and the column resizes without a scroll event.
	$effect(() => {
		if (!scroller || !scrollContent) return;
		const observer = new ResizeObserver(measureScroll);
		observer.observe(scroller);
		observer.observe(scrollContent);
		return () => observer.disconnect();
	});

	function newChat() {
		goto(generateNewUrl(Sitemap.SESSIONS));
	}
</script>

<!-- Desktop: an in-flow rail or full column. Mobile: a drawer over the page,
     sliding in from the left and out of reach (`inert`) once closed. It spans the
     display top to bottom; only the side is its own business, in landscape where
     the sensor housing eats into one edge.

     The blocks inside lay themselves out at `--column-w`, the width the column is
     going to, which is the drawer's on a phone and the chosen width or the rail's
     on a desktop. -->
<nav
	bind:this={navEl}
	style="--sidebar-w: {width}px"
	class="[--column-w:var(--drawer-w)] {showRail
		? 'lg:[--column-w:4rem]'
		: 'lg:[--column-w:var(--sidebar-w)]'} app-drawer fixed inset-y-0 left-0 z-40 h-full w-[calc(var(--drawer-w)+var(--safe-left))] shrink-0 ease-out motion-reduce:transition-none max-lg:pl-[var(--safe-left)] lg:relative lg:z-30 lg:translate-x-0
		{$mobileDrawerOpen ? 'max-lg:shadow-2xl' : 'max-lg:-translate-x-full'}
		{dragWidth === null ? 'lg:transition-[width] lg:duration-300' : 'select-none'}
		{$settingsStore.sidebarExpanded ? 'lg:w-[var(--sidebar-w)]' : 'lg:w-16'}"
	inert={!$isDesktop && !$mobileDrawerOpen}
	aria-label="Main navigation"
	data-testid="sidebar"
>
	<!-- The column proper, and the only thing that clips. Its own box so the handle
	     below can sit astride its edge: the clip would cut off whatever crosses it.

	     It carries the column's material as well as its frame. The blocks inside are
	     laid out at the width the column is going to, so while it narrows there is a
	     strip between them and the border: painted, that strip is the column still
	     closing; bare, it was a lit window showing the wallpaper straight through. -->
	<div class="border-shade-3 relative flex h-full overflow-hidden lg:border-r-[0.5px]">
		<!-- The blocks fill this, each holding its contents at the width the column is
		     going to.

		     The split is theirs rather than this box's. Pin a whole column at its target
		     width and the frame keeps animating around it, leaving a strip nothing
		     paints. Let the column follow the frame instead and everything inside
		     re-wraps sixty times a second, which looked like boiling rather than
		     opening. Separated, each block paints out to the edge at every frame while
		     its contents stay put. -->
		<div class="flex h-full w-full flex-col">
			<SidebarBrand rail={showRail} onNewChat={newChat} scrolled={scrolledFromTop} />

			<!-- Sideways overflow is hidden rather than scrolled, since while the column
			     narrows it is wider than its frame. -->
			<div
				bind:this={scroller}
				onscroll={measureScroll}
				class="surface-column min-h-0 flex-1 overflow-y-auto"
				style="overscroll-behavior-y: contain; overflow-x: hidden"
			>
				<div bind:this={scrollContent}>
					<SidebarActions personas={personaLaunchers} sessions={visibleSessions} rail={showRail} />
					{#if !showRail}
						<SidebarSessions sessions={visibleSessions} {personaById} />
					{/if}
				</div>
			</div>

			<SidebarFooter rail={showRail} edge={scrolledFromEnd} />
		</div>
	</div>

	<!-- Over the border, wider than it so it can be caught. A focusable separator
	     is a widget in ARIA, which Svelte's check does not know. -->
	{#if !showRail && $isDesktop}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			role="separator"
			aria-orientation="vertical"
			aria-label={$LL.resizeSidebar()}
			aria-valuemin={SIDEBAR_WIDTH.min}
			aria-valuemax={SIDEBAR_WIDTH.max}
			aria-valuenow={width}
			tabindex="0"
			onpointerdown={startResize}
			ondblclick={() => ($settingsStore.sidebarWidth = SIDEBAR_WIDTH.default)}
			onkeydown={resizeByKey}
			class="group absolute inset-y-0 -right-1.5 z-40 w-3 cursor-col-resize outline-none"
		>
			<span
				class="bg-accent absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 {dragWidth !==
				null
					? 'opacity-100'
					: ''}"
			></span>
		</div>
	{/if}
</nav>
