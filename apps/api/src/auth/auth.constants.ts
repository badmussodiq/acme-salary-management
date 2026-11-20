export const SESSION_COOKIE = 'acme_session';

export const LOGIN_THROTTLE = { default: { limit: 5, ttl: 60_000 } } as const;
export const WRITE_THROTTLE = { default: { limit: 30, ttl: 60_000 } } as const;
export const INSIGHTS_THROTTLE = { default: { limit: 60, ttl: 60_000 } } as const;
