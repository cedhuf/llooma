import { env } from '$env/dynamic/public';

/**
 * Reading a document into something a model can answer from.
 *
 * The composer reads in the browser: a file is never uploaded, it is parsed
 * where it was picked, and only the Markdown travels. A bot reads on the server,
 * from a file somebody posted in a chat room. Both go through anydoc, compiled to
 * WebAssembly, and through `readDocument` below.
 *
 * No OCR. A page that is a picture of text yields nothing, and the app says so.
 */

/** Instance-wide off switch. Read at build time like every other `PUBLIC_` flag, so nothing running in the page can talk it out of it. */
export const documentsDisabledByInstance = env.PUBLIC_DISABLE_DOCUMENTS === 'true';

/** Extensions offered in the file picker, and read by a bot. */
export const DOCUMENT_EXTENSIONS = [
	'.pdf',
	'.doc',
	'.docx',
	'.ppt',
	'.pptx',
	'.xls',
	'.xlsx',
	'.odt',
	'.odp',
	'.ods',
	'.rtf',
	'.epub',
	'.csv',
	'.md',
	'.txt'
] as const;

export const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.join(',');

export type Anydoc = typeof import('@firecrawl/anydoc-wasm');

/** Nothing a model could read came out. `detail` is what to say about it, and absent when there is nothing to add: the file held no text at all. */
export class DocumentWithoutText extends Error {
	constructor(
		name: string,
		readonly detail?: 'scanned' | 'binary'
	) {
		super(`${name} has no text to read`);
		this.name = 'DocumentWithoutText';
	}
}

/** Already what a model reads, so neither a converter nor its download is needed for one. */
const TEXT_EXTENSIONS = ['.md', '.txt'];

export function isDocumentName(name: string): boolean {
	const lower = name.toLowerCase();
	return DOCUMENT_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/**
 * The bytes as text. `strict` is for a file nobody said was text: an invalid
 * UTF-8 sequence or a NUL byte then marks it binary. A file named as text is
 * decoded leniently, so one saved in an older encoding still reads.
 */
function decodeText(bytes: Uint8Array, name: string, strict: boolean): string {
	let text: string;
	try {
		text = new TextDecoder('utf-8', { fatal: strict }).decode(bytes);
	} catch {
		throw new DocumentWithoutText(name, 'binary');
	}
	if (strict && text.includes('\0')) throw new DocumentWithoutText(name, 'binary');
	const trimmed = text.trim();
	if (!trimmed) throw new DocumentWithoutText(name);
	return trimmed;
}

/**
 * Markdown from a document's bytes, or `DocumentWithoutText`. `load` is called
 * only when a converter is needed, so a text file downloads none of it.
 *
 * anydoc reads the format from the content, so a PDF called `report.wtf` still
 * converts; a format it does not know is tried as text. CSV has no signature, so
 * it is named.
 */
export async function readDocument(
	bytes: Uint8Array,
	name: string,
	load: () => Promise<Anydoc>
): Promise<string> {
	const lower = name.toLowerCase();
	if (TEXT_EXTENSIONS.some((extension) => lower.endsWith(extension))) {
		return decodeText(bytes, name, false);
	}

	let markdown: string;
	try {
		markdown = (await load()).toMarkdownBytes(bytes, lower.endsWith('.csv') ? 'csv' : undefined);
	} catch (error) {
		const { code } = error as { code?: string };
		if (code === 'needsOcr') throw new DocumentWithoutText(name, 'scanned');
		if (code === 'unsupported') return decodeText(bytes, name, true);
		throw error;
	}
	markdown = markdown.trim();
	if (!markdown) throw new DocumentWithoutText(name);
	return markdown;
}

export interface DocumentExtraction {
	/** What gets sent, as Markdown. */
	markdown: string;
	/** Rough token cost, on the same scale the context meter uses. */
	tokens: number;
}

let browserAnydoc: Promise<Anydoc> | null = null;

/** Fetched on the first document, never before: a conversation that attaches none downloads none of it. */
function loadInBrowser(): Promise<Anydoc> {
	browserAnydoc ??= (async () => {
		const [anydoc, { default: wasmUrl }] = await Promise.all([
			import('@firecrawl/anydoc-wasm'),
			import('@firecrawl/anydoc-wasm/anydoc_wasm_bg.wasm?url')
		]);
		await anydoc.default({ module_or_path: wasmUrl });
		return anydoc;
	})();
	// A failed download is not remembered: the next attachment tries again.
	browserAnydoc.catch(() => (browserAnydoc = null));
	return browserAnydoc;
}

/** In the browser. Throws `DocumentWithoutText` when nothing readable comes out, and anything else for a file that fails to convert. */
export async function extractDocument(file: File): Promise<DocumentExtraction> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	const markdown = await readDocument(bytes, file.name, loadInBrowser);
	return { markdown, tokens: Math.ceil(markdown.length / 3.7) };
}
