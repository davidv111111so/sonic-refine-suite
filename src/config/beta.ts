/**
 * Beta Access Configuration
 * 
 * Set BETA_MODE_ENABLED to false to disable beta restrictions
 * This allows easy removal of beta blocking when app is ready for launch
 */
export const BETA_CONFIG = {
  // Set to false to disable beta restrictions (for production launch)
  BETA_MODE_ENABLED: false,

  // Admin emails that bypass beta restrictions
  ADMIN_EMAILS: [
    'davidv111111@gmail.com',
    'santiagov.t068@gmail.com'
  ] as string[],

  // Beta access message
  BETA_MESSAGE: {
    title: 'App in Beta Stage',
    description: 'This application is currently in beta testing. Access is restricted to authorized users only.',
    contact: 'Please contact the administrator for access.'
  }
} as const;




