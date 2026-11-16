import { Notice, Plugin } from 'obsidian';
import {
  DEFAULT_SETTINGS,
  type DispatchSettings,
  type Recipe,
  needsActiveFile,
  needsInput,
  renderCommand,
  resolveVariables,
  vaultPath,
} from './recipes';
import { focusApp, run } from './dispatch';
import { InputModal } from './input-modal';
import { watchClaude } from './claude-state';
import { DispatchSettingTab } from './settings-tab';

export default class DispatchPlugin extends Plugin {
  settings: DispatchSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new DispatchSettingTab(this.app, this));
    watchClaude(this);
    for (const recipe of this.settings.recipes) {
      this.addCommand({
        id: `dispatch:${recipe.id}`,
        name: recipe.name,
        callback: () => this.executeRecipe(recipe),
      });
    }
  }

  private async executeRecipe(recipe: Recipe) {
    if (needsActiveFile(recipe.command) && !this.app.workspace.getActiveFile()) {
      new Notice('No active file - cannot dispatch.');
      return;
    }

    const variables = resolveVariables(this.app);

    if (needsInput(recipe.command)) {
      const input = await new InputModal(this.app, recipe.inputPrompt || 'Enter input').prompt();
      if (input === null) return;
      variables['input'] = input;
    }

    try {
      await run(renderCommand(recipe.command, variables), vaultPath(this.app));
      if (recipe.focusTerminal) await this.focusTerminal();
    } catch (err) {
      new Notice(`Dispatch error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async focusTerminal() {
    if (!this.settings.terminalApp) {
      new Notice('Set a terminal app in Terminal Dispatch settings to focus it.');
      return;
    }
    await focusApp(this.settings.terminalApp);
  }

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
