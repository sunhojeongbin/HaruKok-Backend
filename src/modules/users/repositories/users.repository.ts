import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsrEntity } from '../entities/usr.entity';

type CreateUserParams = {
  usrEmail: string;
  usrName: string;
  passwordHash: string;
};

@Injectable()
export class UsersRepository {
  constructor(
    @Optional()
    @InjectRepository(UsrEntity)
    private readonly repository?: Repository<UsrEntity>,
  ) {}

  isReady(): boolean {
    return Boolean(this.repository);
  }

  async findByEmail(email: string): Promise<UsrEntity | null> {
    if (!this.repository) {
      return null;
    }

    return this.repository.findOne({
      where: { usrEmail: email },
    });
  }

  async findById(id: string): Promise<UsrEntity | null> {
    if (!this.repository) {
      return null;
    }

    return this.repository.findOne({
      where: { usrId: id },
    });
  }

  async createAndSave(params: CreateUserParams): Promise<UsrEntity> {
    if (!this.repository) {
      throw new Error('UsersRepository is not initialized');
    }

    const user = this.repository.create(params);
    return this.repository.save(user);
  }
}
