import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { routes } from '../test-data/urls';

export class ContactPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(routes.ro.contact);
  }

  get heading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  get form() {
    return this.page.locator('form.frm-fluent-form');
  }

  get firstNameInput() {
    return this.form.getByPlaceholder('Prenume');
  }

  get lastNameInput() {
    return this.form.getByPlaceholder('Nume de familie');
  }

  get emailInput() {
    return this.form.getByPlaceholder('Adresa de email');
  }

  get subjectInput() {
    return this.form.getByPlaceholder('Subiectul mesajului');
  }

  get messageInput() {
    return this.form.getByPlaceholder('Mesajul tău');
  }

  get consentCheckbox() {
    return this.form.getByRole('checkbox');
  }

  get submitButton() {
    return this.form.getByRole('button', { name: /trimite/i });
  }

  /** Validation error messages currently shown on the form. */
  get validationErrors() {
    return this.form.locator('[role="alert"]');
  }

  async fillValidDetails(data: { firstName: string; lastName: string; email: string; message: string }): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.messageInput.fill(data.message);
    await this.consentCheckbox.check();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
