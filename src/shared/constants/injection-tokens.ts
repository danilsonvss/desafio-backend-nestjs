export const INJECTION_TOKENS = {
  USER_REPOSITORY: 'IUserRepository',
  PASSWORD_HASH_SERVICE: 'IPasswordHashService',
  JWT_SERVICE: 'IJwtService',
} as const;

export type InjectionToken = typeof INJECTION_TOKENS[keyof typeof INJECTION_TOKENS];

