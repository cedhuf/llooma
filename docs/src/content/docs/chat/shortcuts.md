---
title: Commands and shortcuts
description: What the composer understands, and what the keyboard does.
sidebar:
  order: 1
---

The same list lives in the app under _Settings → Interface_, generated from what the code actually
listens for, so it cannot drift from this page without both being wrong.

## Slash commands

Type `/` at the start of an empty message and the command menu appears.

| Command    | What it does                                                               |
| ---------- | -------------------------------------------------------------------------- |
| `/compact` | [Summarises the conversation so far](/chat/compaction/) to free up context |

That is the whole list today. User-defined commands are on the [roadmap](/roadmap/); the menu
and the parser exist, what is missing is entries you write yourself.

### The parsing rule

A command is recognised only when **the whole message is a single line naming it**. Everything else
is sent as typed:

- `/compact` runs the command.
- `/home/cedric/notes.md` is a message, because no command is called `home`.
- `/compact` followed by a second line is a message, because you are clearly writing one.
- `//compact` is a message reading `/compact`, which is how you send a line that really does start
  with a slash.

An unknown `/word` goes out as text rather than raising an error. Refusing to send someone's message
because it opened with a slash would be worse than sending it.

A command that cannot run right now stays listed and greys out with the reason, instead of vanishing.
A missing entry reads as a broken feature; a disabled one reads as a feature with nothing to do.

## Keyboard

**Anywhere**

| Keys               | Action                    |
| ------------------ | ------------------------- |
| `Ctrl`/`Cmd` + `K` | Search your conversations |

**Writing a message**

| Keys            | Action   |
| --------------- | -------- |
| `Enter`         | Send     |
| `Shift`+`Enter` | New line |

In the expanded composer the two swap: `Ctrl`/`Cmd` + `Enter` sends and `Enter` inserts a line, so a
long message can be written without firing on every return.

**Command menu**

| Keys    | Action   |
| ------- | -------- |
| `↑` `↓` | Move     |
| `Tab`   | Complete |
| `Enter` | Run      |
| `Esc`   | Close    |

**Search dialog**

| Keys    | Action |
| ------- | ------ |
| `↑` `↓` | Move   |
| `Enter` | Open   |
| `Esc`   | Close  |

**Dialogs**

| Keys    | Action            |
| ------- | ----------------- |
| `↑` `↓` | Move between tabs |
| `Esc`   | Close             |

Customising any of this is not possible yet.

## Asking from the address bar

A question can be sent to Llooma straight from the browser's address bar. Under _Settings →
Interface_, _Ask from the address bar_ builds the link for a model of your choice:

```
https://your-instance/sessions?q=%s&model=llama3&server=…
```

Add it to your browser as a search engine with a keyword, `ll` for instance. Typing `ll` and then a
question in the address bar opens a new conversation with that question already asked. `%s` is where
the browser puts what you typed.

The link names the model and the connection it runs on, since the same model can be offered by two
connections. Each use opens a conversation of its own. `&search=1` turns web search on for it.
