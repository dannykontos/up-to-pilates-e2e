import { test, expect } from '../../fixtures/pages.fixture';
import { env } from '../../utils/env';
import { validContactSubmission } from '../../test-data/contact-form.data';

test.describe('Contact form', () => {
  test('contact form and its required fields are visible', async ({ contactPage }) => {
    await contactPage.open();

    await expect(contactPage.firstNameInput).toBeVisible();
    await expect(contactPage.lastNameInput).toBeVisible();
    await expect(contactPage.emailInput).toBeVisible();
    await expect(contactPage.messageInput).toBeVisible();
    await expect(contactPage.consentCheckbox).toBeVisible();
    await expect(contactPage.submitButton).toBeVisible();
  });

  test('submitting an empty form shows validation errors and sends nothing', async ({ page, contactPage }) => {
    await contactPage.open();

    const formSubmissions: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && /admin-ajax\.php|fluentform/i.test(req.url())) {
        formSubmissions.push(req.url());
      }
    });

    await contactPage.submit();

    await expect(contactPage.validationErrors.first()).toBeVisible();
    expect(await contactPage.validationErrors.count()).toBeGreaterThan(0);
    expect(formSubmissions, 'no form submission request should be sent for an invalid submission').toHaveLength(0);
  });

  test('the required consent checkbox blocks submission until checked', async ({ page, contactPage }) => {
    await contactPage.open();

    // Fill every other field with valid data - only the consent checkbox is left unchecked.
    await contactPage.firstNameInput.fill('QA');
    await contactPage.lastNameInput.fill('Automation');
    await contactPage.emailInput.fill('qa-automation@example.com');
    await contactPage.messageInput.fill('Validation check only, consent left unchecked.');

    const formSubmissions: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && /admin-ajax\.php|fluentform/i.test(req.url())) {
        formSubmissions.push(req.url());
      }
    });

    await contactPage.submit();

    await expect(contactPage.validationErrors.first()).toBeVisible();
    expect(formSubmissions, 'no form submission request should be sent without consent').toHaveLength(0);
  });

  // Disabled by default: a real submission notifies the business and sends
  // an email. Enable only against a staging environment by setting
  // ENABLE_CONTACT_SUBMISSION=true (see .env.example).
  test('a fully valid submission succeeds', async ({ page, contactPage }) => {
    // eslint-disable-next-line playwright/no-skipped-test -- intentional production safety gate, see ENABLE_CONTACT_SUBMISSION
    test.skip(
      !env.enableContactSubmission,
      'Real submissions are disabled outside of staging - see ENABLE_CONTACT_SUBMISSION',
    );

    await contactPage.open();
    await contactPage.fillValidDetails(validContactSubmission);
    await contactPage.submit();

    await expect(page.getByText(/mulțumim|succes|thank you/i)).toBeVisible({ timeout: 15000 });
  });
});
