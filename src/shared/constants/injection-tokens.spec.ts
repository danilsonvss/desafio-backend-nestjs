import { INJECTION_TOKENS } from './injection-tokens';

describe('INJECTION_TOKENS', () => {
  it('should have USER_REPOSITORY token', () => {
    expect(INJECTION_TOKENS.USER_REPOSITORY).toBe('IUserRepository');
  });

  it('should have PASSWORD_HASH_SERVICE token', () => {
    expect(INJECTION_TOKENS.PASSWORD_HASH_SERVICE).toBe('IPasswordHashService');
  });

  it('should have JWT_SERVICE token', () => {
    expect(INJECTION_TOKENS.JWT_SERVICE).toBe('IJwtService');
  });

  it('should have readonly properties via const assertion', () => {
    const originalValue = INJECTION_TOKENS.USER_REPOSITORY;
    expect(originalValue).toBe('IUserRepository');
    expect(typeof INJECTION_TOKENS).toBe('object');
  });

  it('should contain exactly 3 tokens', () => {
    const tokenKeys = Object.keys(INJECTION_TOKENS);
    expect(tokenKeys).toHaveLength(4);
  });
});

