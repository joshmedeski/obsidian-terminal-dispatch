import { type App, FileSystemAdapter } from 'obsidian';

export interface Recipe {
  id: string;
  name: string;
  command: string;
  dispatchMethod: 'sesh' | 'exec' | 'applescript';
  seshPath?: string;
  terminalApp?: string;
  focusTerminal: boolean;
  inputPrompt?: string;
}

export interface DispatchSettings {
  seshBinaryPath: string;
  recipes: Recipe[];
}

export const DEFAULT_SETTINGS: DispatchSettings = {
  seshBinaryPath: 'sesh',
  recipes: [
    {
      id: 'claude-code',
      name: 'Send to Claude Code',
      command: "@'{{filePath}}' {{input}}",
      dispatchMethod: 'sesh',
      seshPath: '~/c/second-brain',
      focusTerminal: false,
      inputPrompt: 'Message for Claude Code',
    },
  ],
};

export function resolveVariables(
  app: App,
  _recipe: Recipe
): Record<string, string> {
  const vars: Record<string, string> = {};
  const adapter = app.vault.adapter;

  if (adapter instanceof FileSystemAdapter) {
    vars['vaultPath'] = adapter.getBasePath();
  }

  const activeFile = app.workspace.getActiveFile();
  if (activeFile && adapter instanceof FileSystemAdapter) {
    vars['filePath'] = adapter.getFullPath(activeFile.path);
    vars['fileName'] = activeFile.name;
    vars['folder'] = adapter.getFullPath(activeFile.path).replace(/\/[^/]+$/, '');

    const cache = app.metadataCache.getFileCache(activeFile);
    const frontmatterTitle = cache?.frontmatter?.['title'];
    vars['title'] = frontmatterTitle ?? activeFile.basename;
  }

  const editor = app.workspace.activeEditor?.editor;
  vars['selection'] = editor?.getSelection() ?? '';

  return vars;
}

export function renderCommand(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in variables ? variables[key] : match;
  });
}

const FILE_VARS = ['filePath', 'fileName', 'folder', 'title'];

export function needsActiveFile(command: string): boolean {
  return FILE_VARS.some((v) => command.includes(`{{${v}}}`));
}

export function needsInput(command: string): boolean {
  return command.includes('{{input}}');
}
