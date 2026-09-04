import { type App, Modal } from 'obsidian';

export class InputModal extends Modal {
  private promptText: string;
  private submitted = false;
  private result: string | null = null;
  private resolvePromise: ((value: string | null) => void) | null = null;

  constructor(app: App, promptText: string) {
    super(app);
    this.promptText = promptText;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('p', { text: this.promptText });

    const inputEl = contentEl.createEl('input', { type: 'text' });
    inputEl.style.width = '100%';
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submitted = true;
        this.result = inputEl.value;
        this.close();
      }
    });

    inputEl.focus();
  }

  onClose() {
    this.contentEl.empty();
    if (this.resolvePromise) {
      this.resolvePromise(this.submitted ? this.result : null);
      this.resolvePromise = null;
    }
  }

  prompt(): Promise<string | null> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.open();
    });
  }
}
