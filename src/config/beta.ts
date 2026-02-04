/**
 * Beta Access Configuration
 * 
 * Set BETA_MODE_ENABLED to false to disable beta restrictions
 * This allows easy removal of beta blocking when app is ready for public launch
 */
export const BETA_CONFIG = {
  // Set to true for private/invite-only mode, false for public launch
  BETA_MODE_ENABLED: true,

  // Admin emails that bypass beta restrictions (always have access)
  ADMIN_EMAILS: [
    'davidv111111@gmail.com',
    'santiagov.t068@gmail.com'
  ] as string[],

  // Beta access message shown to non-allowed users
  BETA_MESSAGE: {
    title: 'Coming Soon',
    description: 'Level Audio is currently in private beta. Access is by invitation only.',
    contact: 'Contact us to request access to the beta program.'
  }
} as const;
