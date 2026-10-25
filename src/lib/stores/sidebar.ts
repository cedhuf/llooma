import { get, readable, writable } from 'svelte/store';

import { browser } from '$app/environment';
import { settingsStore } from '$lib/localStorage';

/** From `lg` up the sidebar is a column beside the page; below, a drawer. Matches Tailwind's `lg`. */
export const isDesktop = readable(true, (set) => {
	if (!browser) return;
	const query = window.matchMedia('(min-width: 1024px)');
	const sync = () => set(query.matches);
	sync();
	query.addEventListener('change', sync);
	return () => query.removeEventListener('change', sync);
});

/** Transient, starting closed on every load, and separate from the persisted desktop `sidebarExpanded`: a drawer should never remember being open. */
export const mobileDrawerOpen = writable(false);

/** Opens or closes whichever the screen shows: the drawer on a phone, the column on a desktop. */
export function setSidebarOpen(open: boolean): void {
	if (get(isDesktop)) settingsStore.update((settings) => ({ ...settings, sidebarExpanded: open }));
	else mobileDrawerOpen.set(open);
}
