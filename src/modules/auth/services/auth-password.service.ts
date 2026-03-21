import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class AuthPasswordService {
  private readonly DEFAULT_ARGON2_TIME_COST = 3;
  private readonly DEFAULT_ARGON2_MEMORY_COST = 65536;
  private readonly DEFAULT_ARGON2_PARALLELISM = 1;
  private readonly DEFAULT_ARGON2_HASH_LENGTH = 32;
  private readonly PASSWORD_ALGORITHM_ARGON2ID = 'argon2id';

  /** @description 비밀번호 해시 알고리즘 이름을 반환한다. */
  get algorithm(): string {
    return this.PASSWORD_ALGORITHM_ARGON2ID;
  }

  /** @description Argon2 옵션 숫자 값을 범위 검증 후 파싱한다. */
  private parseArgon2Number(
    value: string | undefined,
    fallback: number,
    min: number,
    max: number,
  ): number {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= min && parsed <= max) {
      return parsed;
    }
    return fallback;
  }

  /** @description 환경변수를 기반으로 Argon2 해시 옵션을 구성한다. */
  private getArgon2Options(): argon2.Options & { raw?: false } {
    return {
      type: argon2.argon2id,
      timeCost: this.parseArgon2Number(
        process.env.ARGON2_TIME_COST,
        this.DEFAULT_ARGON2_TIME_COST,
        2,
        10,
      ),
      memoryCost: this.parseArgon2Number(
        process.env.ARGON2_MEMORY_COST,
        this.DEFAULT_ARGON2_MEMORY_COST,
        19456,
        262144,
      ),
      parallelism: this.parseArgon2Number(
        process.env.ARGON2_PARALLELISM,
        this.DEFAULT_ARGON2_PARALLELISM,
        1,
        8,
      ),
      hashLength: this.parseArgon2Number(
        process.env.ARGON2_HASH_LENGTH,
        this.DEFAULT_ARGON2_HASH_LENGTH,
        16,
        64,
      ),
    };
  }

  /** @description 평문 비밀번호를 Argon2로 해시한다. */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, this.getArgon2Options());
  }

  /** @description 저장된 비밀번호와 입력 비밀번호를 검증한다. */
  async verifyPassword(
    pwd: string | null,
    pwdHash: string | null,
    incomingPassword: string,
  ): Promise<boolean> {
    if (pwd && pwdHash) {
      const passwordAlgorithm = pwdHash.toLowerCase();
      if (passwordAlgorithm !== this.PASSWORD_ALGORITHM_ARGON2ID) {
        return false;
      }

      try {
        return await argon2.verify(pwd, incomingPassword);
      } catch {
        return false;
      }
    }

    if (pwdHash && pwdHash.startsWith('$argon2')) {
      try {
        return await argon2.verify(pwdHash, incomingPassword);
      } catch {
        return false;
      }
    }

    return false;
  }
}
