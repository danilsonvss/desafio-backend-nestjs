import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaxDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID da taxa' })
  @IsString()
  @IsNotEmpty({ message: 'Id is required' })
  id: string;

  @ApiProperty({ example: 5.5, description: 'Novo percentual da taxa (0 a 100)', minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage: number;
}

