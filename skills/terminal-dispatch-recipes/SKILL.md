---
name: terminal-dispatch-recipes
description: Create or edit Terminal Dispatch recipes, the shell commands the Terminal Dispatch Obsidian plugin runs from the command palette. Use when the user wants a new recipe, wants to change or fix an existing one, or asks how to send the current note to a terminal, tmux, or a coding agent from Obsidian.
---

# Terminal Dispatch recipes

A **recipe** is a name plus a shell command. Terminal Dispatch fills the command's
variables, runs it, and registers it as an Obsidian command. Recipes live in the
plugin's `data.json`, which you edit directly.

## Steps

### 1. Find the data file

The file is `<vault>/.obsidian/plugins/terminal-dispatch/data.json`. `.obsidian` is
Obsidian's default config folder; a vault can rename it, so if it is missing, look
for the folder holding `plugins/terminal-dispatch/`. Ask for the vault path when it
is not the current directory.

If `data.json` does not exist yet, the plugin is still on its built-in defaults. Ask
the user to open **Settings → Terminal Dispatch** and change any field once, which
writes the file. Writing a fresh file yourself replaces the default recipes.

Done when you have read the current `data.json`.

### 2. Draft the command

Pick the variables the command needs and quote them per the
[variables table](#variables). Check it against [runtime](#runtime): a command that
outlives 30 seconds gets killed, so hand long work to tmux, sesh, or a detached
process.

Done when every variable in the command is quoted the way its row says.

### 3. Add the recipe

Append an object to `recipes`:

| Field | Value |
|---|---|
| `id` | The name lowercased, runs of non-alphanumerics replaced with `-`, ends trimmed. Unique within `recipes`. |
| `name` | What shows in the command palette. |
| `command` | The command from step 2, JSON-escaped: every `"` becomes `\"`, every `\` becomes `\\`. |
| `inputPrompt` | Modal label. Only when the command contains `{input}`; omit it otherwise. |
| `focusTerminal` | `true` to bring the terminal to the front after the command succeeds. Needs top-level `terminalApp` set to a macOS app name, e.g. `"WezTerm"`. |

When editing an existing recipe, keep its `id`. Hotkeys are stored against
`terminal-dispatch:dispatch:<id>`, so a new id silently drops the user's hotkey.

Done when `jq . data.json` parses and every `id` is unique.

### 4. Reload

Nothing to do. The plugin reloads `data.json` when it changes on disk and
re-registers its commands, so new recipes appear in the command palette right
away.

## Variables

| Variable | Value | Quoting |
|---|---|---|
| `{vault_path}` | Absolute vault path | Bare. Wrap in single quotes: `'{vault_path}'`. |
| `{file}` | Absolute path of the active note | Arrives wrapped in single quotes. Use it bare. Inside a double-quoted string those single quotes become literal characters. |
| `{file_name}` | Active note's file name with extension | Bare. Wrap in single quotes. |
| `{file_basename}` | Active note's file name without extension | Bare. Wrap in single quotes. |
| `{prop:name}` | Active note's `name` frontmatter property. Numbers come out as written (`12`), lists join with commas. | Raw. Wrap in single quotes. |
| `{input}` | Text the user types into a modal when the command runs | Raw. Wrap in double quotes: the user's text then survives apostrophes, while a `"`, `$`, or backtick they type still reaches the shell. |

Any other `{name}` stays in the command as literal text.

## Runtime

- Runs through `/bin/sh` with the vault folder as the working directory.
- `PATH` gets `/opt/homebrew/bin`, `/opt/homebrew/sbin`, `/usr/local/bin`,
  `~/go/bin`, `~/.local/bin`, and `~/.cargo/bin` prepended; Obsidian launched from
  the Dock otherwise sees a bare system `PATH`.
- 30-second timeout.
- stdout is discarded. On failure, stderr shows in an Obsidian notice.
- A command that uses `{file}`, `{file_name}`, or `{file_basename}` refuses to run
  without an active note.
- A command that uses `{prop:name}` refuses to run when the active note has no
  `name` property, or an empty one.
- Desktop only. `focusTerminal` uses `open -a`, so macOS only.

## Examples

Each is a `recipes` entry, already JSON-escaped.

Send the note to Claude Code in a new tmux window of the vault's
[sesh](https://github.com/joshmedeski/sesh) session:

```json
{
  "id": "send-to-claude-code",
  "name": "Send to Claude Code",
  "command": "sesh window connect --target '{vault_path}' --switch --command \"claude \\\"@{file} {input}\\\"\"",
  "inputPrompt": "Message for Claude Code",
  "focusTerminal": true
}
```

Run Claude headless and let it edit files. `--background` keeps the window out of
the way, and the window closes when Claude exits:

```json
{
  "id": "claude-code-accept-edits",
  "name": "Claude Code (accept edits)",
  "command": "sesh window connect --target '{vault_path}' --switch --background --command \"claude -p --permission-mode acceptEdits \\\"@{file} {input}\\\"\"",
  "inputPrompt": "Message for Claude Code"
}
```

Open the note in Neovim in a new tmux window (needs a running tmux server):

```json
{
  "id": "open-in-neovim",
  "name": "Open in Neovim",
  "command": "tmux new-window -c '{vault_path}' nvim {file}",
  "focusTerminal": true
}
```

Copy the note's absolute path:

```json
{
  "id": "copy-file-path",
  "name": "Copy file path",
  "command": "printf %s {file} | pbcopy"
}
```

Reveal the note in Finder:

```json
{
  "id": "reveal-in-finder",
  "name": "Reveal in Finder",
  "command": "open -R {file}"
}
```

Commit the whole vault with a typed message:

```json
{
  "id": "commit-vault",
  "name": "Commit vault",
  "command": "git add -A && git commit -m \"{input}\"",
  "inputPrompt": "Commit message"
}
```

Append a line to an inbox note:

```json
{
  "id": "append-to-inbox",
  "name": "Append to inbox",
  "command": "printf '%s\\n' \"{input}\" >> '{vault_path}/Inbox.md'",
  "inputPrompt": "Add to inbox"
}
```
