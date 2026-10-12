import { redirect } from '@sveltejs/kit';

import { resolve } from '$app/paths';
import { generateRandomId } from '$lib/utils';

import type { PageLoad } from './$types';

/** A search engine's address cannot make up an id, so a question asked here opens a conversation of its own, its parameters carried along. */
export const load = (({ url }) => {
	if (url.searchParams.has('q')) {
		redirect(307, `${resolve('/sessions/[id]', { id: generateRandomId() })}${url.search}`);
	}
}) satisfies PageLoad;
