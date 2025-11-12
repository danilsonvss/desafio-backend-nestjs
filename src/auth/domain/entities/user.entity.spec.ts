import { UserRole } from '../../../shared/domain/enums/user-role.enum';
import { UserEntity } from './user.entity';

describe('UserEntity', () => {
  describe('create', () => {
    it('should create a new user entity', () => {
      const email = 'test@example.com';
      const password = 'hashedPassword';
      const name = 'Test User';
      const role = UserRole.PRODUCER;

      const user = UserEntity.create(email, password, name, role);

      expect(user.email).toBe(email);
      expect(user.password).toBe(password);
      expect(user.name).toBe(name);
      expect(user.role).toBe(role);
      expect(user.id).toBe('');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('fromPrisma', () => {
    it('should create user entity from Prisma data', () => {
      const prismaData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: UserRole.AFFILIATE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const user = UserEntity.fromPrisma(prismaData);

      expect(user.id).toBe(prismaData.id);
      expect(user.email).toBe(prismaData.email);
      expect(user.password).toBe(prismaData.password);
      expect(user.name).toBe(prismaData.name);
      expect(user.role).toBe(prismaData.role);
      expect(user.createdAt).toEqual(prismaData.createdAt);
      expect(user.updatedAt).toEqual(prismaData.updatedAt);
    });
  });
});

