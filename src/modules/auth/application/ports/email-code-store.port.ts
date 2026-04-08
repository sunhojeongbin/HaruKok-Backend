export const EMAIL_CODE_STORE = Symbol('EMAIL_CODE_STORE');

export type EmailCodeStoreEntry = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  sendAvailableAt: number;
  resendCount: number;
  resendRateLimitUntil: number | null;
  verifyLockedUntil: number | null;
};

export interface EmailCodeStorePort {
  get(email: string): Promise<EmailCodeStoreEntry | null>;
  set(email: string, entry: EmailCodeStoreEntry): Promise<void>;
  delete(email: string): Promise<void>;
}
