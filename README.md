# Dispatch

Send the note you are looking at to a terminal command or coding agent, and hear
back when the agent is done, without leaving Obsidian.

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
sesh window connect --target '{vault_path}' --switch --background --command "claude \"@{file} {input}\""
```

"Send to Claude Code (accept edits, exit)" runs Claude headless, auto-accepts file
edits, and closes its window when it finishes:

```
sesh window connect --target '{vault_path}' --switch --background --command "claude -p --permission-mode acceptEdits \"@{file} {input}\""
```

Both use `sesh window connect`, which opens a new window in the vault's session
(starting the session if needed), so they work whether or not the session is
already running.

Recipes live in the plugin's settings tab. Each one registers a command on load, so
a new recipe shows up in the palette after you reload the plugin.

## Hearing back from Claude Code

Dispatch can show what Claude Code sessions in your vault are doing:

- the status bar shows `Claude: N running`
- a Notice appears when a session finishes (`Claude finished: <prompt>`)
- a Notice appears when a session stops to ask you something (`Claude needs you: <prompt>`)

Claude Code reports its state through hooks that you add to your vault. Each hook
writes a small JSON file to `~/.local/state/obsidian-dispatch/` (or
`$XDG_STATE_HOME/obsidian-dispatch/`), and Dispatch watches that folder. If you don't
add the hooks, the folder stays empty and Dispatch shows nothing.

Save this as `<your-vault>/.claude/hooks/dispatch-state.sh` and make it executable
(`chmod +x`). It needs [`jq`](https://jqlang.org).

```bash
#!/bin/bash
DIR="${XDG_STATE_HOME:-$HOME/.local/state}/obsidian-dispatch"
mkdir -p "$DIR"

INPUT=$(cat)
ID=$(echo "$INPUT" | jq -r '.session_id // empty')
[ -z "$ID" ] && exit 0
FILE="$DIR/$ID.json"

if [ "$1" = "end" ]; then
  rm -f "$FILE"
  exit 0
fi

PREV=$(cat "$FILE" 2>/dev/null || echo '{}')
echo "$INPUT" | jq -c --arg state "$1" --argjson prev "$PREV" \
  '$prev + {state: $state, cwd, time: now} + (if .prompt then {prompt} else {} end)' \
  > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
```

Then register it in `<your-vault>/.claude/settings.json`. If you already have hooks for
these events, add these entries next to them:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/dispatch-state.sh running" }] }
    ],
    "Notification": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/dispatch-state.sh waiting" }] }
    ],
    "Stop": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/dispatch-state.sh done" }] }
    ],
    "SessionEnd": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/dispatch-state.sh end" }] }
    ]
  }
}
```

Hooks only load when a session starts, so sessions that were already open won't
show up. If a session crashes before `SessionEnd` runs, its file stays and keeps
counting as running. Delete it from the state folder to clear it.

## Requirements

Desktop only. It shells out to your local machine.

## Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest).
2. Drop them in `<your-vault>/.obsidian/plugins/obsidian-dispatch/`.
3. Enable **Dispatch** in Settings → Community Plugins.

## Development

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the dev loop and [`AGENTS.md`](./AGENTS.md)
for build and release conventions.
