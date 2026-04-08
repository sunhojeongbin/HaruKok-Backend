import { Injectable } from '@nestjs/common';
import {
  EmailCodeStoreEntry,
  EmailCodeStorePort,
} from '../../application/ports/email-code-store.port';

@Injectable()
export class InMemoryEmailCodeStore implements EmailCodeStorePort {
  private readonly store = new Map<string, EmailCodeStoreEntry>();

  get(email: string): Promise<EmailCodeStoreEntry | null> {
    return Promise.resolve(this.store.get(email) ?? null);
  }

  set(email: string, entry: EmailCodeStoreEntry): Promise<void> {
    this.store.set(email, entry);
    return Promise.resolve();
  }

  delete(email: string): Promise<void> {
    this.store.delete(email);
    return Promise.resolve();
  }
}
