import { mkdirSync, readFileSync, readdirSync, watch } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { Notice, type Plugin } from 'obsidian';

type State = 'running' | 'waiting' | 'done';

interface Session {
  state: State;
  prompt?: string;
}

const STATE_DIR = join(process.env['XDG_STATE_HOME'] ?? join(homedir(), '.local/state'), 'obsidian-dispatch');
const NOTICE_MS = 10_000;

function readSession(file: string): Session | undefined {
  try {
    return JSON.parse(readFileSync(join(STATE_DIR, file), 'utf8')) as Session;
  } catch {
    return undefined;
  }
}

function label(session: Session): string {
  const prompt = session.prompt?.trim() ?? '';
  return prompt.length > 60 ? `${prompt.slice(0, 60)}…` : prompt;
}

export function watchClaude(plugin: Plugin) {
  mkdirSync(STATE_DIR, { recursive: true });
  const statusBar = plugin.addStatusBarItem();
  const sessions = new Map<string, Session>();

  const render = () => {
    const running = [...sessions.values()].filter((s) => s.state === 'running').length;
    statusBar.setText(running ? `Claude: ${running} running` : '');
  };

  for (const file of readdirSync(STATE_DIR).filter((f) => f.endsWith('.json'))) {
    const session = readSession(file);
    if (session) sessions.set(file, session);
  }
  render();

  const watcher = watch(STATE_DIR, (_event, file) => {
    if (!file?.endsWith('.json')) return;
    const prev = sessions.get(file);
    const next = readSession(file);
    if (!next) {
      sessions.delete(file);
    } else {
      sessions.set(file, next);
      if (prev?.state === 'running' && next.state === 'done') {
        new Notice(`Claude finished: ${label(next)}`, NOTICE_MS);
      } else if (prev?.state === 'running' && next.state === 'waiting') {
        new Notice(`Claude needs you: ${label(next)}`, NOTICE_MS);
      }
    }
    render();
  });
  plugin.register(() => watcher.close());
}
