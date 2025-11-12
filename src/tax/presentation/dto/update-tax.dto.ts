import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class UpdateTaxDto {
  @IsString()
  @IsNotEmpty({ message: 'Id is required' })
  id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage: number;
}

