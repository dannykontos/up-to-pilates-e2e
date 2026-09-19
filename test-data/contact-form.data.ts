import { env } from '../utils/env';

/** Valid payload used for the (opt-in) real submission test. */
export const validContactSubmission = {
  firstName: env.contact.firstName,
  lastName: env.contact.lastName,
  email: env.contact.email,
  message: `Automated E2E test message - safe to ignore/delete. Run at ${new Date().toISOString()}.`,
};
