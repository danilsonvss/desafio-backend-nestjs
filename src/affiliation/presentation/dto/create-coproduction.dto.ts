import { IsString, IsNumber, Min, Max, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCoproductionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do produtor' })
  @IsUUID(4, { message: 'Producer ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Producer ID is required' })
  producerId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002', description: 'ID do coprodutor' })
  @IsUUID(4, { message: 'Coproducer ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Coproducer ID is required' })
  coproducerId: string;

  @ApiProperty({ example: 15.0, description: 'Percentual de comissão do coprodutor (0 a 100)', minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage: number;
}

