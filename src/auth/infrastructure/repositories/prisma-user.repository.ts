import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {
    // PrismaService extends PrismaClient, so we can use it directly
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const created = await this.prisma.client.user.create({
      data: {
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role,
      },
    });

    return UserEntity.fromPrisma(created);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    return user ? UserEntity.fromPrisma(user) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
    });

    return user ? UserEntity.fromPrisma(user) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.client.user.count({
      where: { email },
    });

    return count > 0;
  }
}

