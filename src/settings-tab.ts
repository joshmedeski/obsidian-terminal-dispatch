import { type App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type DispatchPlugin from './main';
import type { Recipe } from './recipes';

export class DispatchSettingTab extends PluginSettingTab {
  plugin: DispatchPlugin;

  constructor(app: App, plugin: DispatchPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Sesh binary path')
      .setDesc('Path to the sesh binary (e.g. /opt/homebrew/bin/sesh)')
      .addText((text) =>
        text
          .setPlaceholder('sesh')
          .setValue(this.plugin.settings.seshBinaryPath)
          .onChange(async (value) => {
            this.plugin.settings.seshBinaryPath = value || 'sesh';
            await this.plugin.saveSettings();
          })
      );

    for (const recipe of this.plugin.settings.recipes) {
      this.renderRecipe(containerEl, recipe);
    }

    new Setting(containerEl).addButton((btn) =>
      btn.setButtonText('Add recipe').onClick(async () => {
        const newRecipe: Recipe = {
          id: `recipe-${Date.now()}`,
          name: 'New Recipe',
          command: '',
          dispatchMethod: 'exec',
          focusTerminal: false,
        };
        this.plugin.settings.recipes.push(newRecipe);
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }

  private renderRecipe(containerEl: HTMLElement, recipe: Recipe): void {
    const section = containerEl.createDiv({ cls: 'dispatch-recipe-section' });
    section.createEl('h3', { text: recipe.name });

    new Setting(section)
      .setName('Name')
      .addText((text) =>
        text.setValue(recipe.name).onChange(async (value) => {
          recipe.name = value;
          recipe.id = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          await this.plugin.saveSettings();
          new Notice('Reload plugin to update commands');
        })
      );

    new Setting(section)
      .setName('Command template')
      .setDesc('Use {{filePath}}, {{fileName}}, {{title}}, {{selection}}, {{input}}, etc.')
      .addText((text) =>
        text.setValue(recipe.command).onChange(async (value) => {
          recipe.command = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(section)
      .setName('Dispatch method')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('sesh', 'sesh')
          .addOption('exec', 'exec')
          .addOption('applescript', 'AppleScript')
          .setValue(recipe.dispatchMethod)
          .onChange(async (value) => {
            recipe.dispatchMethod = value as Recipe['dispatchMethod'];
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (recipe.dispatchMethod === 'sesh') {
      new Setting(section)
        .setName('Sesh path')
        .setDesc('Session path for sesh connect')
        .addText((text) =>
          text.setValue(recipe.seshPath ?? '').onChange(async (value) => {
            recipe.seshPath = value;
            await this.plugin.saveSettings();
          })
        );
    }

    new Setting(section)
      .setName('Terminal app')
      .setDesc('App name for focus/AppleScript (e.g. Ghostty, Terminal)')
      .addText((text) =>
        text.setValue(recipe.terminalApp ?? '').onChange(async (value) => {
          recipe.terminalApp = value || undefined;
          await this.plugin.saveSettings();
        })
      );

    new Setting(section)
      .setName('Focus terminal')
      .setDesc('Activate terminal app after dispatch')
      .addToggle((toggle) =>
        toggle.setValue(recipe.focusTerminal).onChange(async (value) => {
          recipe.focusTerminal = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(section)
      .setName('Input prompt')
      .setDesc('Custom prompt for {{input}} modal')
      .addText((text) =>
        text.setValue(recipe.inputPrompt ?? '').onChange(async (value) => {
          recipe.inputPrompt = value || undefined;
          await this.plugin.saveSettings();
        })
      );

    new Setting(section).addButton((btn) =>
      btn
        .setButtonText('Delete')
        .setWarning()
        .onClick(async () => {
          this.plugin.settings.recipes = this.plugin.settings.recipes.filter(
            (r) => r.id !== recipe.id
          );
          await this.plugin.saveSettings();
          new Notice('Reload plugin to update commands');
          this.display();
        })
    );
  }
}
