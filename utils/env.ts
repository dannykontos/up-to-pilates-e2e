/**
 * Centralised access to environment-driven configuration.
 * Keeping this in one place means no test file reads `process.env` directly.
 */

const DEFAULT_BASE_URL = 'https://uptopilates.ro/';

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export const env = {
  baseURL: normalizeBaseUrl(process.env.BASE_URL || DEFAULT_BASE_URL),

  // Contact form submission hits production and can create real
  // notifications/emails, so it stays off unless explicitly enabled
  // (e.g. against a staging environment).
  enableContactSubmission: process.env.ENABLE_CONTACT_SUBMISSION === 'true',

  contact: {
    firstName: process.env.TEST_CONTACT_FIRST_NAME || 'QA',
    lastName: process.env.TEST_CONTACT_LAST_NAME || 'Automation',
    email: process.env.TEST_CONTACT_EMAIL || 'qa-automation@example.com',
  },

  isCI: process.env.CI === 'true' || process.env.CI === '1',
};
