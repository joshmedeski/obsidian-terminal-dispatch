import { type App, Notice, PluginSettingTab, type Setting, SettingGroup } from 'obsidian';
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

    for (const recipe of this.plugin.settings.recipes) {
      this.renderRecipe(containerEl, recipe);
    }

    containerEl.createEl('button', { text: 'Add recipe', cls: 'mod-cta dispatch-add-recipe' }).onclick = async () => {
      this.plugin.settings.recipes.push({
        id: `recipe-${Date.now()}`,
        name: 'New Recipe',
        command: '',
      });
      await this.plugin.saveSettings();
      this.display();
    };
  }

  private renderRecipe(containerEl: HTMLElement, recipe: Recipe): void {
    new SettingGroup(containerEl)
      .setHeading(recipe.name)
      .addSetting((s) => this.nameSetting(s, recipe))
      .addSetting((s) => this.commandSetting(s, recipe))
      .addSetting((s) => this.inputPromptSetting(s, recipe))
      .addSetting((s) => this.deleteSetting(s, recipe));
  }

  private nameSetting(setting: Setting, recipe: Recipe): void {
    setting.setName('Name').addText((text) =>
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
  }

  private commandSetting(setting: Setting, recipe: Recipe): void {
    setting
      .setClass('dispatch-command-setting')
      .setName('Command')
      .setDesc('Runs in the vault folder. Variables: {vault_path}, {file}, {file_name}, {file_basename}, {input}')
      .addTextArea((text) =>
        text.setValue(recipe.command).onChange(async (value) => {
          recipe.command = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private inputPromptSetting(setting: Setting, recipe: Recipe): void {
    setting
      .setName('Input prompt')
      .setDesc('Shown in the {input} modal')
      .addText((text) =>
        text.setValue(recipe.inputPrompt ?? '').onChange(async (value) => {
          recipe.inputPrompt = value || undefined;
          await this.plugin.saveSettings();
        })
      );
  }

  private deleteSetting(setting: Setting, recipe: Recipe): void {
    setting.addButton((btn) =>
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
