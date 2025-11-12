import { TaxResponseDto } from './tax-response.dto';
import { TaxEntity } from '../../../domain/entities/tax.entity';
import { TaxType } from '../../../../shared/domain/enums/tax-type.enum';

describe('TaxResponseDto', () => {
  describe('fromEntity', () => {
    it('should create DTO from TaxEntity', () => {
      const entity = new TaxEntity(
        'tax-id',
        'BR',
        TaxType.TRANSACTION,
        5.5,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      const dto = TaxResponseDto.fromEntity(entity);

      expect(dto).toBeInstanceOf(TaxResponseDto);
      expect(dto.id).toBe('tax-id');
      expect(dto.country).toBe('BR');
      expect(dto.type).toBe(TaxType.TRANSACTION);
      expect(dto.percentage).toBe(5.5);
      expect(dto.createdAt).toEqual(new Date('2024-01-01'));
      expect(dto.updatedAt).toEqual(new Date('2024-01-02'));
    });

    it('should preserve all entity properties', () => {
      const entity = TaxEntity.create('US', TaxType.PLATFORM, 3.0);

      const dto = TaxResponseDto.fromEntity(entity);

      expect(dto).toMatchObject({
        country: 'US',
        type: TaxType.PLATFORM,
        percentage: 3.0,
      });
      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('createdAt');
      expect(dto).toHaveProperty('updatedAt');
    });
  });
});

