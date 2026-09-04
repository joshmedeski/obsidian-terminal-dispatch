import { Notice, Plugin } from 'obsidian';
import {
  DEFAULT_SETTINGS,
  type DispatchSettings,
  needsActiveFile,
  needsInput,
  renderCommand,
  resolveVariables,
} from './recipes';
import type { Recipe } from './recipes';
import {
  dispatchApplescript,
  dispatchExec,
  dispatchSesh,
  focusApp,
} from './dispatch';
import { InputModal } from './input-modal';
import { DispatchSettingTab } from './settings-tab';

export default class DispatchPlugin extends Plugin {
  settings: DispatchSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new DispatchSettingTab(this.app, this));
    this.registerRecipeCommands();
  }

  private registerRecipeCommands() {
    for (const recipe of this.settings.recipes) {
      this.addCommand({
        id: `dispatch:${recipe.id}`,
        name: `Dispatch: ${recipe.name}`,
        callback: () => this.executeRecipe(recipe),
      });
    }
  }

  private async executeRecipe(recipe: Recipe) {
    try {
      if (needsActiveFile(recipe.command) && !this.app.workspace.getActiveFile()) {
        new Notice('No active file - cannot dispatch.');
        return;
      }

      const variables = resolveVariables(this.app, recipe);

      if (needsInput(recipe.command)) {
        const modal = new InputModal(
          this.app,
          recipe.inputPrompt ?? 'Enter input'
        );
        const input = await modal.prompt();
        if (input === null) return;
        variables['input'] = input;
      }

      const command = renderCommand(recipe.command, variables);

      switch (recipe.dispatchMethod) {
        case 'sesh':
          if (!recipe.seshPath) {
            new Notice('No sesh path configured for this recipe.');
            return;
          }
          await dispatchSesh(this.settings.seshBinaryPath, recipe.seshPath, command);
          break;
        case 'exec':
          await dispatchExec(command);
          break;
        case 'applescript':
          if (!recipe.terminalApp) {
            new Notice('No terminal app configured for AppleScript dispatch.');
            return;
          }
          await dispatchApplescript(command, recipe.terminalApp);
          break;
      }

      if (recipe.focusTerminal && recipe.terminalApp) {
        await focusApp(recipe.terminalApp);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('not found') || message.includes('No such file')) {
        new Notice('sesh not found. Install it or use a different dispatch method.');
      } else {
        new Notice(`Dispatch error: ${message}`);
      }
    }
  }

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
