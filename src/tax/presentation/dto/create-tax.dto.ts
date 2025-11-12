import { IsString, IsEnum, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  country: string;

  @IsEnum(TaxType, { message: 'Type must be TRANSACTION or PLATFORM' })
  type: TaxType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage: number;
}

