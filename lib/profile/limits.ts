/** Text-field length caps for the profile edit form (app/dashboard/profile),
 * shared by the client form and the PATCH /api/profile validation. */
export const MAX_DISPLAY_NAME_LENGTH = 60;
export const MAX_BIO_LENGTH = 300;

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;

/** Lowercase letters, numbers, and hyphens; must start and end with an
 * alphanumeric character. Usernames land directly in a URL path
 * (/artist/[username]), so this is deliberately stricter than the
 * signup-time auto-generated username needs to be. */
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;
