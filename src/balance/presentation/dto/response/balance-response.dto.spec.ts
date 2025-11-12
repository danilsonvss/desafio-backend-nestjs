import { BalanceResponseDto } from './balance-response.dto';
import { BalanceEntity } from '../../../domain/entities/balance.entity';

describe('BalanceResponseDto', () => {
  describe('fromEntity', () => {
    it('should create DTO from BalanceEntity', () => {
      const entity = new BalanceEntity(
        'balance-id',
        'user-id',
        150.75,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      const dto = BalanceResponseDto.fromEntity(entity);

      expect(dto).toBeInstanceOf(BalanceResponseDto);
      expect(dto.id).toBe('balance-id');
      expect(dto.userId).toBe('user-id');
      expect(dto.amount).toBe(150.75);
      expect(dto.createdAt).toEqual(new Date('2024-01-01'));
      expect(dto.updatedAt).toEqual(new Date('2024-01-02'));
    });

    it('should handle zero amount', () => {
      const entity = BalanceEntity.create('user-id');

      const dto = BalanceResponseDto.fromEntity(entity);

      expect(dto.amount).toBe(0);
    });

    it('should preserve all entity properties', () => {
      const entity = new BalanceEntity(
        'id-123',
        'user-456',
        999.99,
        new Date('2024-12-01'),
        new Date('2024-12-31'),
      );

      const dto = BalanceResponseDto.fromEntity(entity);

      expect(dto).toMatchObject({
        id: 'id-123',
        userId: 'user-456',
        amount: 999.99,
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-31'),
      });
    });
  });
});
