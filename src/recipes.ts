import { type App, FileSystemAdapter } from 'obsidian';

export interface Recipe {
  id: string;
  name: string;
  command: string;
  inputPrompt?: string;
  focusTerminal?: boolean;
}

export interface DispatchSettings {
  terminalApp: string;
  recipes: Recipe[];
}

export const DEFAULT_SETTINGS: DispatchSettings = {
  terminalApp: '',
  recipes: [
    {
      id: 'claude-code',
      name: 'Send to Claude Code',
      command: String.raw`sesh window connect --target '{vault_path}' --switch --background --command "claude \"@{file} {input}\""`,
      inputPrompt: 'Message for Claude Code',
    },
    {
      id: 'claude-code-accept-edits',
      name: 'Send to Claude Code (accept edits, exit)',
      command: String.raw`sesh window connect --target '{vault_path}' --switch --background --command "claude -p --permission-mode acceptEdits \"@{file} {input}\""`,
      inputPrompt: 'Message for Claude Code',
    },
  ],
};

export function vaultPath(app: App): string | undefined {
  const adapter = app.vault.adapter;
  return adapter instanceof FileSystemAdapter ? adapter.getBasePath() : undefined;
}

export function resolveVariables(app: App): Record<string, string> {
  const vars: Record<string, string> = {};
  const adapter = app.vault.adapter;
  if (!(adapter instanceof FileSystemAdapter)) return vars;

  vars['vault_path'] = adapter.getBasePath();

  const activeFile = app.workspace.getActiveFile();
  if (activeFile) {
    vars['file'] = `'${adapter.getFullPath(activeFile.path)}'`;
    vars['file_name'] = activeFile.name;
    vars['file_basename'] = activeFile.basename;
    const frontmatter = app.metadataCache.getFileCache(activeFile)?.frontmatter ?? {};
    for (const [key, value] of Object.entries(frontmatter)) {
      if (value != null) vars[`prop:${key}`] = formatProp(value);
    }
  }

  return vars;
}

function formatProp(value: unknown): string {
  return Array.isArray(value) ? value.join(',') : String(value);
}

export function renderCommand(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+|prop:[^{}]+)\}/g, (match: string, key: string) => variables[key] ?? match);
}

export function needsActiveFile(command: string): boolean {
  return /\{file(_name|_basename)?\}/.test(command);
}

export function missingProps(command: string, variables: Record<string, string>): string[] {
  return [...command.matchAll(/\{prop:([^{}]+)\}/g)]
    .map(([, name]) => name)
    .filter((name) => !(`prop:${name}` in variables));
}

export function needsInput(command: string): boolean {
  return command.includes('{input}');
}
