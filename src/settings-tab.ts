import { type App, Notice, PluginSettingTab, type SettingDefinitionItem, type SettingGroupItem } from 'obsidian';
import type DispatchPlugin from './main';
import type { Recipe } from './recipes';

type RecipeField = 'name' | 'command' | 'inputPrompt' | 'focusTerminal';

const RELOAD_NOTICE = 'Reload plugin to update commands';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function recipeKey(index: number, field: RecipeField): string {
  return `recipe:${index}:${field}`;
}

function parseRecipeKey(key: string): { index: number; field: RecipeField } | undefined {
  const match = /^recipe:(\d+):(name|command|inputPrompt|focusTerminal)$/.exec(key);
  if (!match) return undefined;
  return { index: Number(match[1]), field: match[2] as RecipeField };
}

export class DispatchSettingTab extends PluginSettingTab {
  plugin: DispatchPlugin;

  constructor(app: App, plugin: DispatchPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: 'group',
        items: [
          {
            name: 'Terminal app',
            desc: 'macOS app name, e.g. WezTerm. Recipes with "Focus terminal" bring it to the front.',
            control: { type: 'text', key: 'terminalApp', placeholder: 'WezTerm' },
          },
        ],
      },
      {
        type: 'list',
        heading: 'Recipes',
        emptyState: 'No recipes yet.',
        addItem: { name: 'Add recipe', action: () => void this.addRecipe() },
        onDelete: (index) => void this.deleteRecipe(index),
        onReorder: (from, to) => void this.moveRecipe(from, to),
        items: this.plugin.settings.recipes.map((recipe, index) => this.recipePage(recipe, index)),
      },
    ];
  }

  private recipePage(recipe: Recipe, index: number): SettingGroupItem {
    return {
      type: 'page',
      name: recipe.name,
      desc: recipe.command,
      items: [
        {
          type: 'group',
          cls: 'dispatch-recipe',
          items: [
            {
              name: 'Name',
              desc: 'Shown in the command palette',
              control: { type: 'text', key: recipeKey(index, 'name') },
            },
            {
              name: 'Command',
              desc: 'Runs in the vault folder. Variables: {vault_path}, {file}, {file_name}, {file_basename}, {input}',
              control: { type: 'textarea', key: recipeKey(index, 'command'), rows: 4 },
            },
            {
              name: 'Input prompt',
              desc: "Shown when the command contains {input}. Defaults to 'Enter input'.",
              control: { type: 'text', key: recipeKey(index, 'inputPrompt') },
            },
            {
              name: 'Focus terminal',
              desc: 'Bring the terminal app to the front after the command runs',
              control: { type: 'toggle', key: recipeKey(index, 'focusTerminal') },
            },
          ],
        },
      ],
    };
  }

  getControlValue(key: string): unknown {
    if (key === 'terminalApp') return this.plugin.settings.terminalApp;
    const parsed = parseRecipeKey(key);
    const recipe = parsed && this.plugin.settings.recipes[parsed.index];
    if (!parsed || !recipe) return undefined;
    if (parsed.field === 'focusTerminal') return recipe.focusTerminal ?? false;
    return recipe[parsed.field] ?? '';
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key === 'terminalApp') {
      this.plugin.settings.terminalApp = String(value).trim();
    } else {
      const parsed = parseRecipeKey(key);
      const recipe = parsed && this.plugin.settings.recipes[parsed.index];
      if (!parsed || !recipe) return;
      this.setRecipeField(recipe, parsed.field, value);
    }
    await this.plugin.saveSettings();
  }

  private setRecipeField(recipe: Recipe, field: RecipeField, value: unknown): void {
    switch (field) {
      case 'name':
        recipe.name = String(value);
        recipe.id = slugify(recipe.name);
        new Notice(RELOAD_NOTICE);
        break;
      case 'command':
        recipe.command = String(value);
        break;
      case 'inputPrompt':
        recipe.inputPrompt = String(value) || undefined;
        break;
      case 'focusTerminal':
        recipe.focusTerminal = value === true || undefined;
        break;
    }
  }

  private async addRecipe(): Promise<void> {
    this.plugin.settings.recipes.push({ id: `recipe-${Date.now()}`, name: 'New Recipe', command: '' });
    await this.plugin.saveSettings();
    this.update();
  }

  private async deleteRecipe(index: number): Promise<void> {
    this.plugin.settings.recipes.splice(index, 1);
    await this.plugin.saveSettings();
    new Notice(RELOAD_NOTICE);
    this.update();
  }

  private async moveRecipe(from: number, to: number): Promise<void> {
    const [recipe] = this.plugin.settings.recipes.splice(from, 1);
    if (!recipe) return;
    this.plugin.settings.recipes.splice(to, 0, recipe);
    await this.plugin.saveSettings();
    this.update();
  }
}
