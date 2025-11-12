export const INJECTION_TOKENS = {
  USER_REPOSITORY: 'IUserRepository',
  PASSWORD_HASH_SERVICE: 'IPasswordHashService',
  JWT_SERVICE: 'IJwtService',
  BALANCE_REPOSITORY: 'IBalanceRepository',
  TAX_REPOSITORY: 'ITaxRepository',
  AFFILIATION_REPOSITORY: 'IAffiliationRepository',
  COPRODUCTION_REPOSITORY: 'ICoproductionRepository',
} as const;

export type InjectionToken = typeof INJECTION_TOKENS[keyof typeof INJECTION_TOKENS];

