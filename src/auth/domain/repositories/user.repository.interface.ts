import type { UserEntity } from '../entities/user.entity';
import { UserRole } from '../../../shared/domain/enums/user-role.enum';

export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  findByRole(role: UserRole): Promise<UserEntity | null>;
  existsByEmail(email: string): Promise<boolean>;
}

