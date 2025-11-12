import { IsString, IsEnum, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

export class CreateTaxDto {
  @ApiProperty({ example: 'BR', description: 'Código do país (ISO 3166-1 alpha-2)' })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  country: string;

  @ApiProperty({ enum: TaxType, example: TaxType.TRANSACTION, description: 'Tipo de taxa' })
  @IsEnum(TaxType, { message: 'Type must be TRANSACTION or PLATFORM' })
  type: TaxType;

  @ApiProperty({ example: 5.0, description: 'Percentual da taxa (0 a 100)', minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage: number;
}

