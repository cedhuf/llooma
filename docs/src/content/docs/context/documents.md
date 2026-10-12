---
title: Documents
description: Attach a PDF, a Word file or a spreadsheet and talk to the model about it.
sidebar:
  order: 3
---

Attach a file from the composer's _Add context_ menu and its text joins the conversation. PDF,
Word, PowerPoint and Excel, the old `.doc`, `.ppt` and `.xls` included, OpenDocument, RTF, EPUB,
CSV, Markdown and plain text. Any other file is read as it is if it turns out to be text, a log, a
config file or source code; anything else is refused, and nothing of it reaches the model.

## Nothing is uploaded

The file is read **in your browser**. Not on the server, not by a provider, not by a third-party
service. This holds in server mode too: the file never leaves the machine it was picked on. What
travels is the text that came out of it, inside the message you choose to send, to the provider
you already chose.

Which also means the feature works the same on a laptop with no server behind it as on a
self-hosted instance, and works offline.

The one exception is a [bot](/connect/bots/): a file posted in a chat room is read by the Llooma
server, since that is where the bot runs. Same reader, same output.

## What happens, step by step

1. You pick a file. Nothing is sent anywhere.
2. A pill appears with the file's name and a spinner. Large PDFs take a few seconds.
3. The file is parsed in the browser and turned into Markdown, so headings, lists and tables
   survive rather than collapsing into a wall of text.
4. The pill fills in with the name.
5. When you send your message, the extracted text goes out as a context block ahead of it, the
   same envelope [knowledge](/chat/) uses.
6. The conversation shows the pill, not the text. A hundred pages of Markdown unrolled in the
   thread would bury the conversation. The text is still in the message: still searchable, still
   exported, still counted by the load meter.

Files are read one at a time even when you attach several: the conversion runs on the page itself,
and three large files at once is how a phone kills a page.

## Keeping one

The pill on a sent document carries a Library button. It opens the knowledge editor with the
document's text already in it, so you can name and trim it before it exists, and attach it to another
conversation or to a persona afterwards. Nothing is filed automatically: a document you only needed
once should not leave anything behind.

## What does the reading

The reader is [**anydoc**](https://github.com/firecrawl/anydoc) by
[Firecrawl](https://firecrawl.dev), MIT licensed, written in Rust and compiled to WebAssembly. Every
format goes through one document model and one Markdown writer, so headings, lists, tables and
footnotes come out the same whatever went in. Llooma calls it in the browser, and the WebAssembly
module (about 2 MB compressed) is fetched the first time a document is attached, never before.

anydoc can send a scanned PDF to Firecrawl's hosted OCR. Llooma does not use that option: the
module it loads has no network access, and no file ever leaves the machine it was picked on.

## When a document has no text in it

A scanned document contains pictures of words, not words. Llooma does not read text out of
pictures, so it says the file has no text and attaches nothing. A PDF with even one scanned page is
refused whole, a current limit of anydoc tracked in
[its issue #144](https://github.com/firecrawl/anydoc/issues/144).

To use a scan anyway, take screenshots of the pages and attach them as images: a vision model reads
them directly.

## Turning it off

**As a user:** _Settings → Tools → Documents_. The reader is loaded on demand, so switching it off
means it is never downloaded at all, not merely unused. The _Document_ entry disappears from the
menu. Images are unaffected: they do not go through this.

**As an instance:** set `PUBLIC_DISABLE_DOCUMENTS=true`. The section disappears from settings
entirely and no user can turn it back on.

## What this is not

It reads a document into the conversation. It does not index a library, and there is no retrieval
step: the whole document goes into the context, and a document too large for the model's window is
too large, full stop. The [load meter](/chat/compaction/) shows what you are about to
spend before you send, and [compaction](/chat/compaction/) buys room back once the
conversation runs long.

One consequence worth stating plainly, because it surprises people: attaching a spreadsheet gives
the model the numbers as text. It does not give it a calculator. Ask a model to total ten thousand
rows and it will produce a number that looks right. Verify anything that matters.

## Why there is no retrieval

Most chat apps in this space answer documents with a full retrieval pipeline: chunking, an
embedding model, a vector database, and the settings that come with them. Chunk size, overlap,
top-k, similarity threshold. Llooma does none of that, on purpose.

For the common case, reading a contract, summarising a report, comparing two files, retrieval is
the wrong tool. It hands the model fragments it guessed were relevant and hides the rest. Putting
the whole document in the context gives better answers, needs no configuration, and cannot silently
drop the paragraph that mattered. It is telling that apps built around retrieval have all ended up
adding a "send the whole document" mode.

Retrieval earns its keep on a corpus, not on a document: hundreds of files, asked a question
without knowing which file holds the answer. That is a different feature, and Llooma does not
pretend to offer it today.

If enough people want it, the shape it would take is deliberately modest. Keyword search over the
attached documents, ranked, no embedding model to pick and no vector store to run, which means it
keeps working offline and needs no setup. The Markdown already carries the document's headings, so
the groundwork exists. Vector search would only follow if that proved genuinely insufficient.

Until then, the honest boundary is the one above: a document too large for the model's window is
too large. The [load meter](/chat/compaction/) shows the cost before you send, and
[compaction](/chat/compaction/) buys room back as the conversation runs long. If you
have a use case this does not cover, open a discussion: that is exactly the demand worth measuring
before building anything heavier.
