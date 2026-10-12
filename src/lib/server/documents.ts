import {
	documentsDisabledByInstance,
	isDocumentName,
	readDocument,
	type Anydoc
} from '$lib/documents';

let serverAnydoc: Promise<Anydoc> | null = null;

/**
 * The module is inlined into the server bundle rather than read from disk: the
 * production image carries `build/` and no `node_modules`. Loaded on the first
 * document a bot reads, never at start.
 */
function loadOnServer(): Promise<Anydoc> {
	serverAnydoc ??= (async () => {
		const [anydoc, { default: base64 }] = await Promise.all([
			import('@firecrawl/anydoc-wasm'),
			import('@firecrawl/anydoc-wasm/anydoc_wasm_bg.wasm?base64')
		]);
		anydoc.initSync({ module: Buffer.from(base64, 'base64') });
		return anydoc;
	})();
	return serverAnydoc;
}

export function isReadableDocument(name: string): boolean {
	return !documentsDisabledByInstance && isDocumentName(name);
}

/** The server's reading of a document that reached it from elsewhere, a bot's chat room above all. Throws `DocumentWithoutText` when nothing readable comes out. */
export async function extractDocumentText(bytes: Uint8Array, name: string): Promise<string> {
	return readDocument(bytes, name, loadOnServer);
}
