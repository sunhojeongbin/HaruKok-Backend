type LoginAttemptMutableState = {
  failedLoginCnt: number | null;
  lockedUntil: Date | null;
};

type LockableLoginAttemptMutableState = LoginAttemptMutableState & {
  usrStatCd: string;
};

const DEFAULT_MAX_FAILED_LOGIN_COUNT = 5;
const DEFAULT_LOCK_DURATION_MINUTES = 30;

type FailedLoginAttemptPolicyOptions = {
  maxFailedLoginCount?: number;
  lockDurationMinutes?: number;
};

/** @description 로그인 실패 시도 횟수를 반영하고, 기준 초과 시 계정을 잠근다. */
export function applyFailedLoginAttemptPolicy(
  state: LockableLoginAttemptMutableState,
  options: FailedLoginAttemptPolicyOptions = {},
): void {
  const maxFailedLoginCount =
    options.maxFailedLoginCount ?? DEFAULT_MAX_FAILED_LOGIN_COUNT;
  const lockDurationMinutes =
    options.lockDurationMinutes ?? DEFAULT_LOCK_DURATION_MINUTES;

  const nextFailedCount = (state.failedLoginCnt ?? 0) + 1;
  state.failedLoginCnt = nextFailedCount;

  if (nextFailedCount >= maxFailedLoginCount) {
    state.usrStatCd = 'LOCKED';
    state.lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
  }
}

/** @description 로그인 시도 상태(실패 횟수/잠금 시각)를 초기화한다. */
export function resetLoginAttemptStatePolicy(
  state: LoginAttemptMutableState,
): void {
  state.failedLoginCnt = 0;
  state.lockedUntil = null;
}

/** @description 잠금 상태라면 ACTIVE로 복구하고 로그인 시도 상태를 초기화한다. */
export function unlockAndResetLoginAttemptStatePolicy(
  state: LockableLoginAttemptMutableState,
): void {
  if (state.usrStatCd === 'LOCKED') {
    state.usrStatCd = 'ACTIVE';
  }

  resetLoginAttemptStatePolicy(state);
}
