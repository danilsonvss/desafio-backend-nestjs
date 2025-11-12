import { UserResponseDto } from './user-response.dto';
import { UserEntity } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../../shared/domain/enums/user-role.enum';

describe('UserResponseDto', () => {
  describe('fromEntity', () => {
    it('should create DTO from UserEntity', () => {
      const user = new UserEntity(
        '123',
        'test@example.com',
        'hashedPassword',
        'Test User',
        UserRole.PRODUCER,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      const dto = UserResponseDto.fromEntity(user);

      expect(dto).toBeInstanceOf(UserResponseDto);
      expect(dto.id).toBe('123');
      expect(dto.email).toBe('test@example.com');
      expect(dto.name).toBe('Test User');
      expect(dto.role).toBe(UserRole.PRODUCER);
      expect(dto.createdAt).toEqual(new Date('2024-01-01'));
      expect(dto.updatedAt).toEqual(new Date('2024-01-02'));
    });

    it('should not include password in response', () => {
      const user = new UserEntity(
        '123',
        'test@example.com',
        'hashedPassword',
        'Test User',
        UserRole.PRODUCER,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      const dto = UserResponseDto.fromEntity(user);

      expect(dto).not.toHaveProperty('password');
    });

    it('should handle all user roles correctly', () => {
      const roles = [
        UserRole.PRODUCER,
        UserRole.AFFILIATE,
        UserRole.COPRODUCER,
        UserRole.PLATFORM,
      ];

      roles.forEach((role) => {
        const user = new UserEntity(
          '123',
          'test@example.com',
          'hashedPassword',
          'Test User',
          role,
          new Date(),
          new Date(),
        );

        const dto = UserResponseDto.fromEntity(user);
        expect(dto.role).toBe(role);
      });
    });
  });
});

