import { LoginResponseDto } from './login-response.dto';
import { UserResponseDto } from './user-response.dto';
import { UserRole } from '../../../../shared/domain/enums/user-role.enum';

describe('LoginResponseDto', () => {
  it('should create login response with token and user', () => {
    const userDto = new UserResponseDto();
    userDto.id = '123';
    userDto.email = 'test@example.com';
    userDto.name = 'Test User';
    userDto.role = UserRole.PRODUCER;
    userDto.createdAt = new Date('2024-01-01');
    userDto.updatedAt = new Date('2024-01-02');

    const token = 'jwt-token-123';
    const loginResponse = new LoginResponseDto(token, userDto);

    expect(loginResponse.accessToken).toBe(token);
    expect(loginResponse.user).toBe(userDto);
  });

  it('should have correct structure', () => {
    const userDto = new UserResponseDto();
    const token = 'jwt-token';
    const loginResponse = new LoginResponseDto(token, userDto);

    expect(loginResponse).toHaveProperty('accessToken');
    expect(loginResponse).toHaveProperty('user');
    expect(Object.keys(loginResponse)).toHaveLength(2);
  });
});

