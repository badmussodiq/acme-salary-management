export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

export interface LockState {
  readonly failedLoginCount: number;
  readonly lockedUntil: Date | null;
}

export const isLocked = (state: LockState, now: Date): boolean =>
  state.lockedUntil !== null && state.lockedUntil.getTime() > now.getTime();

export const afterFailedLogin = (state: LockState, now: Date): LockState => {
  const failedLoginCount = state.failedLoginCount + 1;
  if (failedLoginCount < MAX_FAILED_LOGINS) {
    return { failedLoginCount, lockedUntil: state.lockedUntil };
  }
  return {
    failedLoginCount: 0,
    lockedUntil: new Date(now.getTime() + LOCKOUT_MINUTES * 60_000),
  };
};

export const afterSuccessfulLogin = (): LockState => ({ failedLoginCount: 0, lockedUntil: null });
