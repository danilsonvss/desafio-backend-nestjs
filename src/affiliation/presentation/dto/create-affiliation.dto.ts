import { IsString, IsNumber, Min, Max, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAffiliationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do produtor' })
  @IsUUID(4, { message: 'Producer ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Producer ID is required' })
  producerId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID do afiliado' })
  @IsUUID(4, { message: 'Affiliate ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Affiliate ID is required' })
  affiliateId: string;

  @ApiProperty({ example: 10.0, description: 'Percentual de comissão do afiliado (0 a 100)', minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage: number;
}

