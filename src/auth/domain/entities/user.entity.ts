import { UserRole } from '../../../shared/domain/enums/user-role.enum';

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly role: UserRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ): UserEntity {
    const now = new Date();
    return new UserEntity(
      '', // id será gerado pelo banco
      email,
      password,
      name,
      role,
      now,
      now,
    );
  }

  static fromPrisma(data: {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole | string;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return new UserEntity(
      data.id,
      data.email,
      data.password,
      data.name,
      data.role as UserRole,
      data.createdAt,
      data.updatedAt,
    );
  }
}

