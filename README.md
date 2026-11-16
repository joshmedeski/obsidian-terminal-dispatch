# Dispatch

Send the note you are looking at to a terminal command, without leaving Obsidian.

Dispatch turns **recipes** into Obsidian commands. A recipe is a name plus a shell
command. The command runs in the vault folder, and these variables are filled in first:

| Variable | Value |
|---|---|
| `{vault_path}` | Absolute path to the vault |
| `{file}` | Absolute path to the active file, wrapped in single quotes |
| `{file_name}` | Active file name, with extension |
| `{file_basename}` | Active file name, without extension |
| `{input}` | Text you type into a prompt when the command runs |

If the command contains `{input}`, Dispatch asks for it first. The recipe's
**Input prompt** sets the prompt text.

## Example

The default recipes. "Send to Claude Code" opens an interactive session:

```
sesh connect '{vault_path}' --switch --background --command "claude \"@{file} {input}\""
```

"Send to Claude Code (accept edits, exit)" runs Claude headless, auto-accepts file
edits, and closes the session when it finishes:

```
sesh connect '{vault_path}' --switch --background --command "claude -p --permission-mode acceptEdits \"@{file} {input}\"; exit"
```

Recipes live in the plugin's settings tab. Each one registers a command on load, so
a new recipe shows up in the palette after you reload the plugin.

## Requirements

Desktop only. It shells out to your local machine.

## Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest).
2. Drop them in `<your-vault>/.obsidian/plugins/obsidian-dispatch/`.
3. Enable **Dispatch** in Settings → Community Plugins.

## Development

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the dev loop and [`AGENTS.md`](./AGENTS.md)
for build and release conventions.
