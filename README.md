<p align="center">
  <img src="docs/banner.jpeg" alt="A note travels through a pneumatic tube from the Obsidian crystal to a terminal" />
</p>

<h1 align="center">Terminal Dispatch</h1>

<p align="center">
  <a href="https://obsidian.md">
    <img alt="Obsidian plugin" src="https://img.shields.io/badge/Obsidian-plugin-7c3aed?logo=obsidian&logoColor=white" />
  </a>
  <img alt="Desktop only" src="https://img.shields.io/badge/desktop-only-1f1f1f" />
  <a href="https://code.claude.com">
    <img alt="Works with Claude Code" src="https://img.shields.io/badge/works_with-Claude_Code-ff5a36" />
  </a>
</p>

Send the note you are looking at to a terminal command or coding agent, and hear
back when the agent is done, without leaving Obsidian.

- 📜 **Recipes:** turn any shell command into an Obsidian command palette entry
- 🧩 **Variables:** fill in the vault path, active file, its frontmatter properties, or text you type when it runs
- 🏷️ **Frontmatter properties:** point a recipe at the note's own repo or issue with `{prop:name}`
- 🤖 **Coding agents:** hand the note to Claude Code, Codex, or any CLI agent in a new terminal window
- 🔔 **Hear back:** a status bar count of running Claude Code sessions, and a Notice when one finishes or needs you
- 🪟 **Focus terminal:** optionally bring your terminal app to the front after dispatching
- 🧠 **Agent skill:** teach your coding agent to write recipes for you
- 🔒 **Private:** no network requests, and it runs only the commands you write

Terminal Dispatch turns **recipes** into Obsidian commands. A recipe is a name plus a shell
command. The command runs in the vault folder, and these variables are filled in first:

| Variable | Value |
|---|---|
| `{vault_path}` | Absolute path to the vault |
| `{file}` | Absolute path to the active file, wrapped in single quotes |
| `{file_name}` | Active file name, with extension |
| `{file_basename}` | Active file name, without extension |
| `{prop:name}` | The active file's `name` frontmatter property. Lists join with commas. The recipe won't run if the property is missing. |
| `{input}` | Text you type into a prompt when the command runs |

If the command contains `{input}`, Terminal Dispatch asks for it first. The recipe's
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

Turn on a recipe's **Focus terminal** to bring your terminal to the front after the
command runs. Set the app name (e.g. `WezTerm`) under **Terminal app** at the top of
the settings tab. This uses `open -a`, so it is macOS only.

Recipes live in the plugin's settings tab, or in its `data.json` if you'd rather
edit them by hand. The plugin picks up changes to `data.json` as soon as the file is
saved, so a recipe added there shows up in the palette without a reload.

## Hearing back from Claude Code

Terminal Dispatch can show what Claude Code sessions in your vault are doing:

- the status bar shows `Claude: N running`
- a Notice appears when a session finishes (`Claude finished: <prompt>`)
- a Notice appears when a session stops to ask you something (`Claude needs you: <prompt>`)

Claude Code reports its state through hooks that you add to your vault. Each hook
writes a small JSON file to `~/.local/state/terminal-dispatch/` (or
`$XDG_STATE_HOME/terminal-dispatch/`), and Terminal Dispatch watches that folder. If you don't
add the hooks, the folder stays empty and Terminal Dispatch shows nothing.

Save this as `<your-vault>/.claude/hooks/dispatch-state.sh` and make it executable
(`chmod +x`). It needs [`jq`](https://jqlang.org).

```bash
#!/bin/bash
DIR="${XDG_STATE_HOME:-$HOME/.local/state}/terminal-dispatch"
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

## Agent skill

The [`terminal-dispatch-recipes`](skills/terminal-dispatch-recipes/SKILL.md) skill
teaches a coding agent (Claude Code, Codex, and others that read `SKILL.md`) to write
recipes for you: where `data.json` lives, how to quote each variable, and worked
examples. Install it with:

```
npx skills add joshmedeski/obsidian-terminal-dispatch
```

Or copy `skills/terminal-dispatch-recipes/` into your agent's skills folder, e.g.
`~/.claude/skills/`. Then ask your agent for a recipe ("make a Terminal Dispatch
recipe that opens this note in Neovim").

## Permissions and privacy

Terminal Dispatch runs commands on your machine, so it uses capabilities beyond the
Obsidian vault API:

- **Shell execution.** Recipes run through `child_process` in the vault folder. It only
  runs commands you write in your own recipes, and only when you trigger them. **Focus
  terminal** runs `open -a` with the app name you set.
- **Filesystem access outside the vault.** It reads Claude Code session state from
  `~/.local/state/terminal-dispatch/` (or `$XDG_STATE_HOME/terminal-dispatch/`), and
  creates that folder if it is missing. Apart from what your recipes do, it reads and writes
  nothing else outside the vault.
- **Environment variables.** It reads `HOME` and `XDG_STATE_HOME` to find that folder and
  to add common tool locations (Homebrew, `~/.local/bin`, `~/.cargo/bin`, `~/go/bin`)
  to `PATH`, so your recipes can find installed tools.

It makes no network requests and sends no data anywhere.

## Requirements

Desktop only. It shells out to your local machine.

## Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest).
2. Drop them in `<your-vault>/.obsidian/plugins/terminal-dispatch/`.
3. Enable **Terminal Dispatch** in Settings → Community Plugins.

## Development

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the dev loop and [`AGENTS.md`](./AGENTS.md)
for build and release conventions.
