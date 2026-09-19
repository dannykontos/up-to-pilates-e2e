import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { routes } from '../test-data/urls';

export class ReformerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(routes.ro.reformer);
  }

  get heading() {
    return this.page.getByRole('heading', { level: 1 });
  }
}
