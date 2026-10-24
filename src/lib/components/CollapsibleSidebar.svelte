<script lang="ts">
	import LL from '$i18n/i18n-svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { personasStore, sessionsStore, settingsStore } from '$lib/localStorage';
	import { conversedPersonas } from '$lib/personas';
	import { SIDEBAR_WIDTH } from '$lib/settings';
	import { Sitemap } from '$lib/sitemap';
	import { mobileDrawerOpen } from '$lib/stores/sidebar';

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

	// The mobile drawer is transient and starts closed; the desktop rail is the
	// persisted `sidebarExpanded`. Separate, so the drawer never persists and the
	// two modes do not fight over one boolean.
	let isMobile = $state(false);
	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia('(max-width: 1023px)');
		const sync = () => (isMobile = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	// The desktop icon rail only exists when collapsed on desktop; mobile is always the full drawer.
	const showRail = $derived(!isMobile && !$settingsStore.sidebarExpanded);

	function expandSidebar() {
		$settingsStore.sidebarExpanded = true;
	}
	function collapseOrClose() {
		if (isMobile) mobileDrawerOpen.set(false);
		else $settingsStore.sidebarExpanded = false;
	}
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

	function newChat() {
		goto(generateNewUrl(Sitemap.SESSIONS));
	}
</script>

<!-- The drawer is pinned to the viewport, so it spans the display top to bottom.
     Only the side is its own business, in landscape where the sensor housing eats
     into one edge; the top and bottom belong to the brand and the footer.

     Four blocks in the order they are read, as neighbours in a column rather
     than layers, so what shows through them is whatever the column stands on.

     The column paints nothing and blurs everything: a colour here would stand
     between the materials and the wallpaper, and the blur has to be here rather
     than on each block, or two stacked surfaces filter their own share of the
     backdrop and leave a seam.

     Mobile: a fixed drawer pinned under the page, which the page slides aside to
     uncover. Desktop: an in-flow rail or full column. -->
<nav
	bind:this={navEl}
	style="--sidebar-w: {width}px"
	class="fixed inset-y-0 left-0 h-full w-full shrink-0 ease-out motion-reduce:transition-none max-lg:pl-[var(--safe-left)] lg:relative lg:z-30 lg:max-w-none lg:translate-x-0
		{dragWidth === null ? 'transition-[width] duration-300' : 'select-none'}
		{$settingsStore.sidebarExpanded ? 'lg:w-[var(--sidebar-w)]' : 'lg:w-16'}"
	aria-label="Main navigation"
	data-testid="sidebar"
>
	<!-- The column proper, and the only thing that clips. Its own box so the handle
	     below can sit astride its edge: the clip would cut off whatever crosses it.

	     It carries the column's material as well as its frame. The blocks inside are
	     laid out at the width the column is going to, so while it narrows there is a
	     strip between them and the border: painted, that strip is the column still
	     closing; bare, it was a lit window showing the wallpaper straight through. -->
	<div class="border-shade-3 flex h-full overflow-hidden lg:border-r">
		<!-- The blocks fill this, each holding its contents at the width the column is
		     going to.

		     The split is theirs rather than this box's. Pin a whole column at its target
		     width and the frame keeps animating around it, leaving a strip nothing
		     paints. Let the column follow the frame instead and everything inside
		     re-wraps sixty times a second, which looked like boiling rather than
		     opening. Separated, each block paints out to the edge at every frame while
		     its contents stay put. -->
		<div class="flex h-full w-full flex-col">
			<SidebarBrand rail={showRail} onCollapse={collapseOrClose} onExpand={expandSidebar} />

			<SidebarActions
				personas={personaLaunchers}
				sessions={visibleSessions}
				rail={showRail}
				onNewChat={newChat}
			/>
			{#if showRail}
				<div class="surface-column flex-1"></div>
			{:else}
				<SidebarSessions sessions={visibleSessions} {personaById} />
			{/if}

			<SidebarFooter rail={showRail} />
		</div>
	</div>

	<!-- Over the border, wider than it so it can be caught. A focusable separator
	     is a widget in ARIA, which Svelte's check does not know. -->
	{#if !showRail && !isMobile}
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
