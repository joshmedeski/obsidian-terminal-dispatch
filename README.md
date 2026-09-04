# Dispatch

Send the note you are looking at to a terminal command, without leaving Obsidian.

Dispatch turns configurable **recipes** into Obsidian commands. Each recipe is a
command template with placeholders (`{{filePath}}`, `{{input}}`, …); running it
dispatches the rendered command to your terminal — either directly or through
[sesh](https://github.com/joshmedeski/sesh) so it lands in the right tmux session.

## Example

The default recipe, "Send to Claude Code":

```
command:        @'{{filePath}}' {{input}}
dispatchMethod: sesh
seshPath:       ~/c/second-brain
inputPrompt:    Message for Claude Code
```

Running it prompts for a message, then dispatches Claude Code against the current
note in the `second-brain` session.

## Recipe options

| Field | Purpose |
|---|---|
| `name` | The label shown in the command palette. |
| `command` | Template to run. Supports `{{filePath}}`, `{{vaultPath}}`, `{{input}}`. |
| `dispatchMethod` | `sesh` to route through a sesh session, or run directly. |
| `seshPath` | Which session/directory sesh should target. |
| `focusTerminal` | Whether to bring the terminal forward after dispatching. |
| `inputPrompt` | If set, prompts for `{{input}}` before dispatching. |

Recipes are managed in the plugin's settings tab. Each one registers its own command
on load, so a new recipe shows up in the palette after a reload.

## Requirements

Desktop only — it shells out to your local terminal. `sesh` recipes need
[sesh](https://github.com/joshmedeski/sesh) on your `PATH` (configurable via the
`seshBinaryPath` setting).

## Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest).
2. Drop them in `<your-vault>/.obsidian/plugins/obsidian-dispatch/`.
3. Enable **Dispatch** in Settings → Community Plugins.

## Development

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the dev loop and [`AGENTS.md`](./AGENTS.md)
for build and release conventions.
